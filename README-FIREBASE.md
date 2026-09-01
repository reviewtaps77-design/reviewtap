# Firebase App Hosting deployment for ReviewTap

This project is configured for Firebase App Hosting, which is the correct deployment target for a Next.js app that uses:

- NextAuth credentials authentication
- Prisma + MySQL
- server-side routes and middleware
- database-backed admin and owner flows

## Prerequisites

1. Install the Firebase CLI:
   npm install -g firebase-tools
2. Sign in:
   firebase login
3. Create a Firebase project in the Firebase Console.
4. Connect the project to App Hosting.

## Required environment variables

Set these in Firebase App Hosting or local `.env` before build:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Local validation

npm install
npm run build

## Deploy

firebase deploy

## Notes

- Do not use plain static Firebase Hosting for this project.
- This app requires a server runtime and database.
- Use Cloud SQL MySQL for production database hosting.
