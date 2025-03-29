/**
 * Prepare script for development setup
 * 
 * This script only runs husky install in development environments, not in CI/CD or Vercel
 */

const { execSync } = require('child_process');

// Check if we're in a CI or Vercel environment
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const isVercel = process.env.VERCEL === 'true' || process.env.VERCEL === '1';

// Only install husky in development environments
if (!isCI && !isVercel) {
  console.log('Setting up husky hooks for development environment...');
  try {
    execSync('npx husky install', { stdio: 'inherit' });
    console.log('Husky hooks installed successfully!');
  } catch (error) {
    console.error('Failed to install husky hooks:', error.message);
    // Don't exit with error, as we don't want to block the installation in case of issues
    // The developer can manually set up hooks if needed
  }
} else {
  console.log('Skipping husky installation in CI/CD or Vercel environment');
} 