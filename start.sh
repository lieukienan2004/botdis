#!/bin/bash

echo "================================"
echo "   Discord Music Bot 24/7"
echo "================================"
echo ""

# Kiểm tra Node.js
echo "Checking Node.js..."
node --version
echo ""

# Cài đặt dependencies
echo "Installing dependencies..."
npm install
echo ""

# Chạy bot
echo "Starting bot..."
echo "Press Ctrl+C to stop the bot"
echo ""

# Chạy với auto-restart nếu crash
while true; do
    node index.js
    echo "Bot stopped. Restarting in 5 seconds..."
    sleep 5
done