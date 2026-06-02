import os
import json
from datetime import timedelta
from functools import wraps
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize CORS – allow frontend (any origin in development)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization", "X-Admin-Token"]}})

# Handle CORS preflight (OPTIONS) immediately so browser always gets CORS headers
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS" and request.path.startswith("/api/"):
        resp = make_response("", 204)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token"
        resp.headers["Access-Control-Max-Age"] = "86400"
        return resp

@app.after_request
def add_cors_headers(response):
    if request.path.startswith("/api/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token"
    return response

# Initialize JWT
jwt = JWTManager(app)

# Initialize Supabase (optional - comment out if not configured)
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    print(f"DEBUG: SUPABASE_URL = {SUPABASE_URL}")
    print(f"DEBUG: SUPABASE_KEY = {SUPABASE_KEY[:20]}..." if SUPABASE_KEY else "DEBUG: SUPABASE_KEY = None")
    
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized successfully!")
    else:
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables")
        supabase = None
except Exception as e:
    print(f"❌ Supabase initialization error: {str(e)}")
    import traceback
    traceback.print_exc()
    supabase = None


# ==================== UTILITY FUNCTIONS ====================

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def check_password(password, hashed_password):
    """Verify password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'supabase_connected': supabase is not None,
        'debug_info': {
            'supabase_url': os.getenv('SUPABASE_URL', 'NOT SET'),
            'supabase_object': str(type(supabase)),
        }
    }), 200


def admin_required(fn):
    """Decorator to check if user is admin"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        # Get user role from database
        user = supabase.table('profiles').select('role').eq('id', current_user_id).single().execute()
        if user.data.get('role') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    """User login endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        # Get user from Supabase auth
        response = supabase.auth.sign_in_with_password({'email': email, 'password': password})
        user_id = response.user.id

        # Get user profile
        profile = supabase.table('profiles').select('*').eq('id', user_id).single().execute()

        if not profile.data:
            return jsonify({'message': 'User profile not found'}), 404

        if profile.data['status'] != 'active':
            return jsonify({'message': 'Account not approved or suspended'}), 403

        # Create JWT token
        token = create_access_token(
            identity=user_id,
            additional_claims={
                'role': profile.data['role'],
                'email': email,
                'full_name': profile.data['full_name'],
                'student_id': profile.data.get('student_id'),
            }
        )

        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'full_name': profile.data['full_name'],
                'role': profile.data['role'],
                'student_id': profile.data.get('student_id'),
                'status': profile.data['status'],
            }
        }), 200

    except Exception as e:
        err = str(e).lower()
        print(f"Login error: {str(e)}")
        if 'email not confirmed' in err or 'signup_not_confirmed' in err:
            return jsonify({'message': 'Email not confirmed. In Supabase turn off Authentication → Providers → Email → Confirm email, or confirm the user in Authentication → Users.'}), 401
        if 'invalid login credentials' in err or 'invalid_credentials' in err:
            return jsonify({'message': 'Wrong email or password.'}), 401
        if 'user not found' in err or 'user_not_found' in err:
            return jsonify({'message': 'No account with this email.'}), 401
        return jsonify({'message': f'Login failed: {str(e)}'}), 401


@app.route('/api/register', methods=['POST'])
def register():
    """Student registration endpoint"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')

        if not all([student_id, full_name, email, password]):
            return jsonify({'message': 'All fields are required'}), 400

        # Check if email already exists
        existing = supabase.table('profiles').select('id').eq('email', email).execute()
        if existing.data:
            return jsonify({'message': 'Email already registered'}), 409

        # Sign up user with Supabase auth
        response = supabase.auth.sign_up({'email': email, 'password': password})
        user_id = response.user.id

        # Create profile with pending status
        profile_data = {
            'id': user_id,
            'student_id': student_id,
            'full_name': full_name,
            'email': email,
            'role': 'student',
            'status': 'pending',
            'created_at': 'now()',
        }

        supabase.table('profiles').insert(profile_data).execute()

        return jsonify({'message': 'Registration successful! Awaiting admin approval.'}), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'message': 'Registration failed'}), 500


# Admin public registration endpoint removed for security. Admin accounts
# must be created by an existing admin (via /api/admin/create with token)
# or pre-provisioned directly in the database.


