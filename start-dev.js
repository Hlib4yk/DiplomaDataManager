#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting API server and Next.js dev server...\n');

// Start API server
const apiServer = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// Start Next.js dev server
const nextServer = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  apiServer.kill();
  nextServer.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  apiServer.kill();
  nextServer.kill();
  process.exit();
});

