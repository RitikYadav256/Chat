require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY;
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Dummy users (hardcoded for demo)
const users = JSON.parse(process.env.USERS);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  }
});

// Login route
app.post('/login', (req, res) => {
  const { name, password } = req.body;
  const user = users.find(u => u.name === name && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ name: user.name }, SECRET_KEY, { expiresIn: '1h' });
  console.log('Login:', name);
  res.json({ token, name: user.name });
});

// Email sending route
app.post('/api/send-mail', async (req, res) => {
  const { subject, message, to } = req.body;
  console.log("Asking to mail");
  const mailOptions = {
    from: process.env.user,
    to: to || process.env.user,
    subject: subject || 'She wants to talk',
    text: message || 'She is online and wants to talk'
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

// JWT auth middleware (for protected REST routes, if needed)
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
};

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name}, ID: ${socket.id}`);

  socket.on('send_message', (msgData) => {
    socket.broadcast.emit('receive_message', { ...msgData, senderId: socket.id });
  });

  socket.on('edit_message', ({ id, newContent }) => {
    socket.broadcast.emit('edit_message', { id, newContent });
  });

  socket.on('delete_message', (id) => {
    socket.broadcast.emit('delete_message', id);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });

  socket.on('error', (err) => {
    console.error('Socket Error:', err.message);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
