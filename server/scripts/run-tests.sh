#!/bin/bash

# Run Tests Script for ORCA Lead Management Software
# This script runs the test suite and generates coverage reports

# Set environment variables for testing
export NODE_ENV=test

# Create directory for test output
mkdir -p test-results

echo "Running model tests..."
npm run test:models

echo "Running API endpoint tests..."
npm run test:api

echo "Running end-to-end tests..."
npm run test:e2e

echo "Running full test suite with coverage..."
npm run test:coverage

echo "Testing complete!" 