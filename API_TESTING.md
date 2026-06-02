# API Testing Guide

Complete guide for testing Smart Study Planner API using Thunder Client.

## 🚀 Getting Started with Thunder Client

### Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "Thunder Client"
4. Install by rangav.vscode-thunder-client

### Basic Usage

1. Open Thunder Client: View > Command Palette > Thunder Client
2. Create a new request
3. Select HTTP method (GET, POST, etc.)
4. Enter endpoint URL
5. Click "Send"

## 🔑 Authentication Setup

### Get JWT Token

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/login`
3. **Headers**:
   - Content-Type: application/json
4. **Body** (JSON):
```json
{
    "email": "student@example.com",
    "password": "StudentPass123"
}
```
5. **Send** and copy the `token` value
6. Store in Thunder Client: Settings > Environment Variables

### Set Environment Variable

1. Click "Env" in Thunder Client
2. Create new environment: "Local Development"
3. Add variable:
   - Name: `token`
   - Value: `your_jwt_token_here`
4. Add variable:
   - Name: `baseUrl`
   - Value: `http://localhost:5000`

### Use in Requests

In headers, use:
```
Authorization: Bearer {{token}}
```

## 📝 API Endpoints Testing

### 1. Authentication Endpoints

#### Register Student
```
Method: POST
URL: {{baseUrl}}/api/register
Headers: Content-Type: application/json
Body:
{
    "student_id": "STU001",
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
}
Expected: 201 Created
Response:
{
    "message": "Registration successful! Awaiting admin approval."
}
```

#### Login
```
Method: POST
URL: {{baseUrl}}/api/login
Headers: Content-Type: application/json
Body:
{
    "email": "john@example.com",
    "password": "SecurePass123"
}
Expected: 200 OK
Response:
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
        "id": "uuid",
        "email": "john@example.com",
        "full_name": "John Doe",
        "role": "student",
        "student_id": "STU001",
        "status": "active"
    }
}
```

### 2. Student Dashboard Endpoints

#### Get Dashboard
```
Method: GET
URL: {{baseUrl}}/api/student/dashboard
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "total_tasks": 5,
    "upcoming_deadlines": 2,
    "active_groups": 3,
    "subjects": [...],
    "recent_tasks": [...],
    "pending_invites": [...]
}
```

### 3. Task Endpoints

#### Get All Tasks
```
Method: GET
URL: {{baseUrl}}/api/student/tasks
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "tasks": [
        {
            "id": "uuid",
            "title": "Read Chapter 5",
            "description": "...",
            "subject_id": "uuid",
            "due_date": "2024-02-15T10:00:00",
            "status": "pending",
            "assigned_to": "uuid",
            "created_at": "2024-02-01T10:00:00"
        }
    ]
}
```

#### Create Task
```
Method: POST
URL: {{baseUrl}}/api/student/tasks
Headers: 
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "title": "Finish Assignment",
    "description": "Complete all exercises from Chapter 5",
    "subject_id": "subject-uuid",
    "due_date": "2024-02-15",
    "status": "pending"
}
Expected: 201 Created
Response:
{
    "message": "Task created",
    "task": {
        "id": "uuid",
        "title": "Finish Assignment",
        ...
    }
}
```

### 4. Group Endpoints

#### Get User Groups
```
Method: GET
URL: {{baseUrl}}/api/student/groups
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "groups": [
        {
            "id": "uuid",
            "name": "Physics Study Group",
            "subject_id": "uuid",
            "created_by": "uuid",
            "created_at": "2024-02-01T10:00:00"
        }
    ]
}
```

#### Create Group
```
Method: POST
URL: {{baseUrl}}/api/student/groups
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "name": "Advanced Calculus Study",
    "subject_id": "subject-uuid"
}
Expected: 201 Created
Response:
{
    "message": "Group created",
    "group": {
        "id": "uuid",
        "name": "Advanced Calculus Study",
        ...
    }
}
```

#### Get Group Messages
```
Method: GET
URL: {{baseUrl}}/api/student/groups/{group_id}/messages
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "messages": [
        {
            "id": "uuid",
            "group_id": "uuid",
            "sender_id": "uuid",
            "message": "Hello everyone!",
            "created_at": "2024-02-01T10:00:00"
        }
    ]
}
```

#### Send Message
```
Method: POST
URL: {{baseUrl}}/api/student/groups/{group_id}/messages
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "message": "Hey, let's study together!"
}
Expected: 201 Created
Response:
{
    "message": "Message sent"
}
```

#### Get Group Members
```
Method: GET
URL: {{baseUrl}}/api/student/groups/{group_id}/members
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "members": [
        {
            "id": "uuid",
            "full_name": "Jane Smith",
            "student_id": "STU002",
            "status": "active"
        }
    ]
}
```

#### Invite to Group
```
Method: POST
URL: {{baseUrl}}/api/student/groups/{group_id}/invite
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "email": "friend@example.com"
}
Expected: 201 Created
Response:
{
    "message": "Invitation sent"
}
```

### 5. Profile Endpoints

#### Get Profile
```
Method: GET
URL: {{baseUrl}}/api/profile
Headers: Authorization: Bearer {{token}}
Expected: 200 OK
Response:
{
    "profile": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "student_id": "STU001",
        "role": "student",
        "status": "active"
    },
    "subjects": [...]
}
```

