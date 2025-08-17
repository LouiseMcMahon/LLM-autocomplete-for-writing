#!/bin/bash

# Build script for AI Writing Assistant Chrome Extension

set -e

echo "🚀 Building AI Writing Assistant Chrome Extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# Lint code
echo "📝 Linting code..."
npm run lint

# Build extension
echo "🔨 Building extension..."
if [ "$1" = "--dev" ]; then
    echo "📱 Building in development mode..."
    npm run build:dev
else
    echo "🚀 Building in production mode..."
    npm run build
fi

# Check if build was successful
if [ -d "dist" ] && [ -f "dist/manifest.json" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Extension files are in the 'dist' directory"
    echo ""
    echo "📋 To load the extension in Chrome:"
    echo "   1. Open Chrome and go to chrome://extensions/"
    echo "   2. Enable 'Developer mode'"
    echo "   3. Click 'Load unpacked' and select the 'dist' folder"
    echo ""
    echo "🔧 To watch for changes during development:"
    echo "   npm run watch"
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi