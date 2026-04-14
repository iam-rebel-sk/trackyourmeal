# 🍽️ Track Your Meal - Expense Sharing App

A modern, real-time meal expense tracker with payment history and archiving. Split meal costs fairly among roommates or groups with automatic payment tracking and beautiful analytics.

## ✨ Features

### 📊 Dashboard
- **Add Members** - Manage who's eating (add/remove members)
- **Track Meals** - Log lunch & dinner with automatic pricing
- **Payment Status** - Real-time overview of who paid what
- **Smart Calculations** - Auto-calculates remaining amounts per person

### 💳 Payment Management
- **Record Payments** - Track who paid and how much
- **Member Breakdown** - See contribution from each member
- **Payment History** - Complete payment timeline
- **Cumulative Totals** - Running total of all payments

### 📅 Archives & History
- **Archive Batches** - Mark periods as complete ("Mark as Paid")
- **Detailed Snapshots** - Full member and meal data preserved
- **Payment History** - See what was paid before archiving
- **Member Summary** - Track paid vs remaining amounts per member
- **Fresh Periods** - Each archive starts a new clean period

### 📱 Responsive Design
- Works on mobile, tablet, and desktop
- Bottom navigation for easy access
- Beautiful dark theme with emerald accents

### ⚡ Performance
- **Skeleton Loading** - Smooth loading placeholders on all pages
- **Real-time Updates** - Instant data sync with Supabase
- **Optimized Queries** - Efficient database operations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account (free)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/iam-rebel-sk/trackyourmeal.git
cd trackyourmeal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project → Settings → API

4. **Start development server**
```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 📦 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API

---

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm run supabase:push # Push migrations to Supabase
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AddMealDrawer.tsx
│   ├── BottomNav.tsx
│   ├── ErrorBoundary.tsx
│   ├── PaymentDrawer.tsx
│   └── Toast.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── lib/                 # Utilities & config
│   └── supabase.ts
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── History.tsx
│   ├── Landing.tsx
│   ├── MemberSetup.tsx
│   ├── Settings.tsx
│   ├── SignIn.tsx
│   └── SignUp.tsx
├── App.tsx
└── main.tsx
```

---

## 🗄️ Database Schema

### Members
- Store member names and user associations
- Link meals to members

### Meals
- Track individual meal entries
- Store meal type (lunch/dinner) and price
- Mark meals as archived

### Payments
- Record payment transactions
- Store payment breakdown by member
- Track payment dates and amounts

### Archives
- Store snapshots of meal batches
- Preserve member stats at time of archiving
- Keep meal details for historical reference

---

## 🔐 Authentication

Uses Supabase Authentication:
- Email/Password signup and login
- Secure session management
- Protected routes and data access

---

## 🐛 Bug Fixes & Recent Updates

### Skeleton Loading Effect (Apr 14, 2026)
- ✅ Added smooth skeleton loading across all pages
- ✅ Dashboard, History, Settings, and AddMealDrawer components
- ✅ 300ms smooth transition from skeleton to actual content
- ✅ Improved perceived performance and UX

### Archive Details White Screen Fix (Apr 6, 2026)
- ✅ Fixed null/undefined errors when expanding archive details
- ✅ Added Error Boundary component for graceful error handling
- ✅ Safe data access with proper fallbacks

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

#### Prerequisites
- GitHub account with your repository pushed
- Supabase project with database configured
- Supabase credentials ready

#### Step-by-Step Deployment

