#!/bin/bash

# Test script for AI Writing Assistant Chrome Extension

set -e

echo "🧪 Running AI Writing Assistant Tests..."

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

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# Lint code
echo "📝 Linting code..."
npm run lint

# Run tests based on arguments
case "$1" in
    "--watch")
        echo "👀 Running tests in watch mode..."
        npm run test:watch
        ;;
    "--coverage")
        echo "📊 Running tests with coverage..."
        npm run test:coverage
        ;;
    "--verbose")
        echo "🔍 Running tests with verbose output..."
        npm test -- --verbose
        ;;
    *)
        echo "✅ Running tests..."
        npm test
        ;;
esac

echo ""
echo "🎉 Tests completed!"
echo ""
echo "📋 Available test commands:"
echo "   npm test              - Run tests once"
echo "   npm run test:watch    - Run tests in watch mode"
echo "   npm run test:coverage - Run tests with coverage report"
echo "   ./scripts/test.sh --verbose - Run tests with verbose output"