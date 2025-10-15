import React, { useState } from 'react';
import FileSharing from './components/FileSharing';
import TextSharing from './components/TextSharing';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('files');
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  return (
    <div className="App">
      <div className="header">
        <h1>File & Text Sharing System</h1>
        <p>Upload files and share text content with others</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          File Sharing
        </button>
        <button
          className={`nav-tab ${activeTab === 'texts' ? 'active' : ''}`}
          onClick={() => setActiveTab('texts')}
        >
          Text Sharing
        </button>
      </div>

      {activeTab === 'files' ? (
        <FileSharing showMessage={showMessage} />
      ) : (
        <TextSharing showMessage={showMessage} />
      )}
    </div>
  );
}

export default App;