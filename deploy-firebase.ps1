# Firebase Deployment Script for ReviewTap (PowerShell)
# Run this locally after installing Firebase CLI: npm install -g firebase-tools

param(
    [switch]$SkipSecretCheck = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Firebase Deployment - ReviewTap" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI installation..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>$null
    Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Verify project configuration
Write-Host "Step 2: Verifying Firebase project configuration..." -ForegroundColor Yellow

$firebaseConfig = Get-Content ".firebaserc" | ConvertFrom-Json
$projectId = $firebaseConfig.projects.default

Write-Host "Using project: $projectId" -ForegroundColor Cyan

try {
    $projects = firebase projects:list 2>&1 | Out-String
    if ($projects -match $projectId) {
        Write-Host "✓ Project found: $projectId" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Project '$projectId' not found!" -ForegroundColor Red
        Write-Host "Available projects:" -ForegroundColor Yellow
        firebase projects:list
        exit 1
    }
}
catch {
    Write-Host "⚠ Could not verify project (may need login)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Pre-deployment checks
Write-Host "Step 3: Running pre-deployment checks..." -ForegroundColor Yellow
Write-Host "Checking build artifacts..."

if (Test-Path ".\.next") {
    Write-Host "✓ Build artifacts found (.next)" -ForegroundColor Green
}
else {
    Write-Host "⚠ Building Next.js app..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 4: Verify secrets
if (-not $SkipSecretCheck) {
    Write-Host "Step 4: Checking required environment secrets..." -ForegroundColor Yellow

    $requiredSecrets = @("NEXTAUTH_SECRET", "DATABASE_URL", "OPENAI_API_KEY", "GMAIL_USER", "GMAIL_APP_PASSWORD")
    $envContent = Get-Content ".env" -Raw

    Write-Host "The following secrets must be set in Firebase Console:" -ForegroundColor Cyan
    Write-Host ""

    foreach ($secret in $requiredSecrets) {
        if ($envContent -match $secret) {
            Write-Host "  ✓ $secret (found in .env)" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠ $secret (NOT found in .env)" -ForegroundColor Yellow
        }
    }
    Write-Host ""

    $response = Read-Host "Have you set all secrets in Firebase Console? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Please set secrets in Firebase Console first:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://console.firebase.google.com" -ForegroundColor Cyan
        Write-Host "2. Select project: $projectId" -ForegroundColor Cyan
        Write-Host "3. Navigate to: App Hosting → Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "4. Add each secret from your .env file" -ForegroundColor Cyan
        exit 1
    }
    Write-Host ""
}

# Step 5: Cloud SQL check
Write-Host "Step 5: Cloud SQL Configuration Check" -ForegroundColor Yellow
$appHostingConfig = Get-Content "firebase-apphosting.yaml" -Raw

if ($appHostingConfig -match "cloudSqlInstances") {
    Write-Host "✓ Cloud SQL instances configured" -ForegroundColor Green
}
else {
    Write-Host "⚠ Cloud SQL not configured in firebase-apphosting.yaml" -ForegroundColor Yellow
    Write-Host "If using Cloud SQL, update firebase-apphosting.yaml with your instance." -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Deploy
Write-Host "Step 6: Deploying to Firebase..." -ForegroundColor Yellow
Write-Host "This may take 5-15 minutes..." -ForegroundColor Cyan
Write-Host ""

firebase deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    Write-Host "  https://reviewtap.web.app" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify app is accessible" -ForegroundColor Cyan
    Write-Host "  2. Run database migrations if needed" -ForegroundColor Cyan
    Write-Host "  3. Configure custom domain (optional)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Monitor logs with:" -ForegroundColor Yellow
    Write-Host "  firebase functions:log" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check logs above for details." -ForegroundColor Yellow
    exit 1
}
