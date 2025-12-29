# Vercel Deployment Guide

Your project is now configured to deploy both Python backend and Next.js frontend to Vercel!

## 📋 What Was Set Up

1. **Python Serverless Functions** - Each Flask route is now a separate serverless function:

   - `api/start.py` - Get first survey question
   - `api/answer.py` - Submit answer and get next question
   - `api/current.py` - Get current question
   - `api/results.py` - Calculate career recommendations with AI
   - `api/health.py` - Health check endpoint

2. **Configuration Files**:
   - `vercel.json` - Configures Python runtime for API functions
   - `.vercelignore` - Excludes unnecessary files from deployment

## 🚀 Deployment Steps

### 1. Set Environment Variable in Vercel

Before deploying, you MUST add your Perplexity API key:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `PERPLEXITY_API_KEY`
   - **Value**: Your Perplexity API key
   - **Environment**: Production, Preview, and Development

### 2. Deploy to Vercel

Run one of these commands:

```bash
# Deploy to production
npx vercel --prod

# Or just deploy
vercel
```

### 3. Test Your Deployment

After deployment, test these endpoints:

- `https://your-domain.vercel.app/api/health` - Should return status "ok"
- Your Next.js app will be at `https://your-domain.vercel.app`

## 🔧 API Endpoints

Your Python API will be accessible at:

- `/api/start` - POST request to start survey
- `/api/answer` - POST request to submit answer
- `/api/current` - POST request to get current question
- `/api/results` - POST request to get career recommendations
- `/api/health` - GET request for health check

## 📝 Important Notes

1. **Python Version**: Using Python 3.9 runtime on Vercel
2. **Stateless Functions**: All functions are stateless and work with serverless architecture
3. **JSON Data**: The `dataset_with_relations.json` file will be included in each function deployment
4. **Dependencies**: Install from `api/requirements.txt`:
   - flask>=2.3.0
   - flask-cors>=4.0.0
   - openai>=1.0.0

## 🔍 Troubleshooting

If deployment fails:

1. Check that `PERPLEXITY_API_KEY` is set in Vercel environment variables
2. Verify all files in the `api/` folder are present
3. Check Vercel deployment logs for specific errors
4. Ensure `requirements.txt` is in the `api/` directory

## ✅ What's Different from Local Development

- **No Flask app server** - Each endpoint is a separate serverless function
- **No CORS needed** - Both frontend and backend are on the same domain
- **Environment variables** - Must be set in Vercel dashboard, not in `.env` files
- **Cold starts** - First request to each function may be slower

Your app is ready to deploy! 🎉
