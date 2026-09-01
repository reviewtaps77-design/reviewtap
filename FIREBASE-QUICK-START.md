# Firebase Deployment - Quick Start Guide

Your ReviewTap app is fully built and ready for Firebase deployment! ✅

## What's Prepared

✅ **Next.js App**: Production build complete (15.3.0)  
✅ **Security**: Input sanitization, OWASP protections, rate limiting  
✅ **Multi-tenant**: Business owner and admin portals  
✅ **Database**: Prisma ORM ready for Cloud SQL  
✅ **Email**: SMTP configuration for Hostinger  
✅ **Firebase Config**: App Hosting YAML and authentication setup  

## Deployment Options

### Option 1: Quick Deploy (Recommended)

**On Windows (PowerShell):**
```powershell
./deploy-firebase.ps1
```

**On Mac/Linux (Bash):**
```bash
chmod +x deploy-firebase.sh
./deploy-firebase.sh
```

### Option 2: Manual Deploy

```bash
# 1. Login to Firebase
firebase login

# 2. Set up secrets in Firebase Console (5 minutes)
#    See FIREBASE-DEPLOYMENT.md for details

# 3. Deploy
firebase deploy
```

## Critical Setup Steps (Before Deployment)

### 1. **Firebase Project Setup** (5 min)

```bash
# Verify project is set
firebase projects:list

# Should show: reviewtap-prod
```

### 2. **Set Environment Secrets** (5 min)

Go to [Firebase Console](https://console.firebase.google.com):
1. Select project: **reviewtap-prod**
2. Navigate to: **App Hosting** → **Settings** → **Environment Variables**
3. Click **Add Secret** for each:

| Secret | Value | Source |
|--------|-------|--------|
| `NEXTAUTH_SECRET` | Generate new random 32-char string | `openssl rand -base64 32` |
| `DATABASE_URL` | Cloud SQL connection string | Setup Cloud SQL first |
| `OPENAI_API_KEY` | Your OpenAI API key | From `.env` |
| `SMTP_HOST` | `smtp.hostinger.com` | From `.env` |
| `SMTP_PORT` | `465` | From `.env` |
| `SMTP_USER` | `noreply@reviewtap.in` | From `.env` |
| `SMTP_PASS` | Your SMTP password | From `.env` |
| `SMTP_FROM` | `ReviewTap <noreply@reviewtap.in>` | From `.env` |

### 3. **Set Up Cloud SQL Database** (10-20 min)

**Via Google Cloud Console:**

```bash
# Create Cloud SQL instance
gcloud sql instances create reviewtap-db \
  --database-version=MYSQL_8_0 \
  --region=us-central1 \
  --tier=db-f1-micro \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create reviewtap \
  --instance=reviewtap-db

# Create user
gcloud sql users create reviewtap_user \
  --instance=reviewtap-db \
  --password=YOUR_SECURE_PASSWORD

# Get connection string for DATABASE_URL secret
gcloud sql instances describe reviewtap-db --format='value(connectionName)'
```

**Connection String Format:**
```
mysql://reviewtap_user:PASSWORD@INSTANCE_CONNECTION_NAME/reviewtap
```

Then update `firebase-apphosting.yaml`:
```yaml
backend:
  cloudSqlInstances:
    - projects/YOUR_PROJECT_ID/instances/reviewtap-db
```

### 4. **Verify Secrets Are Set** (2 min)

```bash
# List all secrets in Firebase
firebase apphosting:secrets:list
```

Should show all 8 secrets with status ✓

## Run Deployment

```bash
# Windows PowerShell
./deploy-firebase.ps1

# macOS/Linux
./deploy-firebase.sh

# Or manual
firebase deploy
```

**Deployment Progress:**
- 🔨 Building app... (1-2 min)
- 🚀 Uploading to Cloud Run... (2-3 min)
- 🔗 Configuring networking... (1-2 min)
- 🔐 Setting up SSL certificate... (1-2 min)
- ✅ Deployment complete! (5-15 min total)

## Post-Deployment Steps

### 1. Verify App Is Live

```bash
# Open in browser
https://reviewtap.web.app

# Or get URL from Firebase
firebase hosting:sites
```

### 2. Run Database Migrations

```bash
# Connect to your Cloud SQL and initialize
npx prisma db push --skip-generate

# Or seed demo data
npx prisma db seed
```

### 3. Test Login

Use the credentials stored in your secure Cloud SQL and Firebase environment variables. Do not keep real admin credentials in source files, docs, or public UI.

### 4. Configure Custom Domain (Optional)

In [Firebase Console](https://console.firebase.google.com):
1. Hosting → Custom Domains
2. Add: `reviewtap.in`
3. Update DNS records per Firebase instructions
4. SSL certificate auto-provisions (5-48 hours)

## Troubleshooting

### ❌ "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase --version
```

### ❌ "Authentication required"
```bash
firebase logout
firebase login
```

### ❌ "Project not found"
Check `.firebaserc` contains: `"default": "reviewtap-prod"`

### ❌ "Database connection timeout"
- Verify Cloud SQL instance is running
- Check firewall allows Cloud Run → Cloud SQL
- Confirm DATABASE_URL secret is correct

### ❌ "Secrets not found"
Ensure all secrets are set in Firebase Console BEFORE deploying.

### ❌ "SMTP emails not sending"
- Verify SMTP credentials are correct
- Check SMTP_PORT is 465 (TLS)
- Verify sender email is authenticated

### ❌ "Build failed"
```bash
# Rebuild locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Then retry deployment
firebase deploy
```

## Monitor Production

### View Logs
```bash
firebase functions:log
```

### View Metrics
Firebase Console → App Hosting → Insights

### Set Up Alerts
Firebase Console → Monitoring → Alerting

## Rollback Deployment

If something goes wrong:

```bash
# List available versions
firebase hosting:channel:list

# Restore previous version
firebase hosting:clone [channel-id] production
```

## Cost Estimation

**Monthly costs (approx):**
- Cloud Run: $5-15 (auto-scaling)
- Cloud SQL (db-f1-micro): $10
- Storage & Bandwidth: $5-10
- **Total: $20-35/month**

Eligible for [Firebase free tier](https://firebase.google.com/pricing) ($0 first month).

## Next: Production Hardening

After deployment, enable:
- 🔐 Cloud Armor (DDoS protection)
- 📊 Cloud Monitoring & Logging
- 🔔 Uptime alerts
- 🔄 Automated backups
- 📈 Performance monitoring

See [Security Checklist](FIREBASE-DEPLOYMENT.md#security-checklist) for details.

---

**Ready?** Run the deployment script now! 🚀

```bash
# PowerShell (Windows)
./deploy-firebase.ps1

# Bash (Mac/Linux)
./deploy-firebase.sh
```

Questions? See [FIREBASE-DEPLOYMENT.md](FIREBASE-DEPLOYMENT.md) for detailed guide.
