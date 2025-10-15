import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FileSharing({ showMessage }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files');
      setFiles(response.data.files);
    } catch (error) {
      showMessage('Error fetching files: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage('Please select a file first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showMessage(response.data.message, 'success');
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      fetchFiles();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      showMessage('Upload failed: ' + errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`/api/download/${filename}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showMessage('File downloaded successfully', 'success');
    } catch (error) {
      showMessage('Download failed: ' + error.message, 'error');
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await axios.delete(`/api/delete/${filename}`);
      showMessage('File deleted successfully', 'success');
      fetchFiles();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      showMessage('Delete failed: ' + errorMessage, 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="upload-section">
        <h2>Upload File</h2>
        <div className="file-input-container">
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            className="file-input"
            disabled={uploading}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="upload-btn"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Allowed types: txt, pdf, png, jpg, jpeg, gif, doc, docx, zip, rar... (Max: 16GB)
        </p>
      </div>

      <div className="files-section">
        <div className="files-header">
          <h2>Available Files ({files.length})</h2>
        </div>

        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="no-files">
            <p>No files uploaded yet</p>
          </div>
        ) : (
          <ul className="files-list">
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-details">
                    Size: {formatFileSize(file.size)} | 
                    Modified: {formatDate(file.modified)}
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="download-btn"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
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

export default FileSharing;