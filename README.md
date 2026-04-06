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

### Archive Details White Screen Fix (Apr 6, 2026)
- ✅ Fixed null/undefined errors when expanding archive details
- ✅ Added Error Boundary component for graceful error handling
- ✅ Safe data access with proper fallbacks

---

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" and select your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy"

Your app will be live in 1-2 minutes!

**Live URL**: Your Vercel deployment URL will appear in the dashboard

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
