# DripCatch

**A privacy-first, zero-credential subscription ledger and outflow forecaster.**

DripCatch helps you track recurring expenses, expose unused "zombie" subscriptions, detect stealth price hikes, and coordinate shared subscription splits—without ever linking your bank account or handing over financial credentials.

---

## Core Philosophy

Most subscription trackers rely on invasive open-banking aggregators (like Plaid) or card scraping that compromise your financial privacy. DripCatch takes the opposite approach:

* **Zero Bank Connections:** No bank logins, no API tokens, no credit card numbers. Everything is user-controlled.
* **Tenant Isolation at the Engine Level:** Powered by Supabase PostgreSQL with strict Row Level Security (`auth.uid() = user_id`).
* **Clarity Over Clutter:** Separates what you pay and actually use from what you waste on forgotten services and what friends reimburse you.

---

## Features

* **3-Part Outflow Analytics:**
  * **Paid & In Use:** Your true active recurring utility.
  * **Paid but Unused (Zombies):** Quantifies monthly and annual cash leaks from forgotten subscriptions.
  * **Paid by Others:** Tracks costs covered by co-payers and split participants.
* **12-Month Stacked Area Forecast:** Visualizes upcoming cash flow across weekly, monthly, quarterly, and annual billing cadences.
* **Interactive Category Breakdown:** Donut chart with a live center HUD and proportional category bars.
* **Collaborative Subscription Splits:** Split bills with roommates, partners, or friends and automatically calculate your net out-of-pocket share.
* **Price Creep Detection:** Tracks `original_cost` vs. current `cost` to surface silent vendor price hikes.
* **Localized & Accessible:** Full English (`en`) and French (`fr`) support via `next-intl`, plus adaptive dark and light themes.

---

## Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, React 19)
* **Language:** TypeScript
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS + PKCE Auth)
* **Styling:** Tailwind CSS & Lucide Icons
* **Charts:** Recharts
* **Internationalization:** `next-intl`

---

## Getting Started

### 1. Prerequisites

* Node.js 20+
* `pnpm` (recommended)
* A [Supabase](https://supabase.com/) project

### 2. Clone & Install

```bash
git clone [https://github.com/your-username/dripcatch.git](https://github.com/your-username/dripcatch.git)
cd dripcatch
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory ( or duplicate `.env.example` ):

```env
# SMTP
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@dripcatch.fr
SMTP_PASS=
SMTP_FROM="DripCatch NOREPLY <noreply@dripcatch.fr>"

# App URL
NEXT_PUBLIC_APP_URL=https://www.dripcatch.fr

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cron
CRON_SECRET=
```

### 4. Database Setup

Ensure your Supabase instance has the core tables configured with Row Level Security (RLS) enabled:

* `user_subscriptions` (stores cost, interval, category, `is_zombie`, `first_billed_date`, `next_billing_date`, `original_cost`)
* `subscription_splits` (stores split allocations, participant emails, and `accepted` / `pending` / `rejected` statuses)
* `contact_messages` (stores inquiries submitted via `/contact`)

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```text
app/
├── [locale]/               # Localized App Router pages (en, fr)
│   ├── contact/            # Contact form page
│   ├── ledger/             # Main subscription dashboard
│   ├── privacy/            # Privacy policy
│   ├── security/           # Security & trust overview
│   └── terms/              # Terms of service
├── actions/                # Next.js Server Actions
├── components/
│   ├── contact/            # Contact form UI
│   ├── ledger/             # Ledger tables, modals, and math utilities
│   │   └── analytics/      # Modular Recharts & KPI components
│   └── ui/                 # Shared layout primitives (Navbar, Footer)
└── lib/                    # Currency formatters & Supabase clients
messages/
├── en.json                 # English dictionary
└── fr.json                 # French dictionary
```

---

## Contributing

Contributions are welcome! Check the [Issues](https://github.com/your-username/dripcatch/issues) tab for open tasks, bug fixes, and planned features.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## License

This project is **Source-Available** and free for personal and educational use. 
Commercial use, resale, and SaaS hosting are strictly prohibited. See [`LICENSE.md`](./LICENSE.md) for full terms.
