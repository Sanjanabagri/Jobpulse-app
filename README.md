<div align="center">

# ⚡ JobPulse

### AI-Powered Job Aggregator with Trust Scores & Smart Matching

A modern job portal prototype that surfaces high-quality job postings with trust scores, freshness labels, and personalized AI match scores — all powered by an intelligent agent you can chat with.

</div>

---

## 📖 Overview

**JobPulse** is a full-stack job platform built for tech professionals. Instead of just listing jobs, JobPulse evaluates every posting with a **trust score** (0–100), labels it by **freshness** (fresh / active / aging / stale), and computes a **personalized match score** based on your skills, experience, and preferred domain. An integrated AI agent lets you ask questions in natural language and returns relevant jobs, stats, and trends in real time.

This repository contains a complete, deployable prototype — authentication, profile onboarding, job feed, daily digests, saved jobs, and an AI chat agent.

---

## ✨ Features

### Authentication & Onboarding
- **Sign up / Sign in** — email + password authentication via Supabase Auth
- **Email verification** — a confirmation screen appears after signup with a resend option and cooldown timer
- **3-step profile onboarding** — collect basic info (name, headline, role, experience, location), then domain & skills, then a review/confirm step
- **Profile completion gate** — users must complete their profile before reaching the main app

### Job Feed
- **Trust scores** — every job posting is scored 0–100 for credibility
- **Freshness labels** — jobs are tagged as fresh, active, aging, or stale based on post date
- **Personalized match scores** — jobs are ranked against your profile (skills, domain, experience, location preferences)
- **Domain filtering** — sidebar to filter by tech domain (Frontend, Backend, DevOps, AI/ML, etc.)
- **Search & sort** — full-text search and multi-criteria sorting
- **Saved jobs** — bookmark any job for later

### Daily Triggers & Digests
- **Daily digest view** — per-domain summaries with job counts and top companies
- **Trigger indicators** — see which domains have new activity

### AI Agent
- **Chat interface** — ask the agent questions in natural language ("Show me remote React jobs in Bangalore", "What's trending in AI/ML?")
- **Intent-aware responses** — returns relevant jobs, platform stats, and trending domains
- **Floating action button** — accessible from anywhere in the app

### Profile & Settings Menu
- **Top-right dropdown** — a job-portal-style menu with:
  - **View Profile** — detailed panel showing role, experience, location, domain, skills, and verified badge
  - **Edit Profile** — modal to update all profile fields
  - **Saved Jobs** — quick access to bookmarked positions
  - **Settings** — account settings
  - **Sign out**

### UX Polish
- **Animated splash screen** on app launch
- **Responsive design** — optimized for mobile, tablet, and desktop
- **Micro-interactions** — hover states, transitions, loading spinners
- **Clean visual hierarchy** with an 8px spacing system and a consistent color palette

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email/password) |
| AI Agent | Supabase Edge Functions |
| Hosting | Bolt / Vercel-ready |

---

## 🗄️ Database Schema

The app uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled on every table.

### Tables

| Table | Purpose |
|-------|---------|
| `domains` | Tech domains (Frontend, Backend, DevOps, AI/ML, etc.) with icon and color |
| `job_sources` | External job board API sources |
| `job_postings` | Job listings with trust score, freshness label, salary, tags, and domain link |
| `profiles` | Extended user profiles linked to `auth.users` — skills, experience, domain, location prefs |
| `saved_jobs` | User-bookmarked jobs (owner-scoped) |
| `subscriptions` | Email subscription preferences per domain |
| `daily_digests` | Per-domain daily job summaries with top companies |

### Security

- **RLS enabled** on all tables — users can only read/write their own data
- **Owner-scoped policies** using `auth.uid()` for `profiles`, `saved_jobs`, and `subscriptions`
- **Auto-profile creation** via a database trigger on `auth.users` insert
- **Automatic `updated_at`** timestamps via trigger on `profiles`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/jobpulse.git
cd jobpulse

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

