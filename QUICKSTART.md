# 🚀 Quick Start Guide

## Step 1: Install Backend Dependencies

Open a terminal and run:

```powershell
cd api
pip install flask flask-cors
```

## Step 2: Start the Backend Server

In the same terminal (from the `api` folder):

```powershell
python server.py
```

✅ You should see: `Running on http://127.0.0.1:5000`

## Step 3: Start the Frontend

Open a **NEW** terminal and run:

```powershell
npm run dev
```

✅ You should see: `Local: http://localhost:3000`

## Step 4: Open the Application

Open your browser and go to:
**http://localhost:3000**

## 🎉 That's it!

You now have:

- Backend API running on port 5000
- Frontend UI running on port 3000
- Full AI-powered career advisor system

## 💡 Usage

1. Click "Start Career Assessment"
2. Answer the questions honestly
3. Get personalized career recommendations!

The system intelligently adapts questions based on your answers and provides real-time insights.

---

### Troubleshooting

**If backend fails to start:**

```powershell
pip install --upgrade flask flask-cors
```

**If frontend fails to start:**

```powershell
npm install
npm run dev
```

**Check if everything is working:**

- Backend health: http://localhost:5000/api/health
- Frontend: http://localhost:3000
