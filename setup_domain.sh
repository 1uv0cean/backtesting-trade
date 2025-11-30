#!/bin/bash

# The 100 Candles - Domain & SSL Setup Script
# Usage: Upload to EC2 and run: sudo ./setup_domain.sh

DOMAIN="the100candles.com"
EMAIL="admin@the100candles.com" # Change this if needed

echo "🚀 Setting up Domain & SSL for $DOMAIN..."

# 1. Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Configure Nginx
echo "🔧 Configuring Nginx..."
CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"

sudo bash -c "cat > $CONFIG_FILE" <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Enable the site
sudo ln -s $CONFIG_FILE /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 3. Obtain SSL Certificate
echo "🔒 Obtaining SSL Certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "✅ Setup Complete! Visit https://$DOMAIN"
