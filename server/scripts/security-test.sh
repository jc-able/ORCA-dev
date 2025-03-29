#!/bin/bash

# Security Testing Script for ORCA Lead Management Software
# This script runs various security checks to identify potential vulnerabilities

# Set environment variables
export NODE_ENV=test

# Create directory for security test output
mkdir -p security-test-results

echo "Running npm audit to check for package vulnerabilities..."
npm audit > security-test-results/npm-audit.txt

echo "Running dependency check to identify outdated packages..."
npm outdated > security-test-results/npm-outdated.txt

echo "Checking for common secrets in code..."
# This is a simple implementation; in production, you might use tools like Gitleaks or truffleHog
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" --include="*.js" --exclude-dir="node_modules" . > security-test-results/secrets-check.txt

echo "Checking for insecure configurations..."
# Look for potential security misconfigurations
grep -r "cors\|helmet\|csp\|xss\|csrf" --include="*.js" --exclude-dir="node_modules" . > security-test-results/config-check.txt

echo "Generating security report..."
cat << EOF > security-test-results/security-report.md
# ORCA Security Test Report
Generated on: $(date)

## Package Security
See npm-audit.txt for detailed vulnerability information.

## Dependency Status
See npm-outdated.txt for outdated packages that may need updating.

## Code Security Checks
Potential secrets or sensitive strings found in the codebase: $(wc -l < security-test-results/secrets-check.txt) occurrences.
Security-related configurations: $(wc -l < security-test-results/config-check.txt) occurrences.

## Security Recommendations
1. Review and fix any vulnerabilities found in npm-audit.txt
2. Update outdated packages if possible
3. Review potential secrets found in the codebase
4. Ensure proper security configurations for Express.js

EOF

echo "Security testing complete! Results available in security-test-results/ directory." 