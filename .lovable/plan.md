

# AI Forex Analysis App - Implementation Plan

## Overview
A premium, mobile-first (390x844px) AI-powered Forex chart analysis application with an institutional dark theme, gold accents, and a professional trading aesthetic. Users upload chart images and receive Buy/Sell signals with Entry, Stop Loss, and Take Profit recommendations.

---

## Page 1: Welcome/Intro Page
A sleek landing page that introduces the app's value proposition.

**Features:**
- Hero section with bold headline about AI-powered market analysis
- Animated gold accent elements for premium feel
- Key benefits showcase: High-Probability Signals, Institutional-Grade Analysis, 24/7 Availability
- "Get Started" call-to-action button leading to authentication
- Dark slate background with gold typography accents

---

## Page 2: Authentication
Clean, premium login and signup experience.

**Sign Up Flow:**
- Collect: Full Name, Email, Phone Number
- Automated welcome email sent upon registration with login confirmation
- Smooth validation and error handling

**Login Flow:**
- Email and password authentication
- "Forgot Password" functionality
- Auto-redirect to dashboard upon successful login

---

## Page 3: Main Dashboard
The core experience - upload and analyze charts.

**Features:**
- Prominent "Upload Chart" area with drag-and-drop or tap-to-upload
- AI analysis results displayed in a premium card format:
  - **Direction:** BUY or SELL with color-coded indicator
  - **Entry Price:** Recommended entry point
  - **Stop Loss:** Risk management level
  - **Take Profit:** Target price levels (TP1, TP2, TP3)
  - **Confidence Score:** Analysis confidence percentage
- Daily usage indicator (X/5 analyses remaining for free tier)
- Quick access to analysis history
- Mobile bottom navigation bar

---

## Page 4: Analysis History
Review past trading signals and their details.

**Features:**
- Scrollable list of previous analyses
- Each entry shows: Date, Trading Pair (if detected), Direction, Key Levels
- Tap to expand full analysis details
- Filter by date range
- Premium storage of all historical analyses

---

## Page 5: Offers & Plans
Subscription tier comparison and upgrade options.

**Free Tier:**
- 5 chart analyses per day
- Basic signal information (Entry, SL, TP1)
- Standard processing speed

**Premium Tier:**
- Unlimited analyses
- Extended targets (TP1, TP2, TP3)
- Priority processing
- Full analysis history
- Advanced market insights

**Display:**
- Side-by-side plan comparison cards
- Premium tier highlighted with gold accents
- "Coming Soon" or "Contact Us" for upgrade path

---

## Page 6: Contact & Social Links
Connect with your community and support.

**Features:**
- Social media icons linking to:
  - Facebook (placeholder URL)
  - Instagram (placeholder URL)
  - Telegram (placeholder URL)
  - TikTok (placeholder URL)
- Contact email display
- Professional footer design

---

## Visual Design System
- **Primary Background:** Deep dark slate (#0F1419)
- **Surface/Cards:** Slightly lighter slate (#1A1F26)
- **Accent Color:** Premium gold (#D4AF37)
- **Text:** Clean white and muted grays
- **Typography:** Modern sans-serif, clear hierarchy
- **Icons:** Clean, minimal line icons
- **Mobile Navigation:** Fixed bottom nav bar with gold active states

---

## Technical Architecture

**Backend (Lovable Cloud):**
- User authentication and profiles
- Analysis history storage
- Daily usage tracking per user
- Subscription tier management

**AI Integration (Lovable AI with Vision):**
- Chart image upload and processing
- Market structure analysis (internal logic)
- Signal generation with Entry, SL, TP calculations
- Confidence scoring

**Email Integration:**
- Welcome email on registration using Resend

---

## User Flow Summary
1. **Welcome** → User sees value proposition
2. **Sign Up** → Creates account with name, email, phone
3. **Email** → Receives welcome email confirmation
4. **Dashboard** → Uploads first chart
5. **Analysis** → Receives AI-generated trading signal
6. **History** → Reviews past analyses
7. **Upgrade** → Views premium plans for unlimited access

