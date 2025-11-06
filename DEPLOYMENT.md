# Deployment Guide

This guide will help you deploy the Diploma Data Manager app to a hosting platform so your friends can use it to gather the dataset.

## Quick Start: Railway (Recommended)

Railway is the easiest option and provides a free tier.

### Step 1: Prepare Your Code

1. Make sure all your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or your Git provider)
4. Select your repository
5. Railway will automatically detect it's a Node.js app

### Step 3: Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. The `DATABASE_URL` environment variable will be automatically set

### Step 4: Configure Environment Variables

Railway should automatically set:
- `DATABASE_URL` (from the PostgreSQL service)
- `PORT` (automatically set by Railway)
- `NODE_ENV=production`

### Step 5: Deploy

1. Railway will automatically build and deploy your app
2. Once deployed, Railway will give you a URL like `https://your-app.railway.app`
3. Your app should be live!

### Step 6: Update Next.js API URL (if needed)

If your API and frontend are on different URLs, you may need to set:
- `NEXT_PUBLIC_API_URL` environment variable to your API server URL

## Alternative: Render

### Step 1: Deploy Backend API

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: diploma-data-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Plan**: Free

5. Add environment variables:
   - `DATABASE_URL` (you'll need to add a PostgreSQL database separately)
   - `PORT=3001`
   - `NODE_ENV=production`

### Step 2: Deploy Frontend

1. Click "New" → "Web Service" again
2. Same repository, but configure:
   - **Name**: diploma-data-frontend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend API URL (from step 1)
   - `NODE_ENV=production`

### Step 3: Add PostgreSQL Database

1. Click "New" → "PostgreSQL"
2. Copy the connection string
3. Add it as `DATABASE_URL` in your backend service

## Environment Variables Reference

### Required for Production:
- `DATABASE_URL` - PostgreSQL connection string (provided by hosting platform)
- `PORT` - Server port (usually set automatically by hosting platform)
- `NODE_ENV=production`

### Optional:
- `API_URL` - Your API server URL (for Next.js rewrites)
- `NEXT_PUBLIC_API_URL` - Public API URL (if frontend/backend are separate)

## Important Notes

1. **File Storage**: Uploaded photos are stored in the `uploads/` directory. On most hosting platforms, this is ephemeral (files may be lost on restart). For production, consider using cloud storage (AWS S3, Cloudinary, etc.) - this would require code changes.

2. **Database**: The app automatically uses PostgreSQL when `DATABASE_URL` is set, or SQLite for local development.

3. **Ports**: 
   - Backend API runs on port 3001 (or PORT env var)
   - Next.js frontend runs on port 3000 (or automatically assigned)

4. **Build Process**: The app builds Next.js during deployment. Make sure `npm run build` completes successfully.

## Troubleshooting

### Database Connection Issues
- Make sure `DATABASE_URL` is set correctly
- Check that PostgreSQL is running and accessible
- Verify SSL settings if required

### API Not Working
- Check that the backend server is running
- Verify `NEXT_PUBLIC_API_URL` is set correctly if frontend/backend are separate
- Check Next.js rewrites in `next.config.js`

### File Upload Issues
- Ensure `uploads/` directory has write permissions
- Check file size limits (currently 10MB per file)

## Getting Your App URL

Once deployed, you'll get a URL like:
- Railway: `https://your-app-name.railway.app`
- Render: `https://your-app-name.onrender.com`

Share this URL with your friends so they can access the app!

## Next Steps

After deployment:
1. Test creating a group
2. Test adding users with photos
3. Test the export functionality
4. Share the URL with your friends
5. Monitor usage in your hosting platform dashboard

