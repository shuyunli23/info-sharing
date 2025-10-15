# File Sharing App

A simple file and text upload/download system with a Python backend and a React frontend.

## Project Structure

```
info-sharing-app/
├── backend/
│   ├── app.py
│   ├── pyproject.toml
│   ├── uploads/
│   └── texts/
└── frontend/
    ├── package.json
    └── src/
        ├── App.js
        ├── App.css
        └── components/
            ├── FileSharing.js
            └── TextSharing.js
```

## Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# For Windows (PowerShell or CMD):
.venv\Scripts\activate

# For macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -e .

# Start the server
python run.py
```

## Frontend Setup

```bash
# Back up existing frontend code
mv frontend frontend_backup

# Create a new React project
npx create-react-app frontend

# Restore original code into the new project
cp -r frontend_backup/src/components frontend/src/
cp frontend_backup/src/App.js frontend/src/
cp frontend_backup/src/App.css frontend/src/
cp frontend_backup/package.json frontend/

cd frontend

# Install required dependencies
npm install axios styled-components

# Start the development server
npm start
```


## Run Frontend & Backend Together

Windows (PowerShell):
```powershell
Start-Process powershell "cd backend; .venv\Scripts\activate; python app.py" ; Start-Process powershell "cd frontend; npm start"
```

macOS / Linux:
```bash
( cd backend && source .venv/bin/activate && python app.py) & ( cd frontend && npm start )
# log
( cd backend && source .venv/bin/activate && python app.py > backend.log 2>&1 ) & ( cd frontend && npm start )
```


