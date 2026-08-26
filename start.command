#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "      🚀 TCAS Master Local Server        "
echo "=========================================="
echo "Starting local server at http://localhost:3000..."

# Install dependencies if missing
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Open browser
(sleep 1 && open "http://localhost:3000") &

# Start Node server
export PATH="/Users/jetniphatbenchamitkun/.local/node/bin:/usr/local/bin:$PATH"
node backend/server.js
