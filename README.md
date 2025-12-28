# 🎯 Smart Career Advisor - Full Stack Application

AI-powered career guidance system with intelligent question selection and real-time insights.

## ✨ Features

- **Intelligent Question Selection**: AI decides which questions to ask based on your answers using information gain algorithms
- **Real-time Insights**: See career predictions every 3 questions with confidence scores
- **Smart Early Stopping**: System stops when confidence ≥70% or after sufficient questions
- **Beautiful UI**: Modern, responsive design with smooth animations and gradients
- **Comprehensive Results**: Get detailed career recommendations, personality profile, and actionable next steps

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **pip** package manager

## 🚀 Quick Start

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd api
pip install -r requirements.txt
cd ..
```

## 🎮 Running the Application

You need to run both backend and frontend simultaneously:

### Terminal 1 - Start Backend API

```bash
cd api
python server.py
```

✅ Backend will run on `http://localhost:5000`

### Terminal 2 - Start Frontend

```bash
npm run dev
```

✅ Frontend will run on `http://localhost:3000`

Open [http://localhost:3000](http://localhost:3000) in your browser to use the application!

## 📁 Project Structure

```
career-isit/
├── api/
│   ├── dataset.json              # Questions and career data
│   ├── smart_career_advisor.py   # Core AI algorithm
│   ├── server.py                 # Flask REST API
│   └── requirements.txt          # Python dependencies
├── app/
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles with animations
├── components/
│   ├── Welcome.tsx               # Welcome screen component
│   ├── Quiz.tsx                  # Interactive quiz component
│   └── Results.tsx               # Results display component
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## 🔌 API Endpoints

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| POST   | `/api/session/start` | Start a new career assessment session    |
| POST   | `/api/question/next` | Get the next intelligent question        |
| POST   | `/api/answer/submit` | Submit answer and get insights           |
| POST   | `/api/results`       | Get comprehensive career recommendations |
| GET    | `/api/health`        | Health check endpoint                    |

## 🎨 Tech Stack

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Custom animations** - Smooth UX

### Backend

- **Python 3** - Core language
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin support
- **Custom AI** - Information gain algorithm

## 🧠 How the AI Works

1. **Information Gain Calculation**: Each question is scored based on how much new information it provides
2. **Entropy Measurement**: System measures uncertainty about career categories
3. **Dynamic Selection**: Questions that reduce uncertainty most are prioritized
4. **Pattern Detection**: Real-time analysis of emerging career preferences
5. **Smart Stopping**: Automatically stops when confidence threshold is reached

## 🚨 Troubleshooting

### Backend Issues

**Backend won't start:**

```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
cd api
pip install -r requirements.txt
```

**Port 5000 already in use:**

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Frontend Issues

**Frontend won't connect:**

- Verify backend is running: `http://localhost:5000/api/health`
- Check browser console for errors
- Ensure Flask-CORS is installed

**Build errors:**

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## 💡 Usage Tips

- Answer at least 5 questions for accurate results
- Be honest with your answers for best recommendations
- You can type 'done' after 5+ questions to see results early
- The system adapts - each question is chosen based on your previous answers

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