1. **Get Your Supabase Credentials**
   - Go to [supabase.com](https://supabase.com) and login
   - Open your project
   - Click Settings → API (left sidebar)
   - Copy your **Project URL** and **Anon (Public) Key**

2. **Verify Build Works Locally**
   ```bash
   npm run build
   npm run preview
   ```

3. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

4. **Configure Environment Variables**
   - In the "Environment Variables" section, add:
     - **Name**: `VITE_SUPABASE_URL` → **Value**: `[Your Supabase URL]`
     - **Name**: `VITE_SUPABASE_ANON_KEY` → **Value**: `[Your Supabase Key]`
   - Click "Deploy"

5. **Wait for Deployment**
   - Vercel will build and deploy automatically (2-3 minutes)
   - You'll get a live URL like `https://yourproject.vercel.app`

#### Using Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables when prompted
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### Custom Domain Setup
1. In Vercel Dashboard, go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

#### Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run build` locally to see error details |
| Login not working | Check environment variables in Vercel (Settings → Environment Variables) |
| Page loads blank | Check browser console for errors (F12 → Console tab) |
| Real-time data not syncing | Verify Supabase RLS policies are configured |

**After Deployment**: Test sign up, add members, add meals, and check payment history to ensure everything works!

---

## ❓ FAQ & Troubleshooting

### General Issues

**Q: I see a blank screen after login**
- A: Check the browser console (F12 → Console tab) for error messages
- Try refreshing the page
- Clear browser cache and try again

**Q: Meals aren't syncing in real-time**
- A: Verify your internet connection
- Check that Supabase credentials are correct
- Refresh the page manually

**Q: I can't add members**
- A: Maximum 4 members allowed per account
- Check that member names aren't empty
- Refresh and try again

### Development Issues

**Q: npm install fails**
- A: Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

**Q: Build fails with TypeScript errors**
- A: Run `npm run typecheck` to see all type errors
- Run `npm run lint` to fix linting issues

**Q: Development server won't start**
- A: Make sure port 5174 isn't in use
- Try: `npm run dev -- --port 5175`

### Deployment Issues

**Q: Environment variables not recognized after deployment**
- A: Vercel caches might need clearing
- Redeploy: `vercel --prod --force`

**Q: Supabase connection works locally but not on Vercel**
- A: Double-check environment variable names (should be exact)
- Make sure anon key is public key, not secret key

---

## 📖 How to Use

### First Time Setup
1. Sign up with email and password
2. Add members who will be sharing meals
3. Start adding meals from the Dashboard

### Daily Usage
1. **Add Meals**: Log breakfast, lunch, or dinner
2. **Record Payments**: When someone pays, record it
3. **View History**: Check payment details anytime
4. **Archive**: When period ends, click "Mark as Paid" to archive

### Viewing Archives
1. Go to History tab
2. Click Archives
3. Expand any archive to see:
   - Payments made during that period
   - Member-wise breakdown
   - Individual meal details
   - Amount that was left to pay

---

## 🤝 Contributing

Want to improve this app? 
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 💡 Tips & Features

- **Dark Theme**: Easier on eyes, modern aesthetic
- **Real-time Updates**: Changes sync instantly
- **Payment Breakdown**: See exactly who contributed what
- **Historical Data**: Archives preserve everything for future reference
- **Responsive**: Works great on any device

---

## 🆘 Troubleshooting

### White screen when expanding archives?
- This has been fixed! Update to the latest version
- Check browser console (F12) for any errors

### Environment variables not loading?
- Make sure `.env.local` is in the root directory
- Restart the dev server after changing env vars
- Variable names must start with `VITE_`

### Supabase connection error?
- Verify your URL and Anon Key are correct
- Check Supabase project is active
- Ensure RLS policies are properly configured

---

## 📌 Roadmap

- [ ] Export meal data as CSV
- [ ] Split meal costs by type (veg/non-veg)
- [ ] Monthly statistics and charts
- [ ] Notification system
- [ ] Recurring meal templates
- [ ] Multi-group support

---

## 👨‍💻 Developer Info

**Created**: April 2026  
**Built with**: React, TypeScript, Tailwind CSS, Supabase  
**GitHub**: [iam-rebel-sk](https://github.com/iam-rebel-sk)

---

## 📞 Support

Need help? 
- Check the [Troubleshooting](#-troubleshooting) section
- Create an issue on GitHub
- Contact via GitHub discussions

---

**Happy tracking! 🎉** Make meal splitting easy and transparent.
