#!/bin/bash

# Development startup script for Git Visualizer
# This script ensures the project starts seamlessly across different environments

set -e  # Exit on any error

echo "🚀 Starting Git Visualizer development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.18+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_MAJOR=18
CURRENT_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$CURRENT_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 18.18.0 or later."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Enable corepack for package manager compatibility
echo "🔧 Enabling corepack..."
corepack enable

# Install dependencies if node_modules doesn't exist or package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📥 Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Run type checking to catch issues early
echo "🔍 Running type check..."
pnpm typecheck

# Run linting to ensure code quality
echo "🧹 Running linter..."
pnpm lint

# Check if the project builds successfully
echo "🏗️  Testing build..."
pnpm build

echo "✅ All checks passed! Starting development server..."

# Start the development server
pnpm dev