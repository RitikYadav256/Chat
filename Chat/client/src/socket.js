// src/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://chat-nlss.onrender.com'; // 
const token = localStorage.getItem('token'); // 


const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  auth: {
    token: token 
  }
});

export default socket;