# ==================== SETUP/CREATION ENDPOINTS ====================
def create_first_admin():
    """Create the first admin account (only works if no admin exists)"""
    print("🔵 API Call: /api/setup/create-admin")
    print(f"Supabase client status: {supabase}")
    
    if not supabase:
        print("❌ Supabase is None!")
        return jsonify({'message': 'Database connection failed. Check server logs.'}), 500
    
    try:
        # Check if admin already exists
        print("Checking for existing admin...")
        existing_admin = supabase.table('profiles').select('id').eq('role', 'admin').execute()
        if existing_admin.data:
            print("⚠️ Admin already exists")
            return jsonify({'message': 'Admin account already exists'}), 409

        data = request.get_json()
        admin_email = data.get('email')
        admin_password = data.get('password')
        admin_name = data.get('full_name', 'Admin User')
        admin_id = data.get('student_id', 'ADMIN001')

        print(f"Creating admin with email: {admin_email}")

        if not admin_email or not admin_password:
            return jsonify({'message': 'Email and password are required'}), 400

        # Check if email already exists
        print("Checking if email exists...")
        existing = supabase.table('profiles').select('id').eq('email', admin_email).execute()
        if existing.data:
            return jsonify({'message': 'Email already registered'}), 409

        # Sign up admin with Supabase auth
        print("Signing up admin with Supabase auth...")
        response = supabase.auth.sign_up({'email': admin_email, 'password': admin_password})
        user_id = response.user.id
        print(f"✅ Admin user created with ID: {user_id}")

        # Create admin profile
        print("Creating admin profile in database...")
        admin_data = {
            'id': user_id,
            'student_id': admin_id,
            'full_name': admin_name,
            'email': admin_email,
            'role': 'admin',
            'status': 'active',
        }

        supabase.table('profiles').insert(admin_data).execute()
        print("✅ Admin profile created in database")

        # Create JWT token for admin
        token = create_access_token(
            identity=user_id,
            additional_claims={
                'role': 'admin',
                'email': admin_email,
                'full_name': admin_name,
            }
        )

        print("✅ Admin account created successfully!")
        return jsonify({
            'message': 'Admin account created successfully!',
            'token': token,
            'user': {
                'id': user_id,
                'email': admin_email,
                'full_name': admin_name,
                'role': 'admin',
            }
        }), 201

    except Exception as e:
        print(f"❌ Admin creation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Admin creation failed: {str(e)}'}), 500


# ==================== STUDENT ENDPOINTS ====================

@app.route('/api/student/dashboard', methods=['GET'])
@jwt_required()
def student_dashboard():
    """Get student dashboard data"""
    try:
        current_user_id = get_jwt_identity()

        # Get total tasks
        tasks = supabase.table('tasks').select('id').eq('assigned_to', current_user_id).execute()
        total_tasks = len(tasks.data) if tasks.data else 0

        # Get upcoming deadlines (next 7 days)
        upcoming = supabase.table('tasks').select('id').eq('assigned_to', current_user_id).execute()
        upcoming_count = 0
        if upcoming.data:
            from datetime import datetime, timedelta
            today = datetime.now()
            next_week = today + timedelta(days=7)
            for task in upcoming.data:
                # Filter logic would be applied here
                upcoming_count += 1

        # Get user's groups
        groups = supabase.table('group_members').select('group_id').eq('member_id', current_user_id).execute()
        active_groups = len(groups.data) if groups.data else 0

        # Get subjects
        subjects = supabase.table('student_subjects').select('subject_id').eq('student_id', current_user_id).execute()
        subject_details = []
        if subjects.data:
            for sub in subjects.data:
                subject = supabase.table('subjects').select('*').eq('id', sub['subject_id']).single().execute()
                subject_details.append(subject.data)

        # Get recent tasks
        recent_tasks = supabase.table('tasks').select('*').eq('assigned_to', current_user_id).limit(5).execute()

        # Get pending invites
        invites = supabase.table('group_members').select('group_id, status').eq('member_id', current_user_id).eq('status', 'invited').execute()

        return jsonify({
            'total_tasks': total_tasks,
            'upcoming_deadlines': upcoming_count,
            'active_groups': active_groups,
            'subjects': subject_details,
            'recent_tasks': recent_tasks.data if recent_tasks.data else [],
            'pending_invites': invites.data if invites.data else [],
        }), 200

    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'message': 'Failed to load dashboard'}), 500


