#!/bin/bash

echo "🚀 Deploying Sydney Events to Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "Step 1: Login to Vercel"
vercel login

echo ""
echo "Step 2: Deploy to Vercel"
vercel

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Add Vercel Postgres database in dashboard"
echo "2. Pull environment variables: vercel env pull .env.local"
echo "3. Run database migration: npx prisma db push"
echo "4. Deploy to production: vercel --prod"
echo "5. Populate events: curl 'https://your-app.vercel.app/api/scrape?secret=my-secret-key-123'"
echo ""
echo "See DEPLOYMENT.md for full guide!"
