# 🏥 SmartCare AI
### AI-Powered Intelligent Healthcare & Emergency Response Platform

SmartCare AI is a full-stack healthcare management platform designed to simplify hospital operations, improve patient access to healthcare services, and support faster emergency response through AI-powered assistance.

The platform connects patients, hospitals, doctors, ambulance drivers, and administrators through a centralized system.

---

## 🚀 Key Features

### 👤 Patient Module
- Patient registration and secure login
- Patient dashboard
- Search and explore hospitals
- Browse doctors by department and specialization
- Book and manage appointments
- View medical reports and health records
- AI-powered healthcare assistance
- Request ambulance services
- Track appointment and emergency request status
- Manage profile and notifications

### 🏥 Hospital Module
- Hospital dashboard
- Manage hospital information
- Manage doctors and departments
- View and manage patient appointments
- Access patient-related information
- Manage emergency ambulance requests
- Monitor ambulance assignments
- View hospital activity and reports

### 🚑 Ambulance & Driver Module
- Driver login and dedicated dashboard
- View assigned emergency requests
- Accept or reject ambulance assignments
- Update emergency journey status
- View pickup and destination details
- Manage completed emergency trips

### 🛡️ Admin Module
- Centralized administration dashboard
- Manage hospitals and hospital registrations
- Manage doctors, departments, and drivers
- Manage ambulance information
- Monitor patients and appointments
- View emergency requests
- Monitor platform activity and analytics

### 🤖 AI Healthcare Assistant
- AI-powered healthcare assistance using Google Gemini
- Interactive health-related queries
- AI-supported health information and guidance

*AI-generated responses are informational and are not a replacement for professional medical diagnosis or treatment.*

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript |
| UI Framework | Material UI (MUI) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT |
| Real-Time Communication | Socket.IO |
| AI Integration | Google Gemini API |
| API Testing | Postman |
| Version Control | Git & GitHub |

---

## 🏗️ Project Architecture

SmartCare AI follows a full-stack client-server architecture.

```text
SmartCare-AI/
│
├── frontend/          # React.js application
│   ├── public/
│   └── src/
│
├── backend/           # Node.js and Express.js API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
│
├── docs/              # Project documentation
│
├── screenshots/       # Application screenshots
│
└── README.md
```

*The structure above represents the main project organization; individual folders may vary.*

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd SmartCare-AI
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Configure your backend environment variables in a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
npm start
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The React application will generally run at:

```text
http://localhost:3000
```

*Use the scripts configured in each package.json if your start commands differ.*

---

## 🔐 Security

- Role-based access control
- JWT-based authentication
- Protected API routes
- Environment-based configuration
- Secure handling of API credentials

**Important:** Never upload `.env` files, API keys, database credentials, or other secrets to GitHub.

---

## 🎯 Project Objectives

- Digitize and simplify healthcare management.
- Improve communication between patients and hospitals.
- Make doctor discovery and appointment booking easier.
- Support emergency ambulance coordination.
- Provide AI-powered healthcare assistance.
- Centralize hospital administration and monitoring.

---

## 🔮 Future Enhancements

- Enhanced real-time ambulance tracking using GPS.
- Advanced AI-based healthcare insights.
- Improved online payment and refund integration.
- Advanced analytics and reporting.
- Additional patient engagement features.

---

## 📌 Project Status

🚧 **Under Development**

SmartCare AI is an ongoing full-stack development project. Existing modules are being integrated, tested, and improved to provide a unified healthcare management experience.

---

## 👨‍💻 Developer

**Developed as an MCA Academic Project**

**Project Name:** SmartCare AI  
**Category:** Full-Stack Web Development | Healthcare Technology | Artificial Intelligence

---

⭐ If you find this project interesting, consider giving the repository a star!
