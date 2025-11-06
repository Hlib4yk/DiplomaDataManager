require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const archiver = require('archiver');
const Database = require('./db');

const app = express();
// API runs on a fixed internal port (3001), Next.js uses Railway's PORT
const PORT = process.env.API_PORT || 3001;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize database
const db = new Database();

// Start server after database connection
(async () => {
  try {
    await db.connect();
    
    // API Routes
    
    // Get all groups
    app.get('/api/groups', async (req, res) => {
      try {
        const rows = await db.all('SELECT * FROM groups ORDER BY name ASC');
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Create a new group
    app.post('/api/groups', async (req, res) => {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Group name is required' });
      }
    
      try {
        const result = await db.run('INSERT INTO groups (name) VALUES ($1)', [name.trim()]);
        res.json({ id: result.lastID, name: name.trim() });
      } catch (err) {
        if (err.message && (err.message.includes('UNIQUE') || err.message.includes('duplicate'))) {
          return res.status(400).json({ error: 'Group name already exists' });
        }
        res.status(500).json({ error: err.message });
      }
    });
    
    // Get users in a group
    app.get('/api/groups/:groupId/users', async (req, res) => {
      const groupId = req.params.groupId;
      
      try {
        const rows = await db.all(
          `SELECT u.*, 
           (SELECT COUNT(*) FROM photos WHERE user_id = u.id) as photo_count
           FROM users u 
           WHERE u.group_id = $1 
           ORDER BY u.created_at DESC`,
          [groupId]
        );
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Create user with photos
    app.post('/api/groups/:groupId/users', upload.array('photos', 20), async (req, res) => {
      const groupId = req.params.groupId;
      const { firstName, lastName } = req.body;
    
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required' });
      }
    
      try {
        // Create the user
        let userId;
        if (db.type === 'postgresql') {
          const userResult = await db.run(
            'INSERT INTO users (group_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING id',
            [groupId, firstName.trim(), lastName.trim()]
          );
          userId = userResult.rows?.[0]?.id || userResult.lastID;
        } else {
          const userResult = await db.run(
            'INSERT INTO users (group_id, first_name, last_name) VALUES ($1, $2, $3)',
            [groupId, firstName.trim(), lastName.trim()]
          );
          userId = userResult.lastID;
        }
        const photos = req.files || [];
    
        if (photos.length === 0) {
          return res.json({ 
            id: userId, 
            firstName, 
            lastName, 
            photoCount: 0 
          });
        }
    
        // Insert photos
        for (const file of photos) {
          await db.run(
            'INSERT INTO photos (user_id, filename, original_name, file_path) VALUES ($1, $2, $3, $4)',
            [userId, file.filename, file.originalname, file.path]
          );
        }
    
        res.json({ 
          id: userId, 
          firstName, 
          lastName, 
          photoCount: photos.length 
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Get user with photos
    app.get('/api/users/:userId', async (req, res) => {
      const userId = req.params.userId;
      
      try {
        const user = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        const photos = await db.all('SELECT * FROM photos WHERE user_id = $1', [userId]);
        res.json({ ...user, photos });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Delete a group (cascades to users and photos)
    app.delete('/api/groups/:groupId', async (req, res) => {
      const groupId = req.params.groupId;
    
      try {
        // Get all photos for users in this group to delete files
        const photos = await db.all(`
          SELECT p.file_path 
          FROM photos p
          JOIN users u ON p.user_id = u.id
          WHERE u.group_id = $1
        `, [groupId]);
    
        // Delete photo files
        photos.forEach(photo => {
          if (photo.file_path && fs.existsSync(photo.file_path)) {
            try {
              fs.unlinkSync(photo.file_path);
            } catch (fileErr) {
              console.error('Error deleting file:', fileErr);
            }
          }
        });
    
        // Get all user IDs in this group
        const users = await db.all('SELECT id FROM users WHERE group_id = $1', [groupId]);
        const userIds = users.map(u => u.id);
    
        // Delete all photos for users in this group
        if (userIds.length > 0) {
          if (db.type === 'postgresql') {
            const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
            await db.run(`DELETE FROM photos WHERE user_id IN (${placeholders})`, userIds);
          } else {
            const placeholders = userIds.map(() => '?').join(',');
            await db.run(`DELETE FROM photos WHERE user_id IN (${placeholders})`, userIds);
          }
        }
    
        // Delete all users in this group
        await db.run('DELETE FROM users WHERE group_id = $1', [groupId]);
    
        // Finally, delete the group
        const result = await db.run('DELETE FROM groups WHERE id = $1', [groupId]);
        
        if (result.changes === 0) {
          return res.status(404).json({ error: 'Group not found' });
        }
        
        res.json({ message: 'Group deleted successfully', deletedId: groupId });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Delete a user (cascades to photos)
    app.delete('/api/users/:userId', async (req, res) => {
      const userId = req.params.userId;
    
      try {
        // Get all photos for this user to delete files
        const photos = await db.all('SELECT file_path FROM photos WHERE user_id = $1', [userId]);
    
        // Delete photo files
        photos.forEach(photo => {
          if (photo.file_path && fs.existsSync(photo.file_path)) {
            try {
              fs.unlinkSync(photo.file_path);
            } catch (fileErr) {
              console.error('Error deleting file:', fileErr);
            }
          }
        });
    
        // Delete photos from database
        await db.run('DELETE FROM photos WHERE user_id = $1', [userId]);
    
        // Delete the user
        const result = await db.run('DELETE FROM users WHERE id = $1', [userId]);
        
        if (result.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully', deletedId: userId });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Cleanup orphaned photos
    app.delete('/api/admin/cleanup-orphaned-photos', async (req, res) => {
      try {
        const orphanedPhotos = await db.all(`
          SELECT p.id, p.file_path 
          FROM photos p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE u.id IS NULL
        `);
    
        if (orphanedPhotos.length === 0) {
          return res.json({ 
            message: 'No orphaned photos found',
            deletedCount: 0 
          });
        }
    
        // Delete photo files
        let filesDeleted = 0;
        orphanedPhotos.forEach(photo => {
          if (photo.file_path && fs.existsSync(photo.file_path)) {
            try {
              fs.unlinkSync(photo.file_path);
              filesDeleted++;
            } catch (fileErr) {
              console.error('Error deleting file:', fileErr);
            }
          }
        });
    
        // Delete orphaned photos from database
        const photoIds = orphanedPhotos.map(p => p.id);
        if (photoIds.length > 0) {
          let result;
          if (db.type === 'postgresql') {
            const placeholders = photoIds.map((_, i) => `$${i + 1}`).join(',');
            result = await db.run(`DELETE FROM photos WHERE id IN (${placeholders})`, photoIds);
          } else {
            const placeholders = photoIds.map(() => '?').join(',');
            result = await db.run(`DELETE FROM photos WHERE id IN (${placeholders})`, photoIds);
          }
          
          res.json({ 
            message: `Cleaned up ${result.changes} orphaned photo(s)`,
            deletedCount: result.changes,
            filesDeleted: filesDeleted
          });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Get all data (for admin view)
    app.get('/api/admin/all', async (req, res) => {
      try {
        const groups = await db.all('SELECT * FROM groups ORDER BY name ASC');
        const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
        const photos = await db.all('SELECT * FROM photos ORDER BY created_at DESC');
        
        res.json({ groups, users, photos });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Export dataset
    app.get('/api/export', async (req, res) => {
      const exportDir = path.join(__dirname, 'export');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
    
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipPath = path.join(exportDir, `dataset-${timestamp}.zip`);
    
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
    
      output.on('close', () => {
        res.download(zipPath, `dataset-${timestamp}.zip`, (err) => {
          if (err) {
            console.error('Error downloading file:', err);
          }
          // Clean up after download
          setTimeout(() => {
            if (fs.existsSync(zipPath)) {
              fs.unlinkSync(zipPath);
            }
          }, 10000);
        });
      });
    
      archive.on('error', (err) => {
        res.status(500).json({ error: err.message });
      });
    
      archive.pipe(output);
    
      try {
        const rows = await db.all(`
          SELECT 
            g.name as group_name,
            u.id as user_id,
            u.first_name,
            u.last_name,
            p.filename,
            p.original_name,
            p.file_path
          FROM groups g
          JOIN users u ON g.id = u.group_id
          LEFT JOIN photos p ON u.id = p.user_id
          ORDER BY g.name, u.id, p.id
        `);
    
        // Create CSV data
        const csvRows = ['Group,User ID,First Name,Last Name,Photo Filename,Photo Original Name'];
    
        rows.forEach(row => {
          csvRows.push(
            `"${row.group_name}","${row.user_id}","${row.first_name}","${row.last_name}","${row.filename || ''}","${row.original_name || ''}"`
          );
        });
    
        archive.append(csvRows.join('\n'), { name: 'dataset.csv' });
    
        // Add photos organized by group/user
        const processedFiles = new Set();
        rows.forEach(row => {
          if (row.file_path && fs.existsSync(row.file_path) && !processedFiles.has(row.file_path)) {
            const groupName = row.group_name.replace(/[^a-zA-Z0-9]/g, '_');
            const userName = `${row.first_name}_${row.last_name}`.replace(/[^a-zA-Z0-9]/g, '_');
            const archivePath = `${groupName}/${userName}/${row.filename}`;
            archive.file(row.file_path, { name: archivePath });
            processedFiles.add(row.file_path);
          }
        });
    
        archive.finalize();
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on ${API_URL}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
