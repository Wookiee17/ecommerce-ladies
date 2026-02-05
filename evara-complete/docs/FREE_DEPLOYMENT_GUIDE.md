# Free Deployment Guide for Evara

Deploy your e-commerce platform for FREE using these services.

---

## Option 1: Vercel + Railway (Recommended - Completely Free)

### Frontend (Vercel) - FREE
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd app
vercel --prod
```
**Limits**: Unlimited bandwidth, 100GB bandwidth/month

### Backend (Railway) - FREE
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and deploy
cd backend
railway login
railway init
railway up
```
**Limits**: 500 hours/month, 1GB RAM, 1GB storage

### Database (MongoDB Atlas) - FREE
- Sign up at mongodb.com
- Create free M0 cluster (512MB storage)
- Get connection string

---

## Option 2: Render (All-in-One Free)

### Deploy Everything on Render
```bash
# 1. Connect GitHub repo to Render
# 2. Create Web Service for backend
# 3. Create Static Site for frontend
# 4. Create PostgreSQL or MongoDB
```
**Free Tier**:
- Web Services: 750 hours/month
- Static Sites: Unlimited
- PostgreSQL: 1GB
- Custom domains: Yes

---

## Option 3: Netlify + Heroku

### Frontend (Netlify) - FREE
```bash
# Drag and drop your build folder
# Or connect GitHub for auto-deploy
```

### Backend (Heroku) - FREE (with card)
```bash
# 1. Install Heroku CLI
# 2. Deploy
git push heroku main
```

---

## Option 4: Firebase (Google)

### Hosting (FREE)
```bash
npm i -g firebase-tools
firebase init hosting
firebase deploy
```

### Cloud Functions (FREE)
- 2M invocations/month
- 400K GB-seconds/month

### Firestore (FREE)
- 1GB storage
- 50K reads/day
- 20K writes/day

---

## Comparison Table

| Service | Frontend | Backend | Database | Cost |
|---------|----------|---------|----------|------|
| Vercel + Railway | ✅ Free | ✅ Free | ❌ Separate | $0 |
| Render | ✅ Free | ✅ Free | ✅ Free | $0 |
| Netlify + Heroku | ✅ Free | ⚠️ Sleep | ❌ Separate | $0 |
| Firebase | ✅ Free | ✅ Free | ✅ Free | $0 |
| AWS | ❌ Paid | ❌ Paid | ❌ Paid | ~$150/mo |

---

## Recommended: Vercel + Railway Setup

### Step 1: Deploy Frontend to Vercel
```bash
cd app
npm run build
vercel --prod
```

### Step 2: Deploy Backend to Railway
```bash
cd backend
railway login
railway init
# Add environment variables in Railway dashboard
railway up
```

### Step 3: Connect Frontend to Backend
Update `app/.env`:
```
VITE_API_URL=https://your-backend.railway.app/api
```

### Step 4: Deploy Updated Frontend
```bash
vercel --prod
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

### Backend (Railway Dashboard)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Custom Domain (Free)

### Get Free Domain
1. Go to freenom.com
2. Register .tk, .ml, .ga, .cf, .gq domain
3. Add to Vercel/Railway

### Or Use Subdomain
- yourname.vercel.app (auto)
- yourname.railway.app (auto)

---

## Monitoring (Free)

### Uptime Monitoring
- UptimeRobot (free tier)
- Better Uptime (free tier)

### Analytics
- Google Analytics (free)
- Plausible (self-hosted free)

---

## SSL Certificate (Free)
All services provide free SSL automatically!

---

## Total Cost: $0/month

With this setup, you can run a full e-commerce platform completely free!
