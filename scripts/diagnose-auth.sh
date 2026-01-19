#!/bin/bash
echo "🔍 MOOVY Authentication Diagnostic"
echo "=================================="
echo ""

echo "1️⃣ Checking .env configuration..."
echo "-----------------------------------"
if [ -f .env ]; then
    echo "✓ .env file exists"
    echo ""
    echo "AUTH_SECRET:"
    grep "AUTH_SECRET" .env || echo "❌ AUTH_SECRET not found"
    echo ""
    echo "NEXTAUTH_URL:"
    grep "NEXTAUTH_URL" .env || echo "❌ NEXTAUTH_URL not found"
    echo ""
    echo "NODE_ENV:"
    grep "NODE_ENV" .env || echo "⚠️  NODE_ENV not set (defaulting to production)"
else
    echo "❌ .env file NOT found"
fi

echo ""
echo "2️⃣ Checking database connection..."
echo "-----------------------------------"
sudo -u postgres psql moovy_db -c "SELECT email, role FROM \"User\" WHERE role = 'ADMIN';" 2>/dev/null || echo "❌ Cannot connect to database"

echo ""
echo "3️⃣ Checking PM2 process..."
echo "-----------------------------------"
pm2 info moovy | grep -E "status|uptime|restarts" || echo "❌ PM2 process not found"

echo ""
echo "4️⃣ Checking Nginx configuration..."
echo "-----------------------------------"
if [ -f /etc/nginx/sites-available/moovy ]; then
    echo "✓ Nginx config exists"
    grep -E "server_name|proxy_pass" /etc/nginx/sites-available/moovy | head -10
else
    echo "❌ Nginx config not found"
fi

echo ""
echo "5️⃣ Checking recent errors..."
echo "-----------------------------------"
pm2 logs moovy --lines 10 --nostream --err 2>/dev/null | tail -10

echo ""
echo "=================================="
echo "Diagnostic complete!"
