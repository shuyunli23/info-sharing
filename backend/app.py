from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
TEXT_FOLDER = 'texts'
MAX_FILE_SIZE = 16 * 1024 * 1024 * 1024 # 16GB max file size or 16 * 1024 * 1024: 16MB
ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'zip', 'rar', 'jfif', 'pptx', 'xlsx', 'json', 'csv'
    }

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEXT_FOLDER'] = TEXT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEXT_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_info(filename):
    """Get file information"""
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        stat = os.stat(filepath)
        return {
            'name': filename,
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
        }
    return None

def get_text_info(text_id):
    """Get text information"""
    filepath = os.path.join(app.config['TEXT_FOLDER'], f"{text_id}.json")
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        except Exception:
            return None
    return None

# File sharing endpoints
@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload file endpoint"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate unique filename to avoid conflicts
        original_filename = secure_filename(file.filename)
        name, ext = os.path.splitext(original_filename)
        unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': unique_filename,
            'original_name': original_filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            file_info = get_file_info(filename)
            if file_info:
                files.append(file_info)
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download file endpoint"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete file endpoint"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        os.remove(filepath)
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Text sharing endpoints
@app.route('/api/texts', methods=['POST'])
def create_text():
    """Create new text document"""
    try:
        data = request.get_json()
        
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Title and content are required'}), 400
        
        text_id = uuid.uuid4().hex[:12]
        text_data = {
            'id': text_id,
            'title': data['title'].strip(),
            'content': data['content'],
            'created': datetime.now().isoformat(),
            'modified': datetime.now().isoformat(),
            'author': data.get('author', 'Anonymous').strip()
        }
        
        filepath = os.path.join(app.config['TEXT_FOLDER'], f"{text_id}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(text_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'message': 'Text created successfully',
            'text': text_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/texts', methods=['GET'])
def list_texts():
    """List all text documents"""
    try:
        texts = []
        for filename in os.listdir(app.config['TEXT_FOLDER']):
            if filename.endswith('.json'):
                text_id = filename[:-5]  # Remove .json extension
                text_info = get_text_info(text_id)
                if text_info:
                    # Don't include full content in list view
                    text_summary = {
                        'id': text_info['id'],
                        'title': text_info['title'],
                        'author': text_info['author'],
                        'created': text_info['created'],
                        'modified': text_info['modified'],
                        'preview': text_info['content'][:100] + ('...' if len(text_info['content']) > 100 else '')
                    }
                    texts.append(text_summary)
        
        # Sort by modification time (newest first)
        texts.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({'texts': texts}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/texts/<text_id>', methods=['GET'])
def get_text(text_id):
    """Get specific text document"""
    try:
        text_data = get_text_info(text_id)
        
        if not text_data:
            return jsonify({'error': 'Text not found'}), 404
        
        return jsonify({'text': text_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/texts/<text_id>', methods=['PUT'])
def update_text(text_id):
    """Update text document"""
    try:
        data = request.get_json()
        
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Title and content are required'}), 400
        
        text_data = get_text_info(text_id)
        if not text_data:
            return jsonify({'error': 'Text not found'}), 404
        
        # Update the text data
        text_data['title'] = data['title'].strip()
        text_data['content'] = data['content']
        text_data['modified'] = datetime.now().isoformat()
        if 'author' in data:
            text_data['author'] = data['author'].strip()
        
        filepath = os.path.join(app.config['TEXT_FOLDER'], f"{text_id}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(text_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'message': 'Text updated successfully',
            'text': text_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/texts/<text_id>', methods=['DELETE'])
def delete_text(text_id):
    """Delete text document"""
    try:
        filepath = os.path.join(app.config['TEXT_FOLDER'], f"{text_id}.json")
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Text not found'}), 404
        
        os.remove(filepath)
        return jsonify({'message': 'Text deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)