The project uses Supabase. The following variables are pre-configured in `.env`:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=your-database-url
```

> **Note:** If deploying outside Bolt, create a Supabase project at [supabase.com](https://supabase.com) and populate these values.

### Available Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck  # TypeScript type checking
npm run preview    # Preview production build
```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx            # Sign in / Sign up + email verification
│   ├── VerifyEmail.tsx         # Post-signup email confirmation screen
│   ├── SplashScreen.tsx        # Animated app launch screen
│   ├── ProfileOnboarding.tsx   # 3-step profile setup wizard
│   ├── Header.tsx              # Top navigation bar
│   ├── Sidebar.tsx             # Domain filter sidebar
│   ├── JobFeed.tsx             # Main job listing feed
│   ├── JobCard.tsx             # Individual job posting card
│   ├── StatsBar.tsx            # Platform statistics
│   ├── DigestView.tsx          # Daily triggers / digests
│   ├── AgentChat.tsx           # AI agent chat interface
│   ├── ProfileMenu.tsx         # Top-right dropdown menu
│   ├── EditProfileModal.tsx    # Profile editing modal
│   ├── SubscribeModal.tsx      # Email subscription modal
│   └── DomainIcon.tsx          # Domain icon renderer
├── hooks/
│   ├── useAuth.ts              # Authentication state & actions
│   └── useData.ts              # Data fetching (jobs, domains, digests)
├── lib/
│   └── supabase.ts             # Supabase client singleton
├── types/
│   └── index.ts                # TypeScript interfaces
└── App.tsx                     # Root component & routing logic

supabase/
├── migrations/                 # Database schema migrations
└── functions/                  # Edge functions (AI agent)
```

---

## 🔑 User Flow

```
App Launch
    │
    ▼
Splash Screen (animated logo)
    │
    ▼
Sign Up / Sign In ──── (new user) ───▶ Email Verification Screen
    │                                        │
    │                                   (verify + sign in)
    │                                        │
    ▼────────────────────────────────────────▼
Profile Onboarding (3 steps)
    │
    │  1. Basic info (name, headline, role, experience, location)
    │  2. Domain selection + skills
    │  3. Review & confirm
    │
    ▼
Main App
    ├── Job Feed (trust scores, match scores, freshness, search, filter)
    ├── Daily Triggers (per-domain digests)
    ├── AI Agent Chat (natural language job search)
    └── Profile Menu (top-right dropdown)
         ├── View Profile
         ├── Edit Profile
         ├── Saved Jobs
         ├── Settings
         └── Sign Out
```

---

## 🤖 AI Agent

The integrated agent processes natural-language queries and returns:

- **Relevant jobs** — filtered and ranked by your query intent
- **Platform stats** — total jobs, new today, remote count, subscriber count, domain breakdown
- **Trending domains** — which domains are seeing the most new postings

Example queries:
- "Show me remote React jobs in Bangalore"
- "What's trending in AI/ML?"
- "How many new jobs posted today?"
- "Find senior backend roles paying above 20 LPA"

The agent runs as a Supabase Edge Function with full CORS support.

---

## 🎨 Design System

- **Color palette:** Slate neutrals + sky/blue primary, with success (emerald), warning (amber), and error (red) ramps
- **Typography:** System font stack with 3 weights (400 / 600 / 700)
- **Spacing:** 8px base grid
- **Line height:** 150% body, 120% headings
- **Breakpoints:** Mobile-first with `sm`, `md`, `lg` Tailwind breakpoints
- **Components:** Rounded corners (xl/2xl), subtle shadows, backdrop-blur surfaces

---

## 📝 Database Migrations

Migrations are applied via the Supabase MCP tool and are idempotent (safe to re-run). Key migrations:

1. **Initial schema** — `domains`, `job_sources`, `job_postings`, `subscriptions`, `daily_digests`
2. **Profiles + trust + freshness** — `profiles`, `saved_jobs`, trust scores, freshness labels, auto-profile trigger on signup

To inspect the live database:
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## 🧪 Testing the Prototype

1. **Sign up** with a new email and password
2. **Check your inbox** for the verification email (or use the resend button)
3. **Sign in** after verifying
4. **Complete the 3-step onboarding** — pick a domain and add skills
5. **Browse the job feed** — filter by domain, search, and sort by trust/match score
6. **Save jobs** using the bookmark icon on any job card
7. **Ask the AI agent** questions via the floating button (bottom-right)
8. **Check Daily Triggers** for per-domain digests
9. **Open the profile menu** (top-right) to view/edit your profile and sign out

---

## 📄 License

This is a prototype project. Feel free to use it as a starting point for your own job platform.

---

<div align="center">

**Built with React · TypeScript · Vite · Supabase · Tailwind CSS**

</div>
