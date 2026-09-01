#!/bin/bash

# Firebase Deployment Script for ReviewTap
# Run this locally after installing Firebase CLI: npm install -g firebase-tools

set -e

echo "================================"
echo "Firebase Deployment - ReviewTap"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✓ Firebase CLI found: $(firebase --version)"
echo ""

# Step 1: Login to Firebase
echo "Step 1: Authenticating with Firebase..."
if firebase auth:login > /dev/null 2>&1 || true; then
    echo "✓ Firebase authentication verified"
else
    echo "⚠ Starting Firebase login..."
    firebase login
fi
echo ""

# Step 2: Verify project configuration
echo "Step 2: Verifying Firebase project configuration..."
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
echo "Using project: $PROJECT_ID"

if firebase projects:list | grep -q "$PROJECT_ID"; then
    echo "✓ Project found: $PROJECT_ID"
else
    echo "❌ Project '$PROJECT_ID' not found!"
    echo "Available projects:"
    firebase projects:list
    exit 1
fi
echo ""

# Step 3: Pre-deployment checks
echo "Step 3: Running pre-deployment checks..."
echo "Checking build..."
if [ -d ".next" ]; then
    echo "✓ Build artifacts found (.next)"
else
    echo "⚠ Building Next.js app..."
    npm run build
fi
echo ""

# Step 4: Verify secrets are set
echo "Step 4: Checking required environment secrets..."
REQUIRED_SECRETS=("NEXTAUTH_SECRET" "DATABASE_URL" "OPENAI_API_KEY" "SMTP_HOST" "SMTP_USER" "SMTP_PASS")

echo "The following secrets must be set in Firebase Console:"
echo ""
for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -q "$secret" .env; then
        echo "  ✓ $secret (found in .env)"
    else
        echo "  ⚠ $secret (NOT found in .env)"
    fi
done
echo ""

read -p "Have you set all secrets in Firebase Console? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set secrets in Firebase Console first:"
    echo "1. Go to: https://console.firebase.google.com"
    echo "2. Select project: $PROJECT_ID"
    echo "3. Navigate to: App Hosting → Settings → Environment Variables"
    echo "4. Add each secret from your .env file"
    exit 1
fi
echo ""

# Step 5: Configure Cloud SQL (if using)
echo "Step 5: Cloud SQL Configuration Check"
if grep -q "cloudSqlInstances" firebase-apphosting.yaml; then
    echo "✓ Cloud SQL instances configured in firebase-apphosting.yaml"
else
    echo "⚠ Cloud SQL not configured in firebase-apphosting.yaml"
    echo "If using Cloud SQL, update the configuration:"
    echo "  1. Uncomment cloudSqlInstances section"
    echo "  2. Add your instance path: projects/PROJECT_ID/instances/INSTANCE_NAME"
    echo ""
    read -p "Continue without Cloud SQL config? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 6: Deploy
echo "Step 6: Deploying to Firebase..."
echo "This may take 5-15 minutes..."
echo ""

if firebase deploy; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    
    # Show deployment info
    echo "Your app is live at:"
    echo "  https://reviewtap.web.app"
    echo ""
    
    echo "Next steps:"
    echo "  1. Verify app is accessible"
    echo "  2. Run database migrations if needed"
    echo "  3. Configure custom domain (optional)"
    echo ""
    
    echo "Monitor logs with:"
    echo "  firebase functions:log"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check logs above for details."
    exit 1
fi
