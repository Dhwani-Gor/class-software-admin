#!/bin/bash

echo "🚀 SSL Setup for gambiaclass.org"

# Pre-configured for your domain
DOMAIN="gambiaclass.org"
EMAIL="info@gambiaclass.org"

echo "Enter your email for Let's Encrypt certificate:"
read EMAIL

echo "Setting up SSL for: $DOMAIN (including www.gambiaclass.org)"

# Create directories
mkdir -p ssl ssl-challenge

# Start containers
echo "Starting Docker containers..."
docker compose up -d --build
sleep 15

echo "Generating SSL certificate for both gambiaclass.org and www.gambiaclass.org..."

# Get SSL certificate for both domain and www subdomain
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/ssl-challenge:/var/www/certbot \
  certbot/certbot \
  certonly --webroot -w /var/www/certbot \
  --email $EMAIL --agree-tos --no-eff-email --expand \
  -d $DOMAIN -d www.$DOMAIN -d dev.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate generated successfully!"

    (crontab -l 2>/dev/null; echo '0 3 * * * docker run --rm -v $(pwd)/ssl:/etc/letsencrypt -v $(pwd)/ssl-challenge:/var/www/certbot certbot/certbot renew && docker exec nginx-proxy nginx -s reload') | crontab -

    # Restart nginx with SSL
    echo "Restarting nginx with SSL configuration..."
    docker compose restart nginx
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "Your website is now available at:"
    echo "  ✅ https://gambiaclass.org"
    echo "  ✅ https://www.gambiaclass.org"
    echo ""
    echo "Both HTTP URLs will automatically redirect to HTTPS"
    
else
    echo "❌ Failed to generate SSL certificate"
    echo "Please check:"
    echo "  1. DNS records are propagated (wait 1-2 hours after DNS setup)"
    echo "  2. Ports 80 and 443 are open on your server"
    echo "  3. No other services are using these ports"
    echo ""
    echo "You can check DNS propagation at: https://dnschecker.org"
fi
