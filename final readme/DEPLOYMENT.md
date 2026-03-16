# 🚀 Deployment Guide

Complete guide for deploying the Classroom Backend API to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
  - [Vercel](#vercel)
  - [Railway](#railway)
  - [Render](#render)
  - [Fly.io](#flyio)
  - [Manual VPS](#manual-vps)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Deployment

The system is optimized for serverless and edge deployment.

![Deployment Architecture](https://github.com/yahyass22/classroom-Backend/blob/d7b3c795d2d2fbc7fa630023cafac2ecf33a5407/final%20readme/Diagrams%20PNG/Deployment%20Architecture%20mermaid.png)



## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 20+ installed locally
- ✅ PostgreSQL database (Neon recommended)
- ✅ Git repository initialized
- ✅ Domain name (optional, for production)
- ✅ SSL certificate (usually provided by hosting platform)

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file or configure in your hosting platform:

```bash
# ======================
# REQUIRED VARIABLES
# ======================

# Database Connection
DATABASE_URL=postgresql://user:password@host.database.neon.tech/dbname?sslmode=require

# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Arcjet Security
ARCJET_KEY=aj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ARCJET_ENV=LIVE

# ======================
# OPTIONAL VARIABLES
# ======================

# Application
NODE_ENV=production
PORT=8000

# Debugging (disable in production)
DEBUG_AUTH=false

# APM (Application Performance Monitoring)
# Apminsight is configured in index.ts
```

### Security Best Practices

```bash
# ✅ DO: Use strong, random secrets
BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# ✅ DO: Use environment-specific URLs
BETTER_AUTH_URL=https://api.classroom.example.com
FRONTEND_URL=https://classroom.example.com

# ✅ DO: Set ARCJET_ENV to LIVE for production
ARCJET_ENV=LIVE

# ❌ DON'T: Use localhost in production
BETTER_AUTH_URL=http://localhost:8000  # WRONG

# ❌ DON'T: Use DRY_RUN in production
ARCJET_ENV=development  # WRONG

# ❌ DON'T: Commit .env to git
# Add .env to .gitignore
```

### Generate Secure Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### Using Neon (Recommended)

1. **Create Neon Project**
   - Go to https://console.neon.tech
   - Click "New Project"
   - Enter project name: `classroom-production`

2. **Get Connection String**
   - Go to Project Settings → Connection Details
   - Copy the connection string
   - Format: `postgresql://user:password@host.database.neon.tech/dbname?sslmode=require`

3. **Run Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Verify Tables**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

5. **Seed Production Data** (Optional)
   ```bash
   npm run db:seed:full
   ```

### Database Connection Pooling

Neon handles connection pooling automatically. No additional configuration needed.

---

## Deployment Options

### Vercel

Vercel supports serverless functions for Express apps.

#### 1. Prepare for Vercel

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2. Modify Entry Point

Update `src/index.ts` for Vercel compatibility:

```typescript
import express from "express";
// ... your existing imports

const app = express();

// ... your existing middleware and routes

// Export for Vercel
export default app;
```

#### 3. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 4. Configure Environment Variables

```bash
# In Vercel Dashboard:
# Project Settings → Environment Variables
# Add all required variables
```

#### Vercel Considerations

| Aspect | Details |
|--------|---------|
| **Cold Starts** | ~500ms for serverless functions |
| **Timeout** | 10s (Hobby), 60s (Pro) |
| **Memory** | 1024MB default |
| **Sessions** | Stored in DB (works with serverless) |
| **Rate Limiting** | Arcjet works in serverless |

---

### Railway

Railway provides full Node.js hosting.

#### 1. Prepare for Railway

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### 2. Build & Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### 3. Configure Environment

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."
railway variables set BETTER_AUTH_SECRET="..."
railway variables set BETTER_AUTH_URL="https://your-project.railway.app"
railway variables set FRONTEND_URL="https://your-frontend.com"
railway variables set ARCJET_KEY="aj_..."
railway variables set ARCJET_ENV=LIVE
```

#### Railway Considerations

| Aspect | Details |
|--------|---------|
| **Cold Starts** | None (always-on) |
| **Timeout** | No limit |
| **Memory** | 512MB - 8GB (configurable) |
| **Sessions** | DB-stored (works perfectly) |
| **Scaling** | Auto-scales with traffic |

---

### Render

Render provides web services for Node.js.

#### 1. Prepare for Render

Create `render.yaml`:

```yaml
services:
  - type: web
    name: classroom-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        sync: false
      - key: BETTER_AUTH_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: ARCJET_KEY
        sync: false
      - key: ARCJET_ENV
        value: LIVE
```

#### 2. Deploy

```bash
# Install Render CLI
npm i -g @render-cloud/cli

# Login
render login

# Deploy
render up
```

#### 3. Or Use Dashboard

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment Variables:** Add all required
5. Click "Create Web Service"

#### Render Considerations

| Aspect | Details |
|--------|---------|
| **Cold Starts** | ~30s (free tier), none (paid) |
| **Timeout** | No limit |
| **Memory** | 512MB (starter) |
| **Sessions** | DB-stored |
| **Auto-Deploy** | Git push triggers deploy |

---

### Fly.io

Fly.io provides global edge deployment.

#### 1. Prepare for Fly.io

Create `fly.toml`:

```toml
app = "classroom-backend"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"
  NODE_ENV = "production"
  ARCJET_ENV = "LIVE"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

#### 2. Deploy

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (creates fly.toml)
fly launch --no-deploy

# Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set BETTER_AUTH_SECRET="..."
fly secrets set BETTER_AUTH_URL="https://classroom-backend.fly.dev"
fly secrets set FRONTEND_URL="https://your-frontend.com"
fly secrets set ARCJET_KEY="aj_..."

# Deploy
fly deploy
```

#### Fly.io Considerations

| Aspect | Details |
|--------|---------|
| **Cold Starts** | None (machines stay running) |
| **Timeout** | No limit |
| **Memory** | 256MB - 8GB |
| **Sessions** | DB-stored |
| **Global** | Deploy to multiple regions |

---

### Manual VPS

Deploy to any VPS (DigitalOcean, Linode, AWS EC2, etc.).

#### 1. Server Setup

```bash
# SSH into server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-username/classroom-backend.git
cd classroom-backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
nano .env
# Add all environment variables
```

#### 3. Configure PM2

```bash
# Start with PM2
pm2 start dist/index.js --name classroom-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Run the command it outputs
```

#### 4. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/classroom-backend
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/classroom-backend /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 5. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'
sudo ufw enable
```

#### Manual VPS Considerations

| Aspect | Details |
|--------|---------|
| **Cold Starts** | None |
| **Timeout** | No limit |
| **Memory** | Depends on VPS plan |
| **Sessions** | DB-stored |
| **Maintenance** | You manage everything |

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Test health endpoint
curl https://your-api-domain.com/

# Expected: "Welcome to the Classroom API!"
```

### 2. Test Authentication

```bash
# Test sign-up
curl -X POST https://your-api-domain.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }' \
  -c cookies.txt

# Check session
curl https://your-api-domain.com/api/auth/session \
  -b cookies.txt
```

### 3. Run Database Migrations

```bash
# If not already done
npm run db:generate
npm run db:migrate
```

### 4. Seed Initial Data

```bash
# For demo/testing
npm run db:seed:full
```

### 5. Configure CORS

Ensure `FRONTEND_URL` is set correctly in environment variables.

### 6. Update Frontend

Update your frontend's API URL to point to production:

```typescript
// frontend/.env
VITE_API_URL=https://your-api-domain.com
```

---

## Monitoring

### Application Performance

#### Apminsight

Already configured in `src/index.ts`:

```typescript
import AgentAPI from "apminsight";
AgentAPI.config()
```

View metrics at https://apminsight.com

#### Health Check Endpoint

```bash
# Simple health check
curl https://your-api-domain.com/

# Expected: "Welcome to the Classroom API!"
```

### Database Monitoring

#### Neon Dashboard

1. Go to https://console.neon.tech
2. Select your project
3. View:
   - Connection count
   - Query performance
   - Storage usage

### Error Tracking

#### Console Logs

All platforms provide log access:

- **Vercel:** `vercel logs`
- **Railway:** `railway logs`
- **Render:** Dashboard → Logs
- **Fly.io:** `fly logs`
- **VPS:** `pm2 logs classroom-backend`

#### Debug Endpoints (Development Only)

```bash
# Only available when NODE_ENV=development
curl https://your-api-domain.com/api/debug-session
curl https://your-api-domain.com/api/debug-auth
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error:** `DATABASE_URL is not defined` or connection timeout

**Solution:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Check SSL mode (Neon requires sslmode=require)
# postgresql://user:pass@host/db?sslmode=require

# Test connection locally
psql "$DATABASE_URL"
```

#### 2. Authentication Not Working

**Error:** `Unauthorized` on protected endpoints

**Solution:**
```bash
# Verify BETTER_AUTH_URL matches your domain
echo $BETTER_AUTH_URL

# Check BETTER_AUTH_SECRET is set
echo $BETTER_AUTH_SECRET

# Ensure FRONTEND_URL is correct
echo $FRONTEND_URL

# Check cookie is being set (in browser DevTools)
# Application → Cookies → better-auth.session_token
```

#### 3. CORS Errors

**Error:** `Access-Control-Allow-Origin` header missing

**Solution:**
```bash
# Verify FRONTEND_URL is set correctly
echo $FRONTEND_URL

# Ensure no trailing slash
# ✅ https://frontend.example.com
# ❌ https://frontend.example.com/

# Check browser console for CORS errors
```

#### 4. Rate Limiting Too Aggressive

**Error:** `429 Too Many Requests`

**Solution:**
```bash
# For development/testing, set DRY_RUN mode
ARCJET_ENV=development

# For production, verify user roles are being detected
# Check auth middleware logs
```

#### 5. Cold Starts (Serverless)

**Issue:** Slow first request after inactivity

**Solution:**
- Use platforms with always-on (Railway, Render paid, Fly.io)
- Implement keep-alive pings
- Accept cold start latency (Vercel)

#### 6. Memory Issues

**Error:** Out of memory or OOMKilled

**Solution:**
```bash
# Increase memory allocation
# Railway: railway variables set RAILWAY_MEMORY=1024
# Fly.io: Edit fly.toml, increase memory_mb

# Optimize LRU cache size (src/middleware/auth.ts)
const CACHE_MAX_SIZE = 500; // Reduce from 1000
```

### Debug Checklist

```bash
# 1. Check environment variables
printenv | grep -E 'DATABASE_URL|BETTER_AUTH|ARCJET|FRONTEND'

# 2. Check server logs
# Vercel: vercel logs
# Railway: railway logs
# Render: Dashboard → Logs
# Fly.io: fly logs
# VPS: pm2 logs classroom-backend

# 3. Test database connection
psql "$DATABASE_URL" -c "SELECT 1"

# 4. Check health endpoint
curl https://your-api-domain.com/

# 5. Test authentication
curl -X POST https://your-api-domain.com/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt -v

# 6. Check session
curl https://your-api-domain.com/api/auth/session -b cookies.txt
```

---

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] `ARCJET_ENV=LIVE` (not development)
- [ ] `NODE_ENV=production`
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] CORS configured for production domain
- [ ] Strong `BETTER_AUTH_SECRET` (32+ chars)
- [ ] `BETTER_AUTH_URL` matches production domain
- [ ] `FRONTEND_URL` matches frontend domain
- [ ] Database backups configured
- [ ] Monitoring setup (APM, logs)
- [ ] Error tracking configured
- [ ] Rate limiting tested
- [ ] Authentication flow tested
- [ ] All endpoints tested
- [ ] Frontend connected and tested
- [ ] `.env` file not committed to git
- [ ] Dependencies updated (`npm audit`)

---

## Cost Estimates

### Minimal Production Setup

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Neon** | Free | $0 |
| **Railway** | Starter | $5 |
| **Arcjet** | Free | $0 |
| **Total** | | **~$5/month** |

### Recommended Production Setup

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Neon** | Pro | $19 |
| **Railway** | Plus | $20 |
| **Arcjet** | Pro | $25 |
| **Total** | | **~$64/month** |

### Enterprise Setup

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Neon** | Enterprise | Custom |
| **Fly.io** | Multiple regions | $40+ |
| **Arcjet** | Enterprise | Custom |
| **Total** | | **~$100+/month** |

---

**Last Updated:** March 2026  
**Version:** 1.0.0
