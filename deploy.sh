#!/bin/bash

# The 100 Candles - EC2 Deployment Script
# Usage: Upload this script and index.html to your EC2 instance, then run:
# chmod +x deploy.sh
# ./deploy.sh

echo "🚀 Starting Deployment..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt update -y

# 2. Install Nginx
echo "🔧 Installing Nginx..."
sudo apt install nginx -y

# 3. Start Nginx
echo "🟢 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 4. Deploy Application
echo "📂 Deploying index.html..."
if [ -f "index.html" ]; then
    # Remove default Nginx page
    sudo rm -rf /var/www/html/*
    
    # Copy new file
    sudo cp index.html /var/www/html/index.html
    
    # Set permissions
    sudo chown www-data:www-data /var/www/html/index.html
    sudo chmod 644 /var/www/html/index.html
    
    echo "✅ Deployment Success!"
    echo "🌎 Visit your instance IP to see The 100 Candles live."
else
    echo "❌ Error: index.html not found in the current directory."
    echo "   Please upload index.html to the same folder as this script."
fi
