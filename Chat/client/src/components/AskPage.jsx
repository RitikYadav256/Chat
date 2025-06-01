import React from "react";

const AskPage = () => {
  const handleAsk = async () => {
    try {
      const response = await fetch("https://chat-nlss.onrender.com/api/send-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Chat request",
          message: "Hi i am Amaiyara and i am  online and i want to talk",
        }),
      });

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      alert("Failed to send email.");
      console.error(err);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ marginTop: "100px" }}>
        <h2>Ask To Chat</h2>
        <button
          onClick={handleAsk}
          style={{
            padding: "10px 20px",
            fontSize: "18px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Ask
        </button>
      </div>

      <footer
        style={{
          backgroundColor: "#f1f1f1",
          padding: "15px 0",
          marginTop: "50px",
          fontSize: "14px",
          color: "#555",
        }}
      >
        <p>© 2025 Ask Support. All rights reserved.</p>
        <p>
          Built with ❤️ by{" "}
          <a href="https://your-portfolio-link.com" target="_blank" rel="noreferrer">
            Your Name
          </a>
        </p>
      </footer>
    </div>
  );
};

export default AskPage;
