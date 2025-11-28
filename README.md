# InterestConnect - Platform for Finding Partners

## 🎓 Student Final Project
A simple web platform to connect people with shared interests in hobbies, education, and work.

## 📁 Project Structure
```
interest-connect/
├── frontend/          # Client-side application
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── search.html
│   ├── groups.html
│   ├── css/
│   └── js/
├── backend/           # Server-side application
│   ├── server.js
│   ├── routes/
│   ├── models/
│   └── utils/
└── README.md
```

## 🛠️ Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (MongoDB Atlas - free cloud)
- **AI Matching**: Simple algorithm based on interest matching

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (free)

### Step 1: Clone or Download
Download this project to your computer.

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Database
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get connection string
4. Create `.env` file in backend folder:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
PORT=3000
```

### Step 4: Start Backend Server
```bash
cd backend
npm start
```

### Step 5: Open Frontend
Open `frontend/index.html` in your browser or use Live Server extension in VS Code.

## 📚 Features
- ✅ User Registration & Login
- ✅ User Profiles with Interests
- ✅ Search Users by Interests
- ✅ AI-powered Partner Matching
- ✅ Create & Join Groups
- ✅ Real-time Chat
- ✅ Event Scheduling
- ✅ Privacy Controls

## 🎯 How to Use
1. Register a new account
2. Complete your profile with interests
3. Search for users with similar interests
4. Join groups or create your own
5. Chat with matched users
6. Schedule meetups and events

## 👥 Team
- Rustem
- Daulet

## 📝 License
This is a student project for educational purposes.
