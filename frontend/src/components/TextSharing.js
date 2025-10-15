import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TextSharing({ showMessage }) {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  });

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/texts');
      setTexts(response.data.texts);
    } catch (error) {
      showMessage('Error fetching texts: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateNew = () => {
    setEditingText(null);
    setFormData({ title: '', content: '', author: '' });
    setShowEditor(true);
  };

  const handleEdit = async (textId) => {
    try {
      const response = await axios.get(`/api/texts/${textId}`);
      const text = response.data.text;
      setEditingText(text);
      setFormData({
        title: text.title,
        content: text.content,
        author: text.author
      });
      setShowEditor(true);
    } catch (error) {
      showMessage('Error loading text: ' + error.message, 'error');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showMessage('Title and content are required', 'error');
      return;
    }

    try {
      if (editingText) {
        await axios.put(`/api/texts/${editingText.id}`, formData);
        showMessage('Text updated successfully', 'success');
      } else {
        await axios.post('/api/texts', formData);
        showMessage('Text created successfully', 'success');
      }
      
      setShowEditor(false);
      setEditingText(null);
      setFormData({ title: '', content: '', author: '' });
      fetchTexts();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      showMessage('Save failed: ' + errorMessage, 'error');
    }
  };

  const handleDelete = async (textId) => {
    if (!window.confirm('Are you sure you want to delete this text?')) {
      return;
    }

    try {
      await axios.delete(`/api/texts/${textId}`);
      showMessage('Text deleted successfully', 'success');
      fetchTexts();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      showMessage('Delete failed: ' + errorMessage, 'error');
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingText(null);
    setFormData({ title: '', content: '', author: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (showEditor) {
    return (
      <div className="text-editor">
        <div className="editor-header">
          <h2>{editingText ? 'Edit Text' : 'Create New Text'}</h2>
        </div>
        
        <div className="editor-form">
          <div className="form-group">
            <label htmlFor="author">Author:</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="Your name (optional)"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter title..."
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter your text content..."
              className="form-textarea"
              rows="15"
              required
            />
          </div>
          
          <div className="editor-actions">
            <button onClick={handleSave} className="save-btn">
              {editingText ? 'Update' : 'Create'}
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-actions">
        <button onClick={handleCreateNew} className="create-btn">
          Create New Text
        </button>
      </div>

      <div className="texts-section">
        <div className="texts-header">
          <h2>Shared Texts ({texts.length})</h2>
        </div>

        {loading ? (
          <div className="loading">Loading texts...</div>
        ) : texts.length === 0 ? (
          <div className="no-texts">
            <p>No texts shared yet</p>
          </div>
        ) : (
          <ul className="texts-list">
            {texts.map((text) => (
              <li key={text.id} className="text-item">
                <div className="text-info">
                  <div className="text-title">{text.title}</div>
                  <div className="text-meta">
                    By: {text.author} | 
                    Created: {formatDate(text.created)} | 
                    Modified: {formatDate(text.modified)}
                  </div>
                  <div className="text-preview">{text.preview}</div>
                </div>
                <div className="text-actions">
                  <button
                    onClick={() => handleEdit(text.id)}
                    className="edit-btn"
                  >
                    View/Edit
                  </button>
                  <button
                    onClick={() => handleDelete(text.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TextSharing;