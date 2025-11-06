# Diploma Data Manager

A modern web application built with Next.js, React, and Tailwind CSS for managing groups, users, and photos with dataset export functionality.

## Features

- **Group Management**: Create and view groups (e.g., OI-44, OI-45)
- **User Management**: Add users to groups with first name and last name
- **Photo Upload**: Upload multiple photos per user
- **Database Storage**: All data stored in SQLite database
- **Dataset Export**: Export all data as a ZIP file containing CSV and organized photos
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

You need to run two servers. You have two options:

### Option 1: Run both servers together (Recommended for development)

```bash
npm run dev:all
```

This will start both the API server (port 3001) and Next.js dev server (port 3000) simultaneously.

### Option 2: Run servers separately

1. **Start the API server** (runs on port 3001):
```bash
npm run server
```

Or in development mode with auto-reload:
```bash
npm run server:dev
```

2. **Start the Next.js frontend** (runs on port 3000):
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## How to Use

1. **Create a Group**: Click the "Create Group" button and enter a group name (e.g., OI-44)
2. **Select a Group**: Click on any group card to start adding users
3. **Add User**: Fill in the first name, last name, and upload photos
4. **Export Dataset**: Click the "Export Dataset" button to download all data as a ZIP file

## Project Structure

```
DiplomaData/
├── server.js              # Express API server (port 3001)
├── package.json           # Dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── pages/                 # Next.js pages
│   ├── _app.tsx          # App wrapper
│   └── index.tsx         # Main page
├── components/            # React components
│   ├── CreateGroupModal.tsx
│   ├── GroupsList.tsx
│   ├── UserForm.tsx
│   ├── ExportButton.tsx
│   └── Message.tsx
├── styles/                # Global styles
│   └── globals.css        # Tailwind CSS imports
├── uploads/               # Uploaded photos (created automatically)
├── export/                # Temporary export files (created automatically)
└── diploma_data.db        # SQLite database (created automatically)
```

## Viewing Database Contents

You have three ways to view what's stored in your database:

### Option 1: Web Admin Page (Recommended)
1. Make sure your servers are running
2. Navigate directly to `http://localhost:3000/admin` in your browser
   - Note: The admin panel is only accessible via direct link (not linked from the main page)

This will show you a nice table view of all groups, users, and photos with their relationships.

### Option 2: Command Line Script
Run the provided script:
```bash
npm run view-db
```

This will display all database contents in your terminal.

### Option 3: SQLite Command Line
If you have SQLite installed, you can use:
```bash
sqlite3 diploma_data.db
```

Then run SQL queries:
```sql
-- View all groups
SELECT * FROM groups;

-- View all users
SELECT * FROM users;

-- View all photos
SELECT * FROM photos;

-- View users with their groups
SELECT u.*, g.name as group_name 
FROM users u 
JOIN groups g ON u.group_id = g.id;

-- Exit
.quit
```

## API Endpoints

- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:groupId/users` - Get users in a group
- `POST /api/groups/:groupId/users` - Create user with photos
- `GET /api/users/:userId` - Get user details with photos
- `GET /api/admin/all` - Get all database data (for admin page)
- `GET /api/export` - Export dataset as ZIP

## Database Schema

- **groups**: id, name, created_at
- **users**: id, group_id, first_name, last_name, created_at
- **photos**: id, user_id, filename, original_name, file_path, created_at

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite3 (local) / PostgreSQL (production)
- **File Upload**: Multer
- **Export**: Archiver

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on how to deploy this app to Railway, Render, or other hosting platforms.

