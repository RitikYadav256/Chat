import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import socket from '../socket'; // Adjust path if needed

const Login = () => {
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log(data.name);
      localStorage.setItem("Name", data.name);
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        socket.auth = { token: data.token };
        socket.connect(); // reconnect with auth
        setSuccessMessage(`Welcome, ${form.name}! Redirecting...`);
        setTimeout(() => {
          navigate('/chat');
        }, 1000);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Try again.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Welcome Back!</h2>
        <p className={styles.description}>Please enter your credentials to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className={styles.button} type="submit">Login</button>
          {error && <p className={styles.error}>{error}</p>}
          {successMessage && <p className={styles.success}>{successMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
