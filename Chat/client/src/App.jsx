import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/chat';
import Header from './components/Header';
import AskPage from './components/AskPage';
function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/Ask" element={<AskPage/>} />
      </Routes>
    </Router>
  );
}

export default App;
