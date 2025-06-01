import React, { useEffect, useState, useRef } from 'react';
import socket from '../socket'; // Your initialized socket.io client
import EmojiPicker from 'emoji-picker-react';
import styles from './chat.module.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  console.log(chatLog);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fileInputRef = useRef(null);
  const chatBoxRef = useRef(null);

  const generateId = () => Date.now() + Math.random().toString(36).substring(2, 9);
  
  useEffect(() => {
    socket.on('receive_message', (data) => {
      const isSelf = data.senderId === socket.id || data.fromSelf === true;
      setChatLog((prev) => [...prev, { ...data, fromSelf: isSelf }]);
    });

    socket.on('edit_message', ({ id, newContent }) => {
      setChatLog((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, content: newContent } : msg))
      );
    });

    socket.on('delete_message', (id) => {
      setChatLog((prev) => prev.filter((msg) => msg.id !== id));
    });

    return () => {
      socket.off('receive_message');
      socket.off('edit_message');
      socket.off('delete_message');
    };
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(`.${styles.menu}`) &&
        !e.target.closest(`.${styles.menuButton}`)
      ) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const sendMessage = (msgData) => {
    setChatLog(prev => [...prev, { ...msgData, fromSelf: true }]);
    socket.emit('send_message', { ...msgData, fromSelf: true });
  };
  

  const handleSendText = () => {
    const name = localStorage.getItem("Name");
    console.log(name);
    if (!message.trim()) return;
    const msgData = {
      id: generateId(),
      type: 'text',
      name:name,
      content: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    sendMessage(msgData);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader();
      reader.onload = () => {
        const msgData = {
          id: generateId(),
          type: fileType,
          content: reader.result,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileName: file.name,
        };
        sendMessage(msgData);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Only image and video files are supported.');
    }

    e.target.value = null;
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const startEditing = (msg) => {
    if (msg.type !== 'text') return;
    setEditId(msg.id);
    setEditText(msg.content);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    socket.emit('edit_message', { id: editId, newContent: editText.trim() });
    setChatLog((prev) =>
      prev.map((msg) => (msg.id === editId ? { ...msg, content: editText.trim() } : msg))
    );
    setEditId(null);
    setEditText('');
  };

  const deleteMessage = (id) => {
    socket.emit('delete_message', id);
    setChatLog((prev) => prev.filter((msg) => msg.id !== id));
    setMenuOpenId(null);
  };

  return (
    <div className={styles.appWrapper}>
      <main className={styles.container}>
        {/* Chat messages */}
        <div
          className={styles.chatBox}
          ref={chatBoxRef}
          aria-live="polite"
          aria-relevant="additions"
        > 
          {chatLog.map((msg) => (
            
            <div
              key={msg.id}
              tabIndex={0}
              aria-label={`${msg.fromSelf ? 'You' : 'Other'} message: ${
                msg.type === 'text' ? msg.content : msg.type
              }`}
              // Swap incoming/outgoing classes here to put your messages on left
              className={`${styles.message} ${msg.fromSelf ? styles.incoming : styles.outgoing}`}
            >
              <nav className={styles.name1}>{msg.name}</nav>
              <div className={styles.bubble}>
                {editId === msg.id ? (
                  <>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={styles.editInput}
                      aria-label="Edit message input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        else if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className={styles.editButtons}>
                      <button
                        onClick={saveEdit}
                        className={styles.saveBtn}
                        aria-label="Save edited message"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={styles.cancelBtn}
                        aria-label="Cancel editing"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                    <>
                    
                    {msg.type === 'text' && (
                      <span className={styles.messageText}>{msg.content}</span>
                    )}

                    {msg.type === 'image' && (
                      <img
                        src={msg.content}
                        alt={msg.fileName || 'image'}
                        className={styles.media}
                        loading="lazy"
                      />
                    )}

                    {msg.type === 'video' && (
                      <video controls className={styles.media} preload="metadata">
                        <source
                          src={msg.content}
                          type={msg.fileName?.endsWith('.mp4') ? 'video/mp4' : ''}
                        />
                        Your browser does not support the video tag.
                      </video>
                    )}

                    <small className={styles.timestamp}>{msg.time}</small>

                    {msg.type === 'text' && msg.fromSelf && (
                      <div className={styles.menuWrapper}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId((current) => (current === msg.id ? null : msg.id));
                          }}
                          className={styles.menuButton}
                          aria-label="Open message options"
                          title="Options"
                        >
                          ⋮
                        </button>

                        {menuOpenId === msg.id && (
                          <div className={styles.menu} role="menu">
                            <button
                              onClick={() => startEditing(msg)}
                              className={styles.menuItem}
                              role="menuitem"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className={styles.menuItem}
                              role="menuitem"
                            >
                              Unsend
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className={styles.inputArea}>
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={styles.emojiToggleBtn}
            aria-label="Toggle emoji picker"
            title="Toggle emoji picker"
            type="button"
          >
            😊
          </button>

          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendText();
            }}
            className={styles.input}
            aria-label="Message input"
          />

          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className={styles.uploadButton}
            type="button"
            aria-label="Upload image or video"
            title="Upload image or video"
          >
            📎
          </button>

          <button
            onClick={handleSendText}
            className={styles.sendButton}
            aria-label="Send message"
            title="Send message"
          >
            ➤
          </button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className={styles.emojiPicker} aria-label="Emoji picker" role="dialog">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </main>
    </div>
  );
}

export default Chat;