@app.route('/api/student/tasks', methods=['GET'])
@jwt_required()
def get_student_tasks():
    """Get student's tasks"""
    try:
        current_user_id = get_jwt_identity()
        tasks = supabase.table('tasks').select('*').eq('assigned_to', current_user_id).execute()
        return jsonify({'tasks': tasks.data if tasks.data else []}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load tasks'}), 500


@app.route('/api/student/tasks', methods=['POST'])
@jwt_required()
def create_task():
    """Create a new task"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Normalize empty strings to NULL for UUID columns
        subject_id = data.get('subject_id')
        if subject_id == '' or subject_id is None:
            subject_id = None
        group_id = data.get('group_id')
        if group_id == '' or group_id is None:
            group_id = None

        task_data = {
            'title': data.get('title'),
            'description': data.get('description'),
            'subject_id': subject_id,
            'group_id': group_id,
            'assigned_to': current_user_id,
            'due_date': data.get('due_date'),
            'status': data.get('status', 'pending'),
            'created_at': 'now()',
        }

        result = supabase.table('tasks').insert(task_data).execute()
        return jsonify({'message': 'Task created', 'task': result.data[0] if result.data else None}), 201

    except Exception as e:
        print(f"Create task error: {str(e)}")
        return jsonify({'message': 'Failed to create task'}), 500


@app.route('/api/student/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task owned by the current student"""
    try:
        current_user_id = get_jwt_identity()
        task = supabase.table('tasks').select('id, assigned_to').eq('id', task_id).single().execute()
        if not task.data:
            return jsonify({'message': 'Task not found'}), 404
        if task.data.get('assigned_to') != current_user_id:
            return jsonify({'message': 'Forbidden'}), 403

        supabase.table('tasks').delete().eq('id', task_id).execute()
        return jsonify({'message': 'Task deleted'}), 200
    except Exception as e:
        print(f"Delete task error: {str(e)}")
        return jsonify({'message': 'Failed to delete task'}), 500


@app.route('/api/student/tasks/<task_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_task(task_id):
    """Update a task owned by the current student"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        task = supabase.table('tasks').select('id, assigned_to').eq('id', task_id).single().execute()
        if not task.data:
            return jsonify({'message': 'Task not found'}), 404
        if task.data.get('assigned_to') != current_user_id:
            return jsonify({'message': 'Forbidden'}), 403

        updates = {}
        for key in ['title', 'description', 'due_date', 'status', 'priority']:
            if key in data and data.get(key) is not None:
                updates[key] = data.get(key)

        # Normalize empty strings to NULL for UUID columns
        if 'subject_id' in data:
            subject_id = data.get('subject_id')
            updates['subject_id'] = None if subject_id in ('', None) else subject_id
        if 'group_id' in data:
            group_id = data.get('group_id')
            updates['group_id'] = None if group_id in ('', None) else group_id

        if not updates:
            return jsonify({'message': 'No fields to update'}), 400

        supabase.table('tasks').update(updates).eq('id', task_id).execute()
        updated = supabase.table('tasks').select('*').eq('id', task_id).single().execute()
        return jsonify({'message': 'Task updated', 'task': updated.data}), 200
    except Exception as e:
        print(f"Update task error: {str(e)}")
        return jsonify({'message': 'Failed to update task'}), 500


@app.route('/api/student/groups', methods=['GET'])
@jwt_required()
def get_student_groups():
    """Get student's groups"""
    try:
        current_user_id = get_jwt_identity()
        members = supabase.table('group_members').select('group_id').eq('member_id', current_user_id).eq('status', 'active').execute()

        groups = []
        if members.data:
            for member in members.data:
                group = supabase.table('groups').select('*').eq('id', member['group_id']).single().execute()
                groups.append(group.data)

        return jsonify({'groups': groups}), 200

    except Exception as e:
        print(f"Get groups error: {str(e)}")
        return jsonify({'message': 'Failed to load groups'}), 500


@app.route('/api/student/groups', methods=['POST'])
@jwt_required()
def create_group():
    """Create a new group"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Normalize empty string to NULL for UUID subject_id
        subject_id = data.get('subject_id')
        if subject_id in ('', None):
            subject_id = None

        group_data = {
            'name': data.get('name'),
            'subject_id': subject_id,
            'created_by': current_user_id,
            'created_at': 'now()',
        }

        result = supabase.table('groups').insert(group_data).execute()
        group_id = result.data[0]['id']

        # Add creator as member
        supabase.table('group_members').insert({
            'group_id': group_id,
            'member_id': current_user_id,
            'status': 'active',
        }).execute()

        return jsonify({'message': 'Group created', 'group': result.data[0] if result.data else None}), 201

    except Exception as e:
        print(f"Create group error: {str(e)}")
        return jsonify({'message': 'Failed to create group'}), 500


@app.route('/api/student/groups/<group_id>/messages', methods=['GET'])
@jwt_required()
def get_group_messages(group_id):
    """Get group messages"""
    try:
        messages = supabase.table('group_messages').select('*').eq('group_id', group_id).order('created_at', desc=False).execute()
        return jsonify({'messages': messages.data if messages.data else []}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load messages'}), 500


@app.route('/api/student/groups/<group_id>/messages', methods=['POST'])
@jwt_required()
def send_message(group_id):
    """Send message to group"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        message_data = {
            'group_id': group_id,
            'sender_id': current_user_id,
            'message': data.get('message'),
            'created_at': 'now()',
        }

        result = supabase.table('group_messages').insert(message_data).execute()
        return jsonify({'message': 'Message sent'}), 201

    except Exception as e:
        return jsonify({'message': 'Failed to send message'}), 500


@app.route('/api/student/groups/<group_id>/members', methods=['GET'])
@jwt_required()
def get_group_members(group_id):
    """Get group members"""
    try:
        members = supabase.table('group_members').select('member_id, status').eq('group_id', group_id).eq('status', 'active').execute()

        member_details = []
        if members.data:
            for member in members.data:
                profile = supabase.table('profiles').select('*').eq('id', member['member_id']).single().execute()
                member_details.append({
                    'id': member['member_id'],
                    'full_name': profile.data['full_name'],
                    'student_id': profile.data.get('student_id'),
                    'status': member['status'],
                })

        return jsonify({'members': member_details}), 200

    except Exception as e:
        return jsonify({'message': 'Failed to load members'}), 500


@app.route('/api/student/groups/<group_id>/invite', methods=['POST'])
@jwt_required()
def invite_to_group(group_id):
    """Invite user to group"""
    try:
        data = request.get_json()
        email = (data.get('email') or '').strip()
        if not email:
            return jsonify({'message': 'Email is required'}), 400

        # Find user by email (avoid .single() crash when 0 rows)
        users = supabase.table('profiles').select('id').eq('email', email).limit(1).execute()
        user_id = users.data[0]['id'] if users.data else None
        if not user_id:
            return jsonify({'message': 'User not found'}), 404

        # Check if already a member
        existing = (
            supabase.table('group_members')
            .select('id')
            .eq('group_id', group_id)
            .eq('member_id', user_id)
            .execute()
        )

        if existing.data:
            return jsonify({'message': 'User already in group'}), 409

        # Add as invited member
        supabase.table('group_members').insert({
            'group_id': group_id,
            'member_id': user_id,
            'status': 'invited',
        }).execute()

        return jsonify({'message': 'Invitation sent'}), 201

    except Exception as e:
        print(f"Invite error: {str(e)}")
        return jsonify({'message': 'Failed to send invite'}), 500


@app.route('/api/student/groups/<group_id>/accept', methods=['POST'])
@jwt_required()
def accept_group_invite(group_id):
    """Accept a group invitation (invited -> active)."""
    try:
        current_user_id = get_jwt_identity()

        invite = (
            supabase.table('group_members')
            .select('id, status')
            .eq('group_id', group_id)
            .eq('member_id', current_user_id)
            .single()
            .execute()
        )

        if not invite.data or invite.data.get('status') != 'invited':
            return jsonify({'message': 'Invitation not found'}), 404

        supabase.table('group_members').update({'status': 'active'}).eq('group_id', group_id).eq('member_id', current_user_id).execute()
        return jsonify({'message': 'Invitation accepted'}), 200
    except Exception as e:
        print(f"Accept invite error: {str(e)}")
        return jsonify({'message': 'Failed to accept invitation'}), 500


@app.route('/api/student/groups/<group_id>/decline', methods=['POST'])
@jwt_required()
def decline_group_invite(group_id):
    """Decline a group invitation (invited -> left)."""
    try:
        current_user_id = get_jwt_identity()

        invite = (
            supabase.table('group_members')
            .select('id, status')
            .eq('group_id', group_id)
            .eq('member_id', current_user_id)
            .single()
            .execute()
        )

        if not invite.data or invite.data.get('status') != 'invited':
            return jsonify({'message': 'Invitation not found'}), 404

        supabase.table('group_members').update({'status': 'left'}).eq('group_id', group_id).eq('member_id', current_user_id).execute()
        return jsonify({'message': 'Invitation declined'}), 200
    except Exception as e:
        print(f"Decline invite error: {str(e)}")
        return jsonify({'message': 'Failed to decline invitation'}), 500


# ==================== PROFILE ENDPOINTS ====================

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        current_user_id = get_jwt_identity()
        profile = supabase.table('profiles').select('*').eq('id', current_user_id).single().execute()

        # Get subjects if student
        subjects = []
        if profile.data['role'] == 'student':
            subject_data = supabase.table('student_subjects').select('subject_id').eq('student_id', current_user_id).execute()
            if subject_data.data:
                for sub in subject_data.data:
                    subject = supabase.table('subjects').select('*').eq('id', sub['subject_id']).single().execute()
                    subjects.append(subject.data)

        return jsonify({
            'profile': profile.data,
            'subjects': subjects,
        }), 200

    except Exception as e:
        return jsonify({'message': 'Failed to load profile'}), 500


@app.route('/api/profile/update', methods=['POST'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        update_data = {
            'full_name': data.get('full_name'),
        }

        supabase.table('profiles').update(update_data).eq('id', current_user_id).execute()
        return jsonify({'message': 'Profile updated'}), 200

    except Exception as e:
        return jsonify({'message': 'Failed to update profile'}), 500


@app.route('/api/profile/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        new_password = data.get('new_password')

        # Update password using Supabase Auth
        supabase.auth.admin_user_update(current_user_id, {'password': new_password})
        return jsonify({'message': 'Password changed'}), 200

    except Exception as e:
        return jsonify({'message': 'Failed to change password'}), 500


# ==================== ADMIN ENDPOINTS ====================

@app.route('/api/admin/create', methods=['POST', 'OPTIONS'])
def create_admin():
    """Create an admin user using a one-time token.

    Request JSON: { "email": "...", "password": "...", "full_name": "...", "student_id": "...", "token": "..." }
    The request must include a valid token equal to the environment variable `ADMIN_CREATION_TOKEN`.
    """
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json() or {}
        token = data.get('token') or request.headers.get('X-Admin-Token')
        secret = os.getenv('ADMIN_CREATION_TOKEN')
        if not secret or token != secret:
            return jsonify({'message': 'Unauthorized'}), 401

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name', 'Admin User')
        student_id = data.get('student_id')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        # Ensure email not already in profiles
        existing = supabase.table('profiles').select('id').eq('email', email).execute()
        if existing.data:
            return jsonify({'message': 'Email already registered. Delete this user in Supabase Auth and the row in Table Editor → profiles, then try again.'}), 409

        # Create auth user (uses Supabase auth)
        response = supabase.auth.sign_up({'email': email, 'password': password})
        user_id = None
        if hasattr(response, 'user') and response.user:
            user_id = response.user.id
        elif isinstance(response, dict) and response.get('user'):
            user_id = response['user'].get('id')

        if not user_id:
            return jsonify({'message': 'Failed to create auth user. Email may already exist in Supabase Auth → Users; delete it there and try again.'}), 500

        # Use unique student_id so leftover ADMIN001 in profiles does not block creation
        if not student_id:
            student_id = f"ADMIN-{user_id[:8].upper()}"

        profile_data = {
            'id': user_id,
            'student_id': student_id,
            'full_name': full_name,
            'email': email,
            'role': 'admin',
            'status': 'active',
            'created_at': 'now()',
        }

        supabase.table('profiles').insert(profile_data).execute()
        return jsonify({'message': 'Admin user created', 'email': email}), 201

    except Exception as e:
        err_msg = str(e)
        print(f"Create admin error: {err_msg}")
        if '23505' in err_msg or 'duplicate key' in err_msg.lower():
            return jsonify({
                'message': 'Email or admin ID already exists. In Supabase: Authentication → Users delete the user; Table Editor → profiles delete any row with this email or old ADMIN id; then try again.'
            }), 409
        return jsonify({'message': f'Failed to create admin: {err_msg}'}), 500


@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """Get admin dashboard data"""
    try:
        # Total students
        students = supabase.table('profiles').select('id').eq('role', 'student').execute()
        total_students = len(students.data) if students.data else 0

        # Pending approvals
        pending = supabase.table('profiles').select('id').eq('role', 'student').eq('status', 'pending').execute()
        pending_approvals = len(pending.data) if pending.data else 0

        # Active groups
        groups = supabase.table('groups').select('id').execute()
        active_groups = len(groups.data) if groups.data else 0

        return jsonify({
            'total_students': total_students,
            'pending_approvals': pending_approvals,
            'active_groups': active_groups,
        }), 200

    except Exception as e:
        return jsonify({'message': 'Failed to load dashboard'}), 500


@app.route('/api/admin/students', methods=['GET'])
@admin_required
def get_all_students():
    """Get all students"""
    try:
        students = supabase.table('profiles').select('*').eq('role', 'student').execute()
        return jsonify({'students': students.data if students.data else []}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load students'}), 500


@app.route('/api/admin/students/<student_id>/approve', methods=['POST'])
@admin_required
def approve_student(student_id):
    """Approve student registration"""
    try:
        supabase.table('profiles').update({'status': 'active'}).eq('id', student_id).execute()
        return jsonify({'message': 'Student approved'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to approve student'}), 500


@app.route('/api/admin/students/<student_id>/reject', methods=['POST'])
@admin_required
def reject_student(student_id):
    """Reject student registration"""
    try:
        supabase.table('profiles').delete().eq('id', student_id).execute()
        return jsonify({'message': 'Student rejected'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to reject student'}), 500


@app.route('/api/admin/students/<student_id>/suspend', methods=['POST'])
@admin_required
def suspend_student(student_id):
    """Suspend student"""
    try:
        supabase.table('profiles').update({'status': 'suspended'}).eq('id', student_id).execute()
        return jsonify({'message': 'Student suspended'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to suspend student'}), 500


@app.route('/api/admin/students/<student_id>/subjects', methods=['GET'])
@admin_required
def get_student_subjects_admin(student_id):
    """Get a student's subject assignments (admin)."""
    try:
        rows = supabase.table('student_subjects').select('subject_id').eq('student_id', student_id).execute()
        subject_ids = [r['subject_id'] for r in (rows.data or []) if r.get('subject_id')]
        subjects = []
        if subject_ids:
            subjects_resp = supabase.table('subjects').select('*').in_('id', subject_ids).execute()
            subjects = subjects_resp.data or []
        return jsonify({'subject_ids': subject_ids, 'subjects': subjects}), 200
    except Exception as e:
        print(f"Get student subjects error: {str(e)}")
        return jsonify({'message': 'Failed to load student subjects'}), 500


@app.route('/api/admin/students/<student_id>/subjects', methods=['POST'])
@admin_required
def set_student_subjects_admin(student_id):
    """Replace a student's subject assignments (admin)."""
    try:
        data = request.get_json() or {}
        subject_ids = data.get('subject_ids') or []
        if not isinstance(subject_ids, list):
            return jsonify({'message': 'subject_ids must be an array'}), 400

        # Remove existing assignments, then insert new ones
        supabase.table('student_subjects').delete().eq('student_id', student_id).execute()

        inserts = []
        for sid in subject_ids:
            if sid:
                inserts.append({'student_id': student_id, 'subject_id': sid})

        if inserts:
            supabase.table('student_subjects').insert(inserts).execute()

        return jsonify({'message': 'Student subjects updated', 'subject_ids': subject_ids}), 200
    except Exception as e:
        print(f"Set student subjects error: {str(e)}")
        return jsonify({'message': 'Failed to update student subjects', 'details': str(e)}), 500


@app.route('/api/admin/students/<student_id>/subjects/<subject_id>', methods=['DELETE'])
@admin_required
def remove_student_subject_admin(student_id, subject_id):
    """Remove a single subject assignment from a student (admin)."""
    try:
        supabase.table('student_subjects').delete().eq('student_id', student_id).eq('subject_id', subject_id).execute()
        return jsonify({'message': 'Student subject removed'}), 200
    except Exception as e:
        print(f"Remove student subject error: {str(e)}")
        return jsonify({'message': 'Failed to remove student subject'}), 500


@app.route('/api/admin/subjects', methods=['GET'])
@admin_required
def get_subjects():
    """Get all subjects"""
    try:
        subjects = supabase.table('subjects').select('*').execute()
        return jsonify({'subjects': subjects.data if subjects.data else []}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load subjects'}), 500


@app.route('/api/admin/subjects', methods=['POST'])
@admin_required
def create_subject():
    """Create subject"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        subject_data = {
            'code': data.get('code'),
            'name': data.get('name'),
            'created_by': current_user_id,
        }

        result = supabase.table('subjects').insert(subject_data).execute()
        return jsonify({'message': 'Subject created', 'subject': result.data[0] if result.data else None}), 201

    except Exception as e:
        return jsonify({'message': 'Failed to create subject'}), 500


@app.route('/api/admin/subjects/<subject_id>', methods=['DELETE'])
@admin_required
def delete_subject(subject_id):
    """Delete subject"""
    try:
        supabase.table('subjects').delete().eq('id', subject_id).execute()
        return jsonify({'message': 'Subject deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete subject'}), 500


@app.route('/api/admin/subjects/<subject_id>', methods=['PUT', 'PATCH'])
@admin_required
def update_subject(subject_id):
    """Update subject (code/name)"""
    try:
        data = request.get_json() or {}
        updates = {}
        if 'code' in data and data.get('code'):
            updates['code'] = data.get('code')
        if 'name' in data and data.get('name'):
            updates['name'] = data.get('name')

        if not updates:
            return jsonify({'message': 'No fields to update'}), 400

        supabase.table('subjects').update(updates).eq('id', subject_id).execute()
        subject = supabase.table('subjects').select('*').eq('id', subject_id).single().execute()
        return jsonify({'message': 'Subject updated', 'subject': subject.data}), 200
    except Exception as e:
        print(f"Update subject error: {str(e)}")
        return jsonify({'message': 'Failed to update subject'}), 500


@app.route('/api/admin/groups', methods=['GET'])
@admin_required
def get_all_groups():
    """Get all groups"""
    try:
        groups = supabase.table('groups').select('*').execute()

        group_details = []
        if groups.data:
            for group in groups.data:
                # Get member count
                members = supabase.table('group_members').select('id').eq('group_id', group['id']).eq('status', 'active').execute()
                member_count = len(members.data) if members.data else 0

                # Get subject name
                subject_name = ''
                if group.get('subject_id'):
                    subject = supabase.table('subjects').select('name').eq('id', group['subject_id']).single().execute()
                    subject_name = subject.data['name'] if subject.data else ''

                # Get creator name
                creator = supabase.table('profiles').select('full_name').eq('id', group['created_by']).single().execute()
                creator_name = creator.data['full_name'] if creator.data else ''

                group_details.append({
                    'id': group['id'],
                    'name': group['name'],
                    'subject': subject_name,
                    'created_by_name': creator_name,
                    'member_count': member_count,
                    'created_at': group['created_at'],
                })

        return jsonify({'groups': group_details}), 200

    except Exception as e:
        print(f"Get groups error: {str(e)}")
        return jsonify({'message': 'Failed to load groups'}), 500


@app.route('/api/admin/groups/<group_id>', methods=['DELETE'])
@admin_required
def delete_group(group_id):
    """Delete group"""
    try:
        # Delete messages
        supabase.table('group_messages').delete().eq('group_id', group_id).execute()
        # Delete members
        supabase.table('group_members').delete().eq('group_id', group_id).execute()
        # Delete group
        supabase.table('groups').delete().eq('id', group_id).execute()
        return jsonify({'message': 'Group deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete group'}), 500


@app.route('/api/admin/activity-log', methods=['GET'])
@admin_required
def get_activity_log():
    """Get activity log"""
    try:
        # For now, return empty list - implement as needed
        return jsonify({'activities': []}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to load activity log'}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(debug=debug_mode, port=port, use_reloader=debug_mode)
