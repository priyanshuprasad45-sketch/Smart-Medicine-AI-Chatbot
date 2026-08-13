import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      type: "text", 
      text: "Welcome to Smart Medicine AI! 💊\n\nI can analyze medicine packaging labels using OCR and retrieve detailed drug documentation. You can also type a drug name directly (fuzzy matching will handle minor spelling mistakes!)." 
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Quick chips definitions
  const sampleMeds = ["Metformin", "Atorvastatin", "Omeprazole", "Albuterol"];
  const sampleTypos = ["paracetml", "cetrizin", "ibuprufen", "asprin"];

  // 🔹 SEND TEXT QUERY
  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const userMessage = { sender: "user", type: "text", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://smart-medicine-api.onrender.com/search-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: query }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { 
            sender: "bot", 
            type: "drug-card", 
            data: data.data,
            text: `Here is the information for ${data.data.name}:`
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "text", text: `❌ ${data.message || "Medicine not found."}` }
        ]);
      }
    } catch (error) {
      console.error("Text search error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", type: "text", text: "❌ Failed to connect to server. Please verify the API backend is online." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 IMAGE UPLOAD & OCR
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);

    setMessages((prev) => [
      ...prev,
      { 
        sender: "user", 
        type: "text", 
        text: `📎 Scanned label: ${file.name}`,
        imagePreview: previewUrl 
      }
    ]);
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("https://smart-medicine-api.onrender.com/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { 
            sender: "bot", 
            type: "drug-card", 
            data: data.data,
            extractedText: data.extracted_text,
            text: `Successfully matched medicine label OCR scanner details:`
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { 
            sender: "bot", 
            type: "text", 
            text: `❌ OCR Match Failure.\n\nCould not match any drug in our database based on the scanned image. Try a clearer image.\n\nScanned Text:\n"${data.extracted_text || "No text detected."}"` 
          }
        ]);
      }
    } catch (error) {
      console.error("Image upload/OCR error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", type: "text", text: "❌ Server error occurred. Ensure OpenCV & Tesseract are running correctly on Flask backend." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick search handler
  const handleChipClick = (term) => {
    if (!loading) {
      handleSend(term);
    }
  };

  // Render icons inside details
  const renderIcon = (type) => {
    switch(type) {
      case 'uses':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        );
      case 'dosage':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'side_effects':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'precautions':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      
      {/* 💻 SIDEBAR */}
      <div className="sidebar">
        
        <div className="logo-section">
          <div className="logo-icon">AI</div>
          <div className="logo-title-group">
            <h2>Smart Medicine AI</h2>
            <span>SLM & OCR Assistant</span>
          </div>
        </div>

        <div className="system-status">
          <div className="status-item">
            <span className="status-dot"></span>
            <span className="status-label">OCR Core Engine</span>
            <span className="status-val">ONLINE</span>
          </div>
          <div className="status-item">
            <span className="status-dot"></span>
            <span className="status-label">Fuzzy Database</span>
            <span className="status-val">17 Drugs</span>
          </div>
        </div>

        <div className="quick-tests">
          <span className="quick-tests-title">Common Medications</span>
          <div className="chip-group">
            {sampleMeds.map((med) => (
              <button 
                key={med} 
                className="test-chip" 
                onClick={() => handleChipClick(med)}
                disabled={loading}
              >
                💊 {med}
              </button>
            ))}
          </div>

          <span className="quick-tests-title">Test Fuzzy Match (Typos)</span>
          <div className="chip-group">
            {sampleTypos.map((typo) => (
              <button 
                key={typo} 
                className="test-chip typo" 
                onClick={() => handleChipClick(typo)}
                disabled={loading}
              >
                ✏️ {typo}
              </button>
            ))}
          </div>
        </div>

        {/* PROFILE / CREDITS */}
        <div className="profile-footer">
          <div className="profile-card">
            <div className="profile-avatar">P</div>
            <div className="profile-info">
              <span className="profile-name">Priyanshu</span>
              <a 
                href="https://github.com/priyanshuprasad45-sketch" 
                target="_blank" 
                rel="noopener noreferrer"
                className="profile-role"
                style={{ textDecoration: "none", color: "var(--text-muted)", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => e.target.style.color = "var(--accent-blue)"}
                onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
              >
                github.com/priyanshuprasad45-sketch
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* 💬 MAIN CHAT AREA */}
      <div className="chat-area">
        
        {/* CHAT HEADER */}
        <div className="chat-header">
          <div className="chat-header-dot"></div>
          <div>
            <h3>Active Clinical Chat Session</h3>
            <p>Ready to search drugs or analyze labels</p>
          </div>
        </div>

        {/* CHAT MESSAGES DISPLAY */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender}`}>
              <div className="message-inner">
                {msg.type === "text" && (
                  <div>
                    {msg.text.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                    {msg.imagePreview && (
                      <img 
                        src={msg.imagePreview} 
                        alt="Scanned Pack Shot Preview" 
                        className="uploaded-image-preview" 
                      />
                    )}
                  </div>
                )}

                {msg.type === "drug-card" && (
                  <div className="drug-card">
                    <div className="drug-card-header">
                      <h4 className="drug-title">{msg.data.name}</h4>
                      <span className={`confidence-badge ${
                        msg.extractedText ? "ocr-flag" : msg.data.confidence > 90 ? "high" : "medium"
                      }`}>
                        {msg.extractedText 
                          ? `OCR MATCH (${msg.data.confidence}%)` 
                          : `${msg.data.confidence}% MATCH`
                        }
                      </span>
                    </div>
                    <div className="drug-card-body">
                      
                      <div className="drug-detail-row">
                        <div className="detail-icon-box">{renderIcon('uses')}</div>
                        <div className="detail-content">
                          <span className="detail-label">Indications & Uses</span>
                          <span className="detail-value">{msg.data.uses}</span>
                        </div>
                      </div>

                      <div className="drug-detail-row">
                        <div className="detail-icon-box">{renderIcon('dosage')}</div>
                        <div className="detail-content">
                          <span className="detail-label">Recommended Dosage</span>
                          <span className="detail-value">{msg.data.dosage}</span>
                        </div>
                      </div>

                      <div className="drug-detail-row">
                        <div className="detail-icon-box">{renderIcon('side_effects')}</div>
                        <div className="detail-content">
                          <span className="detail-label">Potential Side Effects</span>
                          <span className="detail-value">{msg.data.side_effects}</span>
                        </div>
                      </div>

                      <div className="drug-detail-row">
                        <div className="detail-icon-box">{renderIcon('precautions')}</div>
                        <div className="detail-content">
                          <span className="detail-label">Safety Precautions</span>
                          <span className="detail-value">{msg.data.precautions}</span>
                        </div>
                      </div>

                      {msg.extractedText && (
                        <div className="ocr-info-box">
                          <span>Scanned Label Raw OCR Content:</span>
                          <br />
                          "{msg.extractedText}"
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="message-bubble bot">
              <div className="message-inner">
                <div className="bot-typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatRef}></div>
        </div>

        {/* INPUT PANEL */}
        <div className="chat-input-container">
          <div className="input-form">
            
            {/* Scanned Image Selector */}
            <input
              type="file"
              id="fileSelector"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={loading}
            />

            <button
              className="action-btn upload"
              title="Scan Medicine Pack Label (OCR)"
              onClick={() => document.getElementById("fileSelector").click()}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>

            <input
              type="text"
              placeholder="Search drug dataset (e.g. Paracetamol, Metformin...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />

            <button 
              className="action-btn send" 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}

export default App;