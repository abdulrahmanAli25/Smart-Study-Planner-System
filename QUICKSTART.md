# Quick Start Guide

Get Smart Study Planner running in 10 minutes.

## ⚡ Prerequisites

✓ Node.js 18+  
✓ Python 3.8+  
✓ Git  
✓ Supabase account  

## 🚀 5-Minute Quick Start

### 1. Get Supabase Credentials

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings > API**
3. Copy:
   - `URL` (Project URL)
   - `Service Role secret` (Service Role Key)
   - `anon public` (Anon Key)

### 2. Setup Database

1. Go to **SQL Editor** in Supabase
2. Create new query
3. Copy all SQL from `database/schema.sql`
4. Run query

### 3. Configure Environment

**Frontend `.env`**:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=<your_supabase_url>
REACT_APP_SUPABASE_ANON_KEY=<your_anon_key>
```

**Backend `.env`**:
```
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_service_role_key>
JWT_SECRET_KEY=super_secret_key_change_me
```

### 4. Install Dependencies

**Frontend** (from project root or frontend folder):
```bash
cd frontend
npm install
```

**Backend – Windows** (PowerShell):
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Backend – macOS** (the repo’s `venv` may be Windows-only; create a new one):
```bash
cd backend
# If you see "no such file or directory: venv/bin/activate", create a Mac venv:
python3 -m venv venv_mac
source venv_mac/bin/activate
pip install -r requirements.txt
```

### 5. Run Application

**Terminal 1 – Backend**

- **Windows**: `cd backend` → `venv\Scripts\Activate.ps1` → `python app.py`
- **macOS**:
```bash
cd backend
source venv_mac/bin/activate
python3 app.py
```
(Use `venv/bin/activate` and `python3 app.py` only if you recreated `venv` on Mac with `python3 -m venv venv`.)

**Terminal 2 – Frontend** (must run from **project root**, not from inside `backend`):
```bash
cd "/Users/shareefabdulla/Downloads/Smart Study planner/frontend"
npm start
```
Or from project root: `npm --prefix frontend start` (the `frontend` folder is next to `backend`, not inside it).

## 🎯 First Steps

### Create Admin Account

**Option A – Supabase Dashboard**

1. Go to Supabase > Authentication > Users
2. Create user with email/password
3. Go to SQL Editor, run:
```sql
INSERT INTO profiles (id, student_id, full_name, email, role, status)
SELECT id, 'ADMIN001', 'Admin', email, 'admin', 'active'
FROM auth.users WHERE email = 'your_admin_email@example.com'
LIMIT 1;
```

**Option B – Token-based (recommended)**

1. In **backend** `.env`, set a secure value:
   ```
   ADMIN_CREATION_TOKEN=your_secure_random_token_here
   ```
   (See `backend/.env.example` for the variable name.)

2. Restart the backend if it was already running.

3. Open http://localhost:3000 → click the **Setup admin** tab.

4. Enter:
   - **Admin creation token**: the same value as `ADMIN_CREATION_TOKEN` in backend `.env`
   - **Admin email** and **Password** (and optional Full name).

5. Click **Create admin account**. Then use the **Admin Login** tab to sign in.

### Test Login

1. Open http://localhost:3000
2. Click "Admin Login" tab
3. Use admin email/password
4. Should see Admin Dashboard

### Create Sample Subjects

In Supabase SQL Editor:
```sql
INSERT INTO subjects (code, name, created_by)
SELECT id, 'CS101', 'Introduction to Computer Science', id FROM profiles WHERE role = 'admin' LIMIT 1
UNION ALL
SELECT id, 'MATH201', 'Advanced Mathematics', id FROM profiles WHERE role = 'admin' LIMIT 1;
```

## 📱 Test Features

### Student Flow
1. Register → Dashboard → Create Task → Create Group → Chat
2. Check all pages work
3. Test task list/calendar views
4. Test group invitation

### Admin Flow
1. Login → Dashboard → Approve student → Create subject → Monitor groups

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows PowerShell as Admin):
netstat -ano | findstr :3000
taskkill /PID [number] /F
```

### Python venv not activating
```bash
# Try:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
venv\Scripts\Activate.ps1
```

### CORS Errors
- Check backend .env has `FLASK_ENV=development`
- Restart Flask server
- Clear browser cache

### Can't connect to Supabase
- Verify URL and keys in `.env`
- Check Supabase project is running
- Verify network connection

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Full project documentation |
| `WINDOWS_SETUP.md` | Detailed Windows 10 setup |
| `API_TESTING.md` | API endpoints & testing |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checklist |
| `database/schema.sql` | Database structure |

## 🌐 Next Steps

### Development
- [ ] Explore code structure
- [ ] Test all endpoints with Thunder Client
- [ ] Customize styling
- [ ] Add features as needed

### Deployment
- Follow `DEPLOYMENT_CHECKLIST.md`
- Choose hosting (Vercel for frontend, Railway for backend)
- Set production environment variables
- Deploy and monitor

## 💡 Common Tasks

### Add New Feature
1. Create backend endpoint in `app.py`
2. Create React component in `frontend/src/pages/`
3. Add route in `App.js`
4. Test with Thunder Client

### Create New Subject
```bash
# Use Thunder Client:
POST http://localhost:5000/api/admin/subjects
Headers: Authorization: Bearer {admin_token}
Body: { "code": "PHYS301", "name": "Physics III" }
```

### Approve Student
```bash
# In Supabase SQL Editor:
UPDATE profiles SET status = 'active' 
WHERE email = 'student@example.com' AND role = 'student';
```

## 🔧 Useful Commands

```bash
# List all processes using port
netstat -ano | findstr :5000

# Kill process on port
taskkill /PID [number] /F

# Check Python version
python --version

# Check Node version
node --version

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# View Flask logs
python app.py

# Activate Python venv
venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate   # Mac/Linux
```

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Flask Documentation](https://flask.palletsprojects.com)
- [Supabase Docs](https://supabase.com/docs)
- [JWT Basics](https://jwt.io)
- [Bootstrap 5](https://getbootstrap.com)

## 📞 Need Help?

1. Check relevant documentation file
2. Review API_TESTING.md for endpoint examples
3. Check browser console for errors (F12)
4. Check terminal for backend errors
5. Verify .env variables are set
6. Check Supabase project is active

## ✅ Ready to Code!

Your Smart Study Planner is now ready for development. Happy coding! 🚀

---

**Pro Tip**: Use VS Code with Thunder Client for faster development. Ctrl+Shift+X to open extensions, then search "Thunder Client".
