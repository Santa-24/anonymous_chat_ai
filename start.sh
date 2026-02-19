#!/bin/bash

echo "🚀 Anonymous Chat Backend - Quick Start"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your Groq API key!"
    echo ""
    echo "📝 Edit .env and add your Groq API key:"
    echo "   nano .env"
    echo ""
    echo "🔑 Get your free API key at: https://console.groq.com"
    echo ""
    exit 0
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Check if OPENAI_API_KEY is set
source .env
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" == "gsk_your_groq_api_key_here" ]; then
    echo "⚠️  Groq API key not configured!"
    echo ""
    echo "Please edit .env and set your OPENAI_API_KEY:"
    echo "   nano .env"
    echo ""
    echo "🔑 Get your free API key at: https://console.groq.com"
    echo ""
    exit 1
fi

# Start the server
echo "🎉 Starting server..."
echo ""
echo "Server will be available at:"
echo "   http://localhost:${PORT:-3000}"
echo ""
echo "Admin dashboard:"
echo "   http://localhost:${PORT:-3000}/admin.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start