#### Update Profile
```
Method: POST
URL: {{baseUrl}}/api/profile/update
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "full_name": "John Smith"
}
Expected: 200 OK
Response:
{
    "message": "Profile updated"
}
```

#### Change Password
```
Method: POST
URL: {{baseUrl}}/api/profile/change-password
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
    "current_password": "OldPassword123",
    "new_password": "NewPassword123"
}
Expected: 200 OK
Response:
{
    "message": "Password changed"
}
```

### 6. Admin Endpoints

#### Create Admin (manual, secure)
```
Method: POST
URL: {{baseUrl}}/api/admin/create
Headers: Content-Type: application/json
Body:
{
    "email": "admin@example.com",
    "password": "AdminPass123",
    "full_name": "Admin User",
    "student_id": "ADMIN001",
    "token": "<ADMIN_CREATION_TOKEN>"
}
Notes: Set `ADMIN_CREATION_TOKEN` in backend environment before calling. You can also send the token in header `X-Admin-Token: <ADMIN_CREATION_TOKEN>`.
Expected: 201 Created
Response:
{
    "message": "Admin user created",
    "email": "admin@example.com"
}
```

#### Admin Login
```
Method: POST
URL: {{baseUrl}}/api/login
Headers: Content-Type: application/json
Body:
{
    "email": "admin@example.com",
    "password": "AdminPass123"
}
Expected: 200 OK
Response: (includes admin token)
```

#### Get Dashboard (Admin)
```
Method: GET
URL: {{baseUrl}}/api/admin/dashboard
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "total_students": 50,
    "pending_approvals": 5,
    "active_groups": 10
}
```

#### Get All Students
```
Method: GET
URL: {{baseUrl}}/api/admin/students
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "students": [
        {
            "id": "uuid",
            "student_id": "STU001",
            "full_name": "John Doe",
            "email": "john@example.com",
            "status": "pending",
            "created_at": "2024-02-01T10:00:00"
        }
    ]
}
```

#### Approve Student
```
Method: POST
URL: {{baseUrl}}/api/admin/students/{student_id}/approve
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "message": "Student approved"
}
```

#### Reject Student
```
Method: POST
URL: {{baseUrl}}/api/admin/students/{student_id}/reject
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "message": "Student rejected"
}
```

#### Suspend Student
```
Method: POST
URL: {{baseUrl}}/api/admin/students/{student_id}/suspend
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "message": "Student suspended"
}
```

#### Get All Subjects
```
Method: GET
URL: {{baseUrl}}/api/admin/subjects
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "subjects": [
        {
            "id": "uuid",
            "code": "CS101",
            "name": "Introduction to Computer Science",
            "created_by": "uuid"
        }
    ]
}
```

#### Create Subject
```
Method: POST
URL: {{baseUrl}}/api/admin/subjects
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body:
{
    "code": "MATH201",
    "name": "Advanced Mathematics"
}
Expected: 201 Created
Response:
{
    "message": "Subject created",
    "subject": {...}
}
```

#### Delete Subject
```
Method: DELETE
URL: {{baseUrl}}/api/admin/subjects/{subject_id}
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "message": "Subject deleted"
}
```

#### Get All Groups (Admin)
```
Method: GET
URL: {{baseUrl}}/api/admin/groups
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "groups": [
        {
            "id": "uuid",
            "name": "Physics Study Group",
            "subject": "Physics 101",
            "created_by_name": "John Doe",
            "member_count": 5,
            "created_at": "2024-02-01T10:00:00"
        }
    ]
}
```

#### Delete Group
```
Method: DELETE
URL: {{baseUrl}}/api/admin/groups/{group_id}
Headers: Authorization: Bearer {{admin_token}}
Expected: 200 OK
Response:
{
    "message": "Group deleted"
}
```

## ✅ Complete Testing Workflow

### Test as Student

1. **Register**:
   - POST /api/register with student data

2. **Wait for Admin Approval** or use Supabase to approve directly

3. **Login**:
   - POST /api/login
   - Copy token to environment

4. **Get Dashboard**:
   - GET /api/student/dashboard

5. **Create Task**:
   - POST /api/student/tasks

6. **Create Group**:
   - POST /api/student/groups

7. **Send Message**:
   - POST /api/student/groups/{group_id}/messages

8. **Update Profile**:
   - POST /api/profile/update

### Test as Admin

1. **Login as Admin**:
   - POST /api/login with admin credentials
   - Copy admin token

2. **Get Dashboard**:
   - GET /api/admin/dashboard

3. **View Students**:
   - GET /api/admin/students

4. **Approve Student**:
   - POST /api/admin/students/{id}/approve

5. **Create Subject**:
   - POST /api/admin/subjects

6. **View Groups**:
   - GET /api/admin/groups

## 🐛 Debugging Tips

### Check Response Status
- 200/201: Success
- 400: Bad Request (check body)
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (wrong endpoint/ID)
- 500: Server Error (check backend console)

### View Response Details
1. Click on completed request
2. See "Response" tab
3. Check headers, body, and status code

### Test Error Cases
1. Missing authorization header
2. Invalid JWT token
3. Wrong user role
4. Non-existent resource IDs

---

**Happy API Testing! 🎯**
