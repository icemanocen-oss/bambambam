# InterestConnect - Complete Setup Guide

## 📋 Table of Contents
1. [Requirements](#requirements)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Requirements

### Software Requirements
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional) - [Download](https://git-scm.com/)
- **MongoDB Atlas Account** (Free) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### Browser Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

---

## 🚀 Quick Start

### For Students (Simple Setup)

1. **Download the project** to your computer

2. **Install MongoDB Atlas** (Cloud Database - FREE):
   - Go to https://www.mongodb.com/cloud/atlas
   - Click "Try Free"
   - Create account with Google/Email
   - Create a FREE cluster (M0 Sandbox)
   - Click "Connect" → "Connect your application"
   - Copy the connection string

3. **Setup Backend**:
```bash
cd backend
npm install
```

4. **Create `.env` file** in the `backend` folder:
```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/interestconnect?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_key_12345
PORT=3000
FRONTEND_URL=http://localhost:5500
```

5. **Start Backend Server**:
```bash
npm start
```

6. **Open Frontend**:
   - Install "Live Server" extension in VS Code
   - Right-click on `frontend/index.html`
   - Click "Open with Live Server"
   - OR just open `frontend/index.html` in your browser

7. **Register and Test!** 🎉

---

## 📝 Detailed Installation

### Step 1: Install Node.js

**Windows:**
1. Download from https://nodejs.org/
2. Run installer
3. Open Command Prompt and verify:
```bash
node --version
npm --version
```

**Mac:**
```bash
brew install node
```

**Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

### Step 2: Setup MongoDB Atlas

1. **Create Account:**
   - Visit https://www.mongodb.com/cloud/atlas
   - Sign up (free forever)

2. **Create Cluster:**
   - Choose "Build a Database"
   - Select FREE "M0 Sandbox"
   - Choose a cloud provider (AWS recommended)
   - Select nearest region (for faster connection)
   - Click "Create Cluster"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `interestconnect`
   - Password: Create a strong password (save it!)
   - Database User Privileges: Read and write to any database
   - Click "Add User"

4. **Setup Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `interestconnect`

Example:
```
mongodb+srv://interestconnect:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/interestconnect?retryWrites=true&w=majority
```

### Step 3: Backend Setup

1. **Navigate to backend folder:**
```bash
cd interest-connect/backend
```

2. **Install dependencies:**
```bash
npm install
```

This will install:
- express (web server)
- mongoose (database)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- dotenv (environment variables)
- socket.io (real-time chat)

3. **Create `.env` file:**

Create a file named `.env` in the `backend` folder with:

```env
# MongoDB Connection (replace with YOUR connection string)
MONGODB_URI=mongodb+srv://interestconnect:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/interestconnect?retryWrites=true&w=majority

# JWT Secret (change this to any random string)
JWT_SECRET=your_super_secret_random_string_here_123456

# Server Port
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5500
```

**Important:** Replace `YOUR_PASSWORD` with your MongoDB password!

### Step 4: Frontend Setup

No installation needed! The frontend uses CDN for libraries.

Just update the API URL if needed in `frontend/js/config.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

---

## 🗄️ Database Setup

The database will be created automatically when you start the server and register the first user.

### Database Structure:
- **users** - User profiles and authentication
- **groups** - Community groups
- **events** - Meetups and events
- **messages** - Chat messages

---

## ▶️ Running the Application

### Start Backend Server

**Option 1: Normal Mode**
```bash
cd backend
npm start
```

**Option 2: Development Mode** (auto-restart on changes)
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 Server running on port 3000
📡 API: http://localhost:3000
💬 Socket.IO: Ready for real-time connections
```

### Start Frontend

**Option 1: VS Code Live Server** (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `frontend/index.html`
3. Click "Open with Live Server"
4. Browser opens at `http://localhost:5500`

**Option 2: Simple HTTP Server**
```bash
cd frontend
python -m http.server 5500
```

**Option 3: Direct Browser**
Simply open `frontend/index.html` in your browser
(Note: Some features like Socket.IO may not work properly)

---

## 🌐 Deployment

### Deploy Backend (Render.com - FREE)

1. **Create account** at https://render.com
2. **Connect GitHub** (push your code to GitHub first)
3. **Create Web Service:**
   - New → Web Service
   - Connect repository
   - Name: `interestconnect-api`
   - Runtime: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. **Add Environment Variables:**
   - MONGODB_URI
   - JWT_SECRET
   - PORT (leave as 3000)
   - FRONTEND_URL (your frontend URL)
5. **Deploy!**

### Deploy Frontend (Vercel - FREE)

1. **Create account** at https://vercel.com
2. **Install Vercel CLI:**
```bash
npm install -g vercel
```
3. **Deploy:**
```bash
cd frontend
vercel
```
4. **Update API URL** in `js/config.js` with your Render backend URL
5. **Done!**

---

## 🔍 Troubleshooting

### Problem: "Cannot connect to MongoDB"
**Solution:**
- Check your connection string in `.env`
- Verify password is correct
- Check MongoDB Atlas Network Access (allow 0.0.0.0/0)
- Make sure cluster is running

### Problem: "Port 3000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

Or change PORT in `.env` to 3001, 3002, etc.

### Problem: "CORS Error"
**Solution:**
- Make sure backend is running
- Check FRONTEND_URL in `.env` matches your frontend URL
- Clear browser cache

### Problem: "Frontend can't reach backend"
**Solution:**
- Verify backend is running (`http://localhost:3000` should show API info)
- Check `API_BASE_URL` in `frontend/js/config.js`
- Open browser console (F12) to see errors

### Problem: "npm install fails"
**Solution:**
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Problem: "Module not found"
**Solution:**
```bash
cd backend
npm install
```

---

## 📱 Testing the Application

### Test Flow:

1. **Register Account:**
   - Go to http://localhost:5500/register.html
   - Fill in details
   - Add interests: "Programming, Music, Sports"
   - Register

2. **Login:**
   - Use registered credentials

3. **Complete Profile:**
   - Go to Profile
   - Add bio, skills, location

4. **Test AI Matching:**
   - Register 2-3 more accounts with similar interests
   - Check Dashboard for AI recommendations

5. **Test Groups:**
   - Create a group
   - Join from another account

6. **Test Chat:**
   - Send messages between accounts
   - Check real-time updates

7. **Test Events:**
   - Create an event
   - Join from another account

---

## 🎯 Features Checklist

- ✅ User Registration & Login
- ✅ Profile Management
- ✅ AI-Powered Matching (Simple Algorithm)
- ✅ Search Users by Interests
- ✅ Create & Join Groups
- ✅ Real-time Chat (Socket.IO)
- ✅ Create & Join Events
- ✅ Privacy Controls
- ✅ Block Users

---

## 🆘 Need Help?

### Common Questions:

**Q: Do I need to pay for MongoDB?**
A: No! MongoDB Atlas has a FREE tier (M0 Sandbox) that's perfect for this project.

**Q: Can I use a different database?**
A: Yes, but you'll need to modify the code. MongoDB is easiest for beginners.

**Q: How do I add more users to test?**
A: Open an incognito window and register another account.

**Q: Can I deploy for free?**
A: Yes! Use Render.com (backend) and Vercel/Netlify (frontend) - all FREE.

**Q: How do I add more AI features?**
A: The current AI is rule-based. For ML-based matching, you'd need to integrate Python with TensorFlow or use OpenAI API.

---

## 📚 Project Structure

```
interest-connect/
├── backend/                # Server-side
│   ├── models/            # Database models
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Event.js
│   │   └── Message.js
│   ├── routes/            # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── groups.js
│   │   ├── events.js
│   │   └── messages.js
│   ├── middleware/        # Auth middleware
│   ├── utils/            # AI matching algorithm
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env              # Environment variables
│
└── frontend/              # Client-side
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── config.js      # API configuration
    │   ├── auth.js        # Authentication
    │   └── dashboard.js   # Dashboard logic
    ├── index.html         # Landing page
    ├── login.html         # Login page
    ├── register.html      # Registration page
    ├── dashboard.html     # Main dashboard
    ├── profile.html       # User profile
    ├── search.html        # Search users
    ├── groups.html        # Groups page
    ├── events.html        # Events page
    └── chat.html          # Chat page
```

---

## 🎓 For Students

### Presentation Tips:

1. **Demonstrate Live:**
   - Show registration process
   - Show AI matching in action
   - Show real-time chat
   - Show group creation

2. **Explain Technical Stack:**
   - Frontend: HTML, CSS, JavaScript, Bootstrap
   - Backend: Node.js, Express
   - Database: MongoDB
   - Real-time: Socket.IO
   - AI: Custom matching algorithm

3. **Highlight Features:**
   - AI-powered matching (explain algorithm)
   - Real-time chat
   - Group management
   - Event scheduling
   - Privacy controls

4. **Show Code:**
   - AI matching algorithm (`backend/utils/aiMatching.js`)
   - Real-time chat (`backend/server.js` - Socket.IO)
   - API structure

### Grading Points:

✅ **Functionality** (30%)
- All features work correctly
- No critical bugs
- Good user experience

✅ **Code Quality** (25%)
- Clean, organized code
- Comments and documentation
- Proper error handling

✅ **Design** (20%)
- Professional UI/UX
- Responsive design
- Good color scheme

✅ **Innovation** (15%)
- AI matching algorithm
- Real-time features
- Unique features

✅ **Documentation** (10%)
- README file
- Setup instructions
- Code comments

---

## 🎉 Congratulations!

You now have a fully functional social networking platform with AI-powered matching!

**Good luck with your final project! 🚀**

---

**Created by:** Rustem & Daulet  
**Date:** 2024  
**Project:** InterestConnect - Final Project
