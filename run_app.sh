#!/bin/bash

# Ground Booking Application Runner Script
# This script sets up and runs the ground booking application independently

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        print_status "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up background processes..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null || true
    fi
    # Also cleanup any remaining processes on our ports
    kill_port 5001
    kill_port 3000
    exit 0
}

# Set up signal handlers for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Main execution starts here
print_status "Starting Ground Booking Application Setup..."

# Check if Node.js is installed
if ! command_exists node; then
    # Try to find Node.js in common Homebrew installation paths
    if [ -f "/usr/local/Cellar/node/"*/bin/node ]; then
        NODE_PATH=$(find /usr/local/Cellar/node -name node -type f 2>/dev/null | head -1)
        if [ ! -z "$NODE_PATH" ]; then
            export PATH="$(dirname $NODE_PATH):$PATH"
            print_status "Found Node.js at: $NODE_PATH"
        fi
    fi

    # Check again after trying to find Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js (version 14 or higher) first."
        print_status "Visit: https://nodejs.org/ to download and install Node.js"
        print_status "Or install via Homebrew: brew install node"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    print_error "Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Navigate to project directory
cd "$(dirname "$0")"
print_status "Working directory: $(pwd)"

# Install root dependencies
print_status "Installing root dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
    print_success "Root dependencies installed"
else
    print_status "Root dependencies already installed"
fi

# Install server dependencies
print_status "Installing server dependencies..."
cd server
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
    print_success "Server dependencies installed"
else
    print_status "Server dependencies already installed"
fi
cd ..

# Install client dependencies
print_status "Installing client dependencies..."
cd client
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
    print_success "Client dependencies installed"
else
    print_status "Client dependencies already installed"
fi
cd ..

# Check if MongoDB is running (optional check)
print_status "Checking MongoDB connection..."
if command_exists mongod; then
    # Try to connect to MongoDB
    if mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
        print_success "MongoDB is running and accessible"
    else
        print_warning "MongoDB might not be running. Make sure MongoDB is started before using the application."
        print_status "To start MongoDB: brew services start mongodb-community (on macOS with Homebrew)"
        print_status "Or: sudo systemctl start mongod (on Linux)"
    fi
else
    print_warning "MongoDB client not found. Make sure MongoDB is installed and running."
fi

# Check and cleanup ports before starting
print_status "Checking if ports are available..."
if check_port 5001; then
    print_warning "Port 5001 is already in use. Attempting to free it..."
    kill_port 5001
fi

if check_port 3000; then
    print_warning "Port 3000 is already in use. Attempting to free it..."
    kill_port 3000
fi

# Start the server in background
print_status "Starting server on port 5001..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    print_success "Server started successfully (PID: $SERVER_PID)"
else
    print_error "Failed to start server"
    exit 1
fi

# Start the client in background
print_status "Starting React client on port 3000..."
cd client
npm start &
CLIENT_PID=$!
cd ..

# Wait a moment for client to start
sleep 5

# Check if client is running
if ps -p $CLIENT_PID > /dev/null; then
    print_success "Client started successfully (PID: $CLIENT_PID)"
else
    print_error "Failed to start client"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Display application information
echo ""
echo "=========================================="
print_success "Ground Booking Application is now running!"
echo "=========================================="
echo ""
echo -e "${GREEN}Frontend (React):${NC} http://localhost:3000"
echo -e "${GREEN}Backend API:${NC} http://localhost:5001"
echo ""
echo -e "${BLUE}Server PID:${NC} $SERVER_PID"
echo -e "${BLUE}Client PID:${NC} $CLIENT_PID"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"
echo ""

# Wait for user to stop the application
wait $SERVER_PID $CLIENT_PID
