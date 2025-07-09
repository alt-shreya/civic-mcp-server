#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Setting up Civic Auth MCP Server...\n');

// Check if .env.local exists
if (!existsSync('.env.local')) {
  console.log('📝 Creating .env.local from .env.example...');
  try {
    const envExample = readFileSync('.env.example', 'utf8');
    writeFileSync('.env.local', envExample);
    console.log('✅ Created .env.local');
    console.log('⚠️  Remember to add your CLIENT_ID to .env.local\n');
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error.message);
  }
} else {
  console.log('✅ .env.local already exists\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  await execAsync('npm install');
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Add your Civic Auth CLIENT_ID to .env.local');
console.log('2. Run: npm start');
console.log('3. Visit: http://localhost:3000/health\n');

console.log('📚 Resources:');
console.log('- Civic Auth Dashboard: https://auth.civic.com');
console.log('- Documentation: https://docs.civic.com');
console.log('- MCP Guide: https://docs.civic.com/guides/add-auth-to-mcp');
