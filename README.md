# ICP Fit Scorer

Score prospects against your Ideal Customer Profile (ICP) criteria using AI, rule-based evaluation, engagement tracking, and predictive modeling. Generate personalized outreach copy for each scored prospect.

## Features

- **AI-Powered Scoring** — Send company descriptions to an AI scoring engine that evaluates them against weighted ICP criteria and returns a tier (A/B/C/D) with a 0–100 score
- **Batch Scoring** — Score multiple companies in one pass with progress tracking and failure handling
- **Rule-Based Scoring** — Define demographic, firmographic, and behavioral rules that assign point values (e.g., "email uses personal domain → −5 points")
- **Engagement Scoring** — Track lead engagement events (page visits, email opens, demo requests) with configurable point values and decay
- **Intent Scoring** — Ingest first-party and third-party intent signals with weighted scoring
- **Predictive Scoring** — Train a model on historical deal outcomes (win/loss) to predict conversion probability
- **Negative Scoring** — Define disqualification rules and thresholds to flag unfit leads
- **Outreach Generation** — AI-generated outreach copy (subject line, opening, value hook, CTA) with tone options: casual, formal, challenger
- **Prospect Management** — Search, sort, compare (side-by-side up to 3), and manage scored prospects
- **Company Enrichment** — Enrich company data via Firecrawl web scraping (website, G2, LinkedIn)
- **Guided Onboarding** — Interactive tour and help center for new users

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite (SWC) |
| Styling | Tailwind CSS 3 + custom design system |
| Components | shadcn/ui |
| State | Zustand (persisted to localStorage) |
| Server State | TanStack React Query |
| Animations | Framer Motion |
| Drag & Drop | dnd-kit |
| Charts | Recharts |
| Backend | Supabase (Postgres + Edge Functions) |
| AI | Claude API (via Supabase Edge Functions) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project with the required tables and edge functions deployed

### Local Development

```sh
git clone <repo-url>
cd icp-fit-scorer
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Build

```sh
npm run build
```

### Test

```sh
npm test
```

## Supabase Edge Functions

The backend logic runs as Supabase Edge Functions (Deno):

| Function | Purpose |
|----------|---------|
| `score-prospect` | AI scoring via Claude — evaluates a company against ICP criteria, returns tier + outreach copy |
| `enrich-company` | Company data enrichment via Firecrawl (website scraping, G2, LinkedIn) |
| `predict-lead-score` | Predictive scoring using trained model weights |
| `train-predictive-model` | Trains predictive model on historical deal data |
| `log-signal` | Logs behavioral and intent signals |
| `regenerate-outreach` | Re-generates outreach copy with a different tone |

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── scoring/               # Score input, results, batch UI
│   ├── scoring-rules/         # Rule-based scoring config
│   ├── engagement-scoring/    # Engagement tracking UI
│   ├── intent-scoring/        # Intent signal UI
│   ├── predictive-scoring/    # Predictive model UI
│   ├── negative-scoring/      # Negative/disqualification UI
│   └── onboarding/            # Tour, help center, tooltips
├── pages/
│   ├── ScorePage.tsx          # Main scoring (single + batch)
│   ├── SetupPage.tsx          # Configuration (6 tabs)
│   └── ProspectsPage.tsx      # Prospect management + engagement
├── hooks/                     # Data fetching hooks (Supabase + React Query)
├── stores/                    # Zustand store (criteria, prospects, scoring mode)
├── types/                     # TypeScript type definitions
├── lib/                       # Rule scoring engine
└── integrations/supabase/     # Supabase client + generated types
supabase/
├── functions/                 # Edge functions (Deno)
└── migrations/                # Database migrations
```
