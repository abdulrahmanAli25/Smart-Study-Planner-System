# Windows 10 Development Setup Guide

Complete step-by-step setup for Smart Study Planner System on Windows 10.

## 📋 Prerequisites Installation

### 1. Install Node.js (18+)

1. Visit [nodejs.org](https://nodejs.org)
2. Download the LTS version (18.x or later)
3. Run the installer and follow prompts
4. Check `Add to PATH` during installation
5. Verify installation:

```bash
node --version
npm --version
```

### 2. Install Python (3.8+)

1. Visit [python.org](https://www.python.org/downloads/windows/)
2. Download Python 3.10 or later
3. **IMPORTANT**: Check "Add Python to PATH" during installation
4. Verify installation:

```bash
python --version
pip --version
```

### 3. Install Git for Windows

1. Visit [git-scm.com](https://git-scm.com/download/win)
2. Download and install Git for Windows
3. Use default settings
4. Verify installation:

```bash
git --version
```

### 4. Install VS Code

1. Visit [code.visualstudio.com](https://code.visualstudio.com)
2. Download and install VS Code
3. Install recommended extensions:
   - **ES7+ React/Redux/React-Native snippets** by dsznajder.es7-react-js-snippets
   - **Prettier - Code formatter** by esbenp.prettier-vscode
   - **Python** by ms-python.python
   - **Thunder Client** by rangav.vscode-thunder-client (for API testing)
   - **Supabase** by supabase (optional)

## 🗂️ Project Setup

### Step 1: Create Project Directory

```bash
# Open PowerShell or Command Prompt
# Navigate to Desktop
cd Desktop

# Create project folder
mkdir "Smart Study planner"
cd "Smart Study planner"

# Initialize git
git init
```

### Step 2: Create Project Structure

```bash
# Create folders
mkdir frontend
mkdir backend
mkdir database

# Create files
echo. > README.md
echo. > .gitignore
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Create React app (optional if using pre-made files)
# npx create-react-app .

# If using provided package.json, install dependencies
npm install

# Create .env file
echo REACT_APP_API_URL=http://localhost:5000 > .env
echo REACT_APP_SUPABASE_URL=your_project_url >> .env
echo REACT_APP_SUPABASE_ANON_KEY=your_anon_key >> .env

# Test if React starts
npm start
# Should open at http://localhost:3000

# Stop with Ctrl+C
```

### Step 4: Backend Setup

```bash
# Navigate to backend folder
cd ../backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On PowerShell:
venv\Scripts\Activate.ps1

# If you get execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# On Command Prompt:
# venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Using PowerShell:
@"
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
JWT_SECRET_KEY=your_secret_key_here
"@ | Out-File -Encoding UTF8 .env

# Or manually create .env with Notepad:
# Right-click in folder > New > Text Document
# Name it ".env" (with the dot)
# Add the above content

# Test if Flask starts
python app.py
# Should run on http://localhost:5000

# Stop with Ctrl+C
```

## 🔑 Supabase Configuration

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or login
3. Click "New Project"
4. Fill in project details
5. Wait for project initialization (2-3 minutes)

### 2. Get Project Credentials

1. Go to **Settings** > **API**
2. Copy:
   - **URL**: Project URL
   - **Service Role secret**: Service Role Key (backend .env)
   - **anon public**: Anon Key (frontend .env)

### 3. Setup Database Schema

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy all SQL from `database/schema.sql`
4. Paste into SQL editor
5. Click **Run**

### 4. Enable Authentication

1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Go to **Authentication** > **Settings**
4. Set **Site URL** to `http://localhost:3000`
5. Set **Redirect URLs** to:
   - `http://localhost:3000/`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/admin`

### 5. Create Admin User (Optional)

1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter admin email and password
4. Go to **SQL Editor**
5. Create new query:

```sql
INSERT INTO profiles (id, student_id, full_name, email, role, status)
SELECT id, 'ADMIN001', 'Admin User', email, 'admin', 'active'
FROM auth.users WHERE email = 'your_admin_email@example.com';
```

## 🚀 Running the Application

### Method 1: Separate Terminals (Recommended)

#### Terminal 1: Backend

```bash
# Navigate to project root
cd "Smart Study planner"

# Navigate to backend
cd backend

# Activate virtual environment
venv\Scripts\Activate.ps1
# Or for Command Prompt:
# venv\Scripts\activate.bat

# Run Flask
python app.py
# Output: WARNING in app.run(): This is a development server...
#         Running on http://127.0.0.1:5000
```

#### Terminal 2: Frontend

```bash
# Open new PowerShell/Command Prompt

# Navigate to project root
cd "Smart Study planner"

# Navigate to frontend
cd frontend

# Start React
npm start
# Output: Local:            http://localhost:3000
#        App will open in browser
```

### Method 2: Using VS Code Integrated Terminal

1. Open VS Code
2. Open folder: File > Open Folder > Select "Smart Study planner"
3. Open Terminal: View > Terminal
4. Split terminal: Click split icon
5. In first terminal: `cd backend && venv\Scripts\Activate.ps1 && python app.py`
6. In second terminal: `cd frontend && npm start`

## 🧪 Testing the Application

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Testing**: Use Thunder Client in VS Code

### Test Login

1. Create student account:
   - Go to Registration page
   - Fill in details and register
   - Wait for admin approval (or approve from Supabase directly)

2. Login as student:
   - Use your registered email
   - Access dashboard

3. Login as admin (if created):
   - Use admin credentials
   - Access admin panel

## 🐛 Troubleshooting

### Node/npm not found

```bash
# Close and reopen PowerShell/CMD after installing Node
# Verify:
node --version
```

### Python venv activation fails

```bash
# Try alternative activation:
# PowerShell (as Administrator):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again:
venv\Scripts\Activate.ps1
```

### Port 3000 or 5000 already in use

```bash
# Find and kill process on port 3000 (Windows):
# PowerShell (as Administrator):
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Or change port in frontend:
# In package.json scripts:
# "start": "set PORT=3001 && react-scripts start"
```

### Supabase connection failed

```
# Verify .env files:
# Frontend: REACT_APP_API_URL, REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
# Backend: SUPABASE_URL, SUPABASE_KEY, JWT_SECRET_KEY

# Test connection:
# Backend - check for connection errors in console
# Frontend - check browser console (F12)
```

### CORS errors

```
# Backend .env:
FLASK_ENV=development

# Ensure Flask-CORS is installed:
pip install flask-cors

# Restart Flask server
```

## 📦 Installing New Packages

### Frontend (Node)

```bash
cd frontend
npm install package-name
```

### Backend (Python)

```bash
cd backend
# Activate venv first
venv\Scripts\Activate.ps1

pip install package-name

# Update requirements.txt:
pip freeze > requirements.txt
```

## 📁 Useful Commands

```bash
# Create folder
mkdir folder_name

# Create file
echo. > filename.txt
# or
New-Item -Name filename.txt -ItemType File

# Navigate
cd folder_name
cd ..

# List files
dir
# or
ls

# Copy file
copy source.txt destination.txt

# Remove file
del filename.txt

# Remove folder
rmdir folder_name /s
```

## 🔄 VS Code Extensions for Development

Install in VS Code:

1. **ES7+ React/Redux/React-Native snippets**
   - Shortcut: `rfce` for functional component
   - `useState`, `useEffect` snippets

2. **Prettier**
   - Format code: Shift+Alt+F
   - Auto format on save: Enable in VS Code settings

3. **Python**
   - IntelliSense for Python
   - Debugging support

4. **Thunder Client**
   - Test API endpoints
   - Alternative to Postman

## 💡 Tips for Windows Development

1. **Use PowerShell over Command Prompt** - Better autocomplete
2. **Pin terminal to taskbar** - Quick access
3. **Use `npm run` for multiple commands** - Create npm scripts
4. **Keep .env files in .gitignore** - Never commit credentials
5. **Use relative paths** - Better cross-platform compatibility

## 🎓 Next Steps

1. Read the main README.md for full documentation
2. Explore the codebase structure
3. Review database schema
4. Test all API endpoints
5. Deploy to production when ready

---

**Happy coding! 🚀**
