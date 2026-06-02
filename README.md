# Smart Study Planner System

A comprehensive full-stack web application for managing student tasks, group collaboration, and administrative oversight. Built with React 18, Python Flask, and Supabase PostgreSQL.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

Smart Study Planner is designed for universities to facilitate student academic management and collaboration. It provides:

- **Task Management**: Create, organize, and track study tasks
- **Group Collaboration**: Form study groups, invite members, and communicate in real-time
- **Admin Dashboard**: Manage students, subjects, and monitor group activities
- **Progress Tracking**: Visualize tasks using calendar and list views
- **Secure Authentication**: JWT-based token authentication with role-based access control

## ✨ Features

### For Students
- ✅ User registration (requires admin approval)
- ✅ Task creation and management (list and calendar views)
- ✅ Join/create study groups
- ✅ Real-time group chat
- ✅ Group member management
- ✅ Profile management
- ✅ Notification preferences

### For Admins
- ✅ Dashboard with key statistics
- ✅ Student registration approval system
- ✅ Subject management (CRUD operations)
- ✅ Group monitoring and oversight
- ✅ Student status management (approve, reject, suspend)
- ✅ Activity logging
- ✅ CSV export of group data

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Bootstrap 5** - UI components and styling
- **React Bootstrap** - React components for Bootstrap
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Yup** - Form validation
- **React Big Calendar** - Calendar view for tasks
- **Recharts** - Data visualization
- **Supabase JS** - Supabase client library

### Backend
- **Python 3.8+** - Programming language
- **Flask 2.3.3** - Web framework
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin requests
- **Supabase Python SDK** - Database client
- **Bcrypt** - Password hashing
- **Python-dotenv** - Environment variables

### Database
- **Supabase PostgreSQL** - Cloud database
- **Row Level Security (RLS)** - Data access control

## 📁 Project Structure

```
smart-study-planner/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingLogin.jsx
│   │   │   ├── Registration.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── AdminGroups.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Groups.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.js
│   │   │   └── Navbar.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   ├── .env
│   └── package.json
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── database/
│   └── schema.sql
└── README.md
```

## 💻 Installation

### Prerequisites

- **Node.js 18+** from [nodejs.org](https://nodejs.org)
- **Python 3.8+** from [python.org](https://python.org)
- **Git** from [git-scm.com](https://git-scm.com)
- **Supabase Account** from [supabase.com](https://supabase.com)

### Step 1: Clone/Setup Project

```bash
# Create project directory
mkdir smart-study-planner
cd smart-study-planner
```

### Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the SQL from `database/schema.sql`
3. Get your project credentials:
   - Project URL: Settings > API > URL
   - Service Role Key: Settings > API > Service Role secret
   - Anon Key: Settings > API > anon key

### Step 3: Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file with:
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_SUPABASE_URL=your_project_url
# REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Backend Setup

```bash
# Navigate to backend folder
cd ../backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with:
# FLASK_APP=app.py
# FLASK_ENV=development
# PORT=5000
# SUPABASE_URL=your_project_url
# SUPABASE_KEY=your_service_role_key
# JWT_SECRET_KEY=your_secret_key_here
```

## ⚙️ Configuration

### Frontend Environment Variables

Create `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### Backend Environment Variables

Create `backend/.env`:

```
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
JWT_SECRET_KEY=your_super_secret_key_change_this
```

### Supabase Setup

1. **Enable Authentication**:
   - Go to Authentication > Providers
   - Enable Email authentication

2. **Create Admin User** (optional):
   - Go to SQL Editor
   - Run: `INSERT INTO profiles (id, student_id, full_name, email, role, status) VALUES ('admin-user-id', 'ADMIN001', 'Admin', 'admin@example.com', 'admin', 'active');`
   - Replace 'admin-user-id' with actual auth user UUID

3. **Create Initial Subjects**:
   - Execute SQL in database/schema.sql (uncomment sample data section)

## 🚀 Running the Application

### Terminal 1: Backend

```bash
cd backend
# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run Flask server
python app.py
# Server runs on http://localhost:5000
```

### Terminal 2: Frontend

```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

#### Login
```
POST /api/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "token": "jwt_token", "user": { ... } }
```

#### Register
```
POST /api/register
Body: {
    "student_id": "STU001",
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
}
Response: { "message": "Registration successful! Awaiting admin approval." }
```

### Student Endpoints

#### Get Dashboard
```
GET /api/student/dashboard
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "total_tasks": 5, "upcoming_deadlines": 2, "active_groups": 3, ... }
```

#### Get Tasks
```
GET /api/student/tasks
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "tasks": [...] }
```

#### Create Task
```
POST /api/student/tasks
Headers: { "Authorization": "Bearer jwt_token" }
Body: {
    "title": "Finish Chapter 5",
    "description": "...",
    "subject_id": "uuid",
    "due_date": "2024-02-15"
}
```

#### Get Groups
```
GET /api/student/groups
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "groups": [...] }
```

#### Create Group
```
POST /api/student/groups
Headers: { "Authorization": "Bearer jwt_token" }
Body: { "name": "Study Group", "subject_id": "uuid" }
```

### Admin Endpoints

#### Get Dashboard
```
GET /api/admin/dashboard
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "total_students": 50, "pending_approvals": 5, "active_groups": 10 }
```

#### Get All Students
```
GET /api/admin/students
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "students": [...] }
```

#### Approve Student
```
POST /api/admin/students/{student_id}/approve
Headers: { "Authorization": "Bearer jwt_token" }
```

#### Get All Groups
```
GET /api/admin/groups
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "groups": [...] }
```

## 🗄️ Database Schema

### Tables

1. **profiles** - User information (admin/student)
2. **subjects** - Course subjects
3. **student_subjects** - Student-subject enrollment
4. **groups** - Study groups
5. **group_members** - Group membership and invitations
6. **tasks** - Study tasks and assignments
7. **group_messages** - Real-time group chat

See `database/schema.sql` for detailed structure.

## 👥 User Roles

### Student
- Register account (pending approval)
- Create and manage tasks
- Join/create study groups
- Collaborate with group members
- View profile and manage settings
- Access dashboard and calendar views

### Admin
- Approve/reject student registrations
- Suspend/activate student accounts
- Create and manage subjects
- Monitor all groups
- View student information
- Manage system settings

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the app:
```bash
cd frontend
npm run build
```

2. Deploy to Vercel:
   - Connect GitHub repo to Vercel
   - Set environment variables
   - Deploy

### Backend Deployment (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Production Checklist

- [ ] Change JWT_SECRET_KEY to a strong random value
- [ ] Set FLASK_ENV=production
- [ ] Configure production Supabase project
- [ ] Set up HTTPS
- [ ] Configure CORS for production domain
- [ ] Enable Rate limiting
- [ ] Setup error logging and monitoring
- [ ] Configure database backups
- [ ] Test all authentication flows

## 📝 Notes

- Student registration requires admin approval before access
- JWT tokens expire after 30 days
- Row Level Security ensures data privacy
- Passwords are hashed using bcrypt
- Real-time updates use Supabase subscriptions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Happy coding! 🎓**
