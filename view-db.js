#!/usr/bin/env node

/**
 * Simple script to view database contents via command line
 * Usage: node view-db.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'diploma_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database:', dbPath);
  console.log('='.repeat(60));
});

// Get all groups
db.all('SELECT * FROM groups ORDER BY name ASC', (err, groups) => {
  if (err) {
    console.error('Error fetching groups:', err.message);
    return;
  }

  console.log('\n📁 GROUPS:');
  console.log('-'.repeat(60));
  if (groups.length === 0) {
    console.log('No groups found.');
  } else {
    groups.forEach(group => {
      console.log(`  ID: ${group.id} | Name: ${group.name} | Created: ${group.created_at}`);
    });
  }

  // Get all users
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return;
    }

    console.log('\n👥 USERS:');
    console.log('-'.repeat(60));
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach(user => {
        console.log(`  ID: ${user.id} | Group ID: ${user.group_id} | Name: ${user.first_name} ${user.last_name} | Created: ${user.created_at}`);
      });
    }

    // Get all photos
    db.all('SELECT * FROM photos ORDER BY created_at DESC', (err, photos) => {
      if (err) {
        console.error('Error fetching photos:', err.message);
        return;
      }

      console.log('\n📸 PHOTOS:');
      console.log('-'.repeat(60));
      if (photos.length === 0) {
        console.log('No photos found.');
      } else {
        photos.forEach(photo => {
          console.log(`  ID: ${photo.id} | User ID: ${photo.user_id} | Original: ${photo.original_name || 'N/A'} | File: ${photo.filename} | Created: ${photo.created_at}`);
        });
      }

      // Summary
      console.log('\n📊 SUMMARY:');
      console.log('-'.repeat(60));
      console.log(`  Total Groups: ${groups.length}`);
      console.log(`  Total Users: ${users.length}`);
      console.log(`  Total Photos: ${photos.length}`);

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('\nDatabase connection closed.');
        }
      });
    });
  });
});

