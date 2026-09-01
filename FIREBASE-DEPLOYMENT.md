# Firebase Deployment Guide for ReviewTap

Your app is now **production-ready** and fully compiled. Follow these steps to deploy to Firebase App Hosting.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Google Account with Firebase project access
- Backend database (Cloud SQL) set up
- All production secrets configured

## Step 1: Authenticate with Firebase

```bash
firebase login
```

This will open your browser to authenticate. Sign in with your Google account.

## Step 2: Verify Firebase Project Configuration

```bash
firebase projects:list
```

Confirm that `reviewtap-prod` is listed. If not, update `.firebaserc`:

```json
{
  "projects": {
    "default": "reviewtap-prod"
  }
}
```

## Step 3: Set Up Production Secrets in Firebase

Before deploying, configure these secrets in Firebase Console or via CLI:

```bash
# Set secrets using Firebase CLI
firebase functions:config:set \
  nextauth.secret="YOUR_NEXTAUTH_SECRET" \
  database.url="YOUR_CLOUD_SQL_CONNECTION_STRING" \
  openai.api_key="YOUR_OPENAI_API_KEY" \
  smtp.host="smtp.hostinger.com" \
  smtp.port="465" \
  smtp.user="noreply@reviewtap.in" \
  smtp.pass="YOUR_SMTP_PASSWORD" \
  smtp.from="ReviewTap <noreply@reviewtap.in>"
```

**Or via Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project `reviewtap-prod`
3. Navigate to App Hosting → Settings → Environment Variables
4. Add each secret from your `.env` file

## Step 4: Configure Cloud SQL (Database)

Firebase App Hosting requires Cloud SQL for database connectivity.

### Option A: Use existing Cloud SQL instance

Update your `firebase-apphosting.yaml`:

```yaml
backend:
  cloudSqlInstances:
    - projects/YOUR_PROJECT_ID/instances/YOUR_INSTANCE_NAME
```

### Option B: Create new Cloud SQL instance

```bash
gcloud sql instances create reviewtap-db \
  --database-version=MYSQL_8_0 \
  --region=us-central1 \
  --tier=db-f1-micro
```

Then add connection string to secrets.

## Step 5: Deploy to Firebase App Hosting

```bash
firebase deploy
```

This will:
- Build your Next.js app
- Deploy backend to Cloud Run
- Configure networking
- Set up SSL certificates
- Initialize database with Prisma migrations

**Deployment time:** 5-15 minutes

## Step 6: Run Database Migrations

After deployment completes, run Prisma migrations on Cloud SQL:

```bash
# Connect to your deployed app's database and run:
npx prisma db push --skip-generate
```

Or set up a migration job in Cloud Run.

## Step 7: Verify Deployment

```bash
# Check deployment status
firebase hosting:channel:list

# View live URL
firebase hosting:sites
```

Access your app at: `https://reviewtap.web.app`

## Post-Deployment Configuration

### 1. Update Environment Variables

If your deployment URL differs, update these in Firebase Console:

```
NEXTAUTH_URL=https://reviewtap.web.app
NEXT_PUBLIC_APP_URL=https://reviewtap.web.app
```

### 2. Configure Custom Domain

In Firebase Console → Hosting → Domain:
1. Add custom domain: `reviewtap.in`
2. Update DNS records as instructed
3. Wait for SSL certificate provisioning (5-48 hours)

### 3. Enable Firewall Rules (Optional)

For production security, consider:
- Enable Cloud Armor
- Configure VPC Service Controls
- Set up Cloud Load Balancer access restrictions

## Troubleshooting

### Issue: "Error: Command requires authentication"
**Solution:** Run `firebase login` first

### Issue: "Project not found"
**Solution:** Verify `.firebaserc` has correct project ID

### Issue: "Database connection timeout"
**Solution:** 
- Verify Cloud SQL instance is running
- Check firewall allows Cloud Run to access Cloud SQL
- Update connection string in secrets

### Issue: "Secrets not found during deployment"
**Solution:** Ensure all secrets are set in Firebase Console before deploying

## Rollback to Previous Version

```bash
firebase hosting:channel:list
firebase hosting:clone <channel-id> production
```

## Monitor Production Logs

```bash
# View real-time logs
firebase functions:log

# Or via Firebase Console → Logs
```

## Performance Optimization

The app is optimized with:
- ✅ Next.js 15.3.0 (latest optimizations)
- ✅ Image optimization
- ✅ Route prefetching
- ✅ Code splitting
- ✅ Middleware for security headers
- ✅ Session caching with NextAuth

## Security Checklist

Before going live:
- [ ] NEXTAUTH_SECRET is strong (32+ characters, random)
- [ ] All SMTP credentials are valid
- [ ] OpenAI API key has spending limits
- [ ] Database backups enabled
- [ ] Cloud SQL has automated backups (daily)
- [ ] Firewall rules restrict access appropriately
- [ ] SSL/TLS enforced
- [ ] CORS headers properly configured

## Support

For Firebase issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)

---

**Ready to deploy?** Run `firebase deploy` now!
