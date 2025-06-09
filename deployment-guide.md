# Detailed Deployment Guide for RecrutementPlus CRM

This guide provides comprehensive, step-by-step instructions for deploying the RecrutementPlus CRM application on a VPS with Docker, PM2, and Nginx.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [PostgreSQL Database Setup](#postgresql-database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL Setup](#ssl-setup)
8. [Backup Configuration](#backup-configuration)
9. [Monitoring Setup](#monitoring-setup)
10. [Maintenance Tasks](#maintenance-tasks)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

Before beginning deployment, ensure you have:

- A VPS with at least 2GB RAM and 2 CPU cores
- Ubuntu 20.04 LTS or newer
- Root or sudo access
- A domain name pointing to your VPS
- Your GitHub repository access

## Initial Server Setup

These steps prepare your VPS with all necessary software and security configurations.

```bash
# Login to your VPS as root or sudo user
ssh root@your-server-ip

# Update package lists and upgrade installed packages
apt update
apt upgrade -y

# Install required packages
apt install -y \
  docker.io \
  nginx \
  python3-venv \
  python3-pip \
  nodejs \
  npm \
  git \
  certbot \
  python3-certbot-nginx \
  ufw \
  htop \
  iotop

# Configure the firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Verify firewall status
ufw status

# Create deployment user (optional but recommended)
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to deploy user for remaining steps (optional)
su - deploy
```

## PostgreSQL Database Setup

These steps set up a PostgreSQL database using Docker with proper data persistence.

```bash
# Create directory structure for PostgreSQL data
sudo mkdir -p /data/postgres

# Create a directory for initialization scripts
sudo mkdir -p /data/postgres/init

# Set appropriate permissions
sudo chown -R $USER:$USER /data/postgres

# Create initialization script
cat > /data/postgres/init/init.sql << 'EOF'
-- This file will be executed on first container startup
-- You can add any SQL initialization commands here
CREATE DATABASE recruitment_plus;
EOF

# Launch PostgreSQL container
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=recruitment_plus \
  -v /data/postgres:/var/lib/postgresql/data \
  -v /data/postgres/init:/docker-entrypoint-initdb.d \
  -p 5432:5432 \
  postgres:14

# Verify the container is running
docker ps

# Test database connection
docker exec -it postgres psql -U postgres -c "SELECT version();"
```

## Backend Deployment

This section covers cloning the repository and setting up the FastAPI backend application.

```bash
# Create application directory
sudo mkdir -p /opt/crm
sudo chown -R $USER:$USER /opt/crm

# Clone repository
git clone https://github.com/your-repo/RecrutementPlus_CRM_FullStack.git /opt/crm

# Navigate to backend directory
cd /opt/crm/rec_back

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
pip install gunicorn

# Create production .env file
cat > .env << 'EOF'
# Database configuration
DATABASE_URL=postgresql://postgres:secure_password@localhost:5432/recruitment_plus

# Security
SECRET_KEY=your_secure_key_here
ENVIRONMENT=production
DEBUG=False

# CORS settings
FRONTEND_URL=https://your-domain.com

# OpenAI API (if used)
OPENAI_API_KEY=your_openai_api_key_here
EOF

# Run database migrations
# Make sure PostgreSQL is running before this step
alembic upgrade head

# Create systemd service file
sudo tee /etc/systemd/system/fastapi.service > /dev/null << 'EOF'
[Unit]
Description=FastAPI CRM Backend
After=network.target
Wants=postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/crm/rec_back
ExecStart=/opt/crm/rec_back/venv/bin/gunicorn \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  -b 0.0.0.0:8000 \
  app.main:app
Restart=always
RestartSec=5
Environment="PATH=/opt/crm/rec_back/venv/bin"
Environment="PYTHONPATH=/opt/crm/rec_back"
EnvironmentFile=/opt/crm/rec_back/.env

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions for service
sudo chown -R www-data:www-data /opt/crm/rec_back
sudo chmod -R 755 /opt/crm/rec_back

# Reload systemd, start and enable service
sudo systemctl daemon-reload
sudo systemctl start fastapi
sudo systemctl enable fastapi

# Check service status
sudo systemctl status fastapi

# Verify the API is running
curl http://localhost:8000/api/v1/health
```

## Frontend Deployment

This section covers the setup and deployment of the Next.js frontend using PM2.

```bash
# Navigate to frontend directory
cd /opt/crm/rec_front

# Install Node.js dependencies
npm ci

# Create production environment file
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api/v1
NEXT_PUBLIC_USE_MOCK_DATA=false

# Environment
NODE_ENV=production

# Optional: OpenAI API for client-side fallback
# NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EOF

# Build for production
npm run build

# Install PM2 globally if not already installed
sudo npm install -g pm2

# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'crm-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/opt/crm/rec_front',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/opt/crm/logs/frontend-err.log',
    out_file: '/opt/crm/logs/frontend-out.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p /opt/crm/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Set PM2 to start on system boot
pm2 startup
# Follow the instructions printed by the command above

# Save the PM2 process list
pm2 save

# Check application status
pm2 status
pm2 logs crm-frontend
```

## Nginx Configuration

This section configures Nginx as a reverse proxy for both the frontend and backend.

```bash
# Create Nginx server configuration
sudo tee /etc/nginx/sites-available/crm.conf > /dev/null << 'EOF'
# HTTP Server - Redirects to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration - Will be added by Certbot
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # SSL parameters
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # Root directory for static files (optional)
    root /opt/crm/rec_front/public;
    
    # Frontend - Next.js Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Proxy timeouts
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
    
    # Backend API - FastAPI Application
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Proxy timeouts for API
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
}
EOF

# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/crm.conf /etc/nginx/sites-enabled/

# Remove default site if needed
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx if the test is successful
sudo systemctl reload nginx
```

## SSL Setup

This section configures SSL certificates using Let's Encrypt.

```bash
# Install Certbot and the Nginx plugin if not already installed
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificates
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Verify Nginx configuration after certificate installation
sudo nginx -t
sudo systemctl reload nginx
```

## Backup Configuration

This section sets up automated database backups.

```bash
# Create backup directory
sudo mkdir -p /opt/backups
sudo chown -R $USER:$USER /opt/backups

# Create backup script
cat > /opt/db-backup.sh << 'EOF'
#!/bin/bash

# Configuration
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/opt/backups"
POSTGRES_CONTAINER="postgres"
DB_NAME="recruitment_plus"
DB_USER="postgres"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Log start of backup
echo "Starting database backup at $(date)"

# Backup PostgreSQL database
echo "Creating database dump..."
docker exec $POSTGRES_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Database dump created successfully"
    
    # Compress backup
    echo "Compressing backup..."
    gzip $BACKUP_DIR/db_$DATE.sql
    
    # Delete old backups
    echo "Removing backups older than $RETENTION_DAYS days..."
    find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "Backup completed successfully at $(date)"
else
    echo "Error: Database backup failed" >&2
    exit 1
fi
EOF

# Make script executable
chmod +x /opt/db-backup.sh

# Test the backup script
/opt/db-backup.sh

# Setup daily cron job for backups at 1:00 AM
(crontab -l 2>/dev/null; echo "0 1 * * * /opt/db-backup.sh >> /opt/backups/backup.log 2>&1") | crontab -

# Verify cron job was created
crontab -l
```

## Monitoring Setup

This section sets up monitoring tools for the application.

```bash
# Setup PM2 monitoring and log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Install additional monitoring tools
sudo apt install -y htop iotop

# Create a simple health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash

# Configuration
API_URL="https://your-domain.com/api/v1/health"
FRONTEND_URL="https://your-domain.com"
LOG_FILE="/opt/crm/logs/health-check.log"

# Ensure log directory exists
mkdir -p /opt/crm/logs

# Log start of check
echo "Health check started at $(date)" >> $LOG_FILE

# Check API health
echo "Checking API..." >> $LOG_FILE
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ $API_STATUS -eq 200 ]; then
    echo "API is up and running (Status: $API_STATUS)" >> $LOG_FILE
else
    echo "ERROR: API is down (Status: $API_STATUS)" >> $LOG_FILE
    # You could add notification commands here (email, SMS, etc.)
fi

# Check Frontend
echo "Checking Frontend..." >> $LOG_FILE
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $FRONTEND_STATUS -eq 200 ]; then
    echo "Frontend is up and running (Status: $FRONTEND_STATUS)" >> $LOG_FILE
else
    echo "ERROR: Frontend is down (Status: $FRONTEND_STATUS)" >> $LOG_FILE
    # You could add notification commands here (email, SMS, etc.)
fi

# Check database connection via the API
# This assumes your API has an endpoint that checks DB connectivity
echo "Checking Database connectivity..." >> $LOG_FILE
DB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/db-health)
if [ $DB_STATUS -eq 200 ]; then
    echo "Database connection is working (Status: $DB_STATUS)" >> $LOG_FILE
else
    echo "WARNING: Database connection check failed (Status: $DB_STATUS)" >> $LOG_FILE
    # You could add notification commands here
fi

echo "Health check completed at $(date)" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE
EOF

# Make script executable
chmod +x /opt/health-check.sh

# Setup cron job to run health check every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/health-check.sh") | crontab -
```

## Maintenance Tasks

This section provides commands and scripts for common maintenance tasks.

### Updating the Application

```bash
# Update backend
cd /opt/crm
git pull origin main
cd rec_back
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart fastapi

# Update frontend
cd /opt/crm/rec_front
git pull origin main
npm ci
npm run build
pm2 restart crm-frontend
```

### Database Maintenance

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d recruitment_plus

# Backup database manually
docker exec postgres pg_dump -U postgres recruitment_plus > /opt/backups/manual_backup_$(date +%Y-%m-%d).sql

# Restore database from backup
# First, uncompress if needed
gunzip /opt/backups/db_file.sql.gz
# Then restore
cat /opt/backups/db_file.sql | docker exec -i postgres psql -U postgres recruitment_plus
```

### Log Management

```bash
# View backend logs
sudo journalctl -u fastapi

# View frontend logs
pm2 logs crm-frontend

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

This section provides solutions to common issues that might occur during deployment.

### Backend Issues

1. **Service fails to start**:
   ```bash
   # Check service status
   sudo systemctl status fastapi
   
   # Check logs for errors
   sudo journalctl -u fastapi -n 100 --no-pager
   
   # Common solutions:
   # - Verify database connection
   # - Check environment variables
   # - Ensure all dependencies are installed
   ```

2. **Database connection issues**:
   ```bash
   # Verify PostgreSQL container is running
   docker ps | grep postgres
   
   # Check PostgreSQL logs
   docker logs postgres
   
   # Test database connection
   docker exec -it postgres psql -U postgres -c "SELECT 1;"
   ```

### Frontend Issues

1. **PM2 app crashes**:
   ```bash
   # Check PM2 status
   pm2 status
   
   # View detailed logs
   pm2 logs crm-frontend
   
   # Common solutions:
   # - Check for proper Node.js version
   # - Verify all dependencies are installed
   # - Check .env.local configuration
   ```

2. **Build failures**:
   ```bash
   # Retry with clean install
   cd /opt/crm/rec_front
   rm -rf node_modules .next
   npm ci
   npm run build
   ```

### Nginx Issues

1. **Configuration errors**:
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   
   # Check Nginx error logs
   sudo cat /var/log/nginx/error.log
   ```

2. **SSL certificate issues**:
   ```bash
   # Verify certificates
   sudo certbot certificates
   
   # Renew certificates manually
   sudo certbot renew
   ```

---

This deployment guide covers all the necessary steps to deploy the RecrutementPlus CRM application on a VPS. For additional assistance or troubleshooting, please refer to the project documentation or contact the development team.