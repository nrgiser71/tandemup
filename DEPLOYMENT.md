# TandemUp Deployment Guide 🚀

## ✅ Current Status
- ✅ **GitHub Repository**: https://github.com/nrgiser71/tandemup
- ✅ **Supabase Database**: Configured with all tables and RLS policies
- ✅ **Complete Codebase**: All MVP features implemented
- ✅ **Environment Variables**: Configured locally

## 🚀 Quick Deployment to Vercel

### 1. Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Select the `nrgiser71/tandemup` repository
5. Click "Deploy"

### 2. Configure Environment Variables
Add these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://cegijyvdulueyrbkrhrm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZ2lqeXZkdWx1ZXlyYmtyaHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzI2NTAsImV4cCI6MjA3MjMwODY1MH0.A5_HEtkdzJR5L49zyNBiGrbXrSOOfU6hikPOKlIBt2I
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard]

# Stripe (Get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# Mailgun (Get from Mailgun Dashboard)
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=tandemup.work

# App Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
ADMIN_EMAIL=admin@tandemup.work
CRON_SECRET=[Generate random string]
```

### 3. Setup Missing API Keys

#### Stripe Setup
1. Go to [stripe.com](https://stripe.com) → Dashboard
2. Get your API keys (Test mode first)
3. Create 2 products: Monthly (€9.99) and Yearly (€79.99)
4. Copy the Price IDs
5. Setup webhook endpoint: `your-domain.vercel.app/api/payments/webhooks`

#### Mailgun Setup
1. Go to [mailgun.com](https://mailgun.com)
2. Add your domain `tandemup.work`
3. Get API key and configure DNS
4. Verify domain

#### Supabase Service Role Key
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (keep secret!)

## 🎯 Post-Deployment Checklist

### Immediate Testing
- [ ] Landing page loads correctly
- [ ] User registration works
- [ ] Email verification (if Mailgun configured)
- [ ] Session booking interface
- [ ] Video session with Jitsi works
- [ ] Admin dashboard accessible

### Production Setup
- [ ] Configure custom domain `tandemup.work`
- [ ] Setup SSL certificates
- [ ] Configure Stripe live mode
- [ ] Setup real email domain
- [ ] Test all cron jobs
- [ ] Monitor error logs

## 🛠 Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript errors in Vercel logs
2. **Database Connection**: Verify Supabase URL and keys
3. **Authentication Issues**: Check Supabase Auth settings
4. **Payment Errors**: Verify Stripe webhook configuration

### Debug Commands
```bash
# Check deployment logs
vercel logs your-deployment-url

# Test API endpoints
curl https://your-domain.vercel.app/api/health

# Check database connection
# Use Supabase SQL editor to test queries
```

## 🔄 Automated Deployments
- **Automatic**: Every push to `main` branch triggers deployment
- **Preview**: Every pull request gets a preview deployment
- **Rollback**: Use Vercel dashboard to rollback if needed

## 📊 Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database monitoring and logs
- **Stripe Dashboard**: Payment monitoring

---

**The TandemUp MVP is fully implemented and ready for production! 🎉**

Repository: https://github.com/nrgiser71/tandemup