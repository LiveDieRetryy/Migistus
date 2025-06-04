// Extract chat system for reuse across different pages
import React, { useState, useEffect } from 'react';
import { containsProfanity, filterProfanity, profanityList } from './ProfanityFilter.js';
// ...existing code for chat system, using the imported profanity functions...

const ChatSystem = (props) => {
  // ...existing code...
  return (
    <div className="chat-system">
      {/* ...existing code... */}
      <div className="chat-messages">
        {props.messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className="chat-username">
              {msg.user}
            </span>
            <span className="chat-text">
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      {/* ...existing code... */}
    </div>
  );
};

export default ChatSystem;