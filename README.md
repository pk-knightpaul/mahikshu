# 🚀 Mahikshu — Crypto Opportunity Dashboard

> **Sanskrit:** "Swift observer of the earth"  
> A free, lightweight, zero-backend dashboard for crypto SEO/content writers to discover content opportunities across the crypto landscape.

---

## What is Mahikshu?

Mahikshu aggregates crypto opportunities — new exchange listings, trending coins, new DEX pairs, and breaking news — into a single, filterable dashboard. It's designed for content creators and SEO writers who need to spot trends *before* they peak.

## Architecture

```
GitHub Actions (Cron: every hour)
        │
        ▼
Python scripts fetch public APIs
        │
        ▼
Normalized JSON files → /data/ directory
        │
        ▼
GitHub Pages / Cloudflare Pages (static hosting)
        │
        ▼
Vanilla JS fetches JSON, filters & renders UI
```

**Zero backend. Zero cost. Pure static.**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES6 modules) |
| Data Pipeline | Python 3.11+ (`requests`, `feedparser`) |
| Automation | GitHub Actions (cron) |
| Hosting | GitHub Pages / Cloudflare Pages |

## Data Sources

| Platform | Endpoint | Data |
|----------|----------|------|
| Binance | `/bapi/composite/v1/public/cms/article/catalog/list/query` | Listing announcements |
| CoinGecko | `/search/trending`, `/coins/markets` | Trending coins, top movers |
| DexScreener | `/token-profiles/latest/v1` | New token pairs |
| News | RSS feeds (CoinTelegraph, CoinDesk, Decrypt) | Breaking news |

## Directory Structure

```
/
├── .github/workflows/update-data.yml   # Hourly cron workflow
├── data/                               # Generated JSON data
│   ├── binance.json
│   ├── coingecko.json
│   ├── dexscreener.json
│   ├── news.json
│   └── meta.json
├── scripts/                            # Python fetchers
│   ├── requirements.txt
│   ├── fetch_binance.py
│   ├── fetch_coingecko.py
│   ├── fetch_dexscreener.py
│   ├── fetch_news.py
│   └── update_meta.py
├── css/styles.css                      # All styling (light/dark mode)
├── js/
│   ├── app.js                          # Core UI logic
│   ├── ai.js                           # BYOK LLM integration
│   └── storage.js                      # Storage helpers
├── assets/logo.svg                     # Brand logo
├── index.html                          # Main entry
└── README.md
```

## Running Locally

### 1. Clone & setup

```bash
git clone <your-repo>.git
cd mahikshu
pip install -r scripts/requirements.txt
```

### 2. Fetch data manually

```bash
python scripts/fetch_binance.py
python scripts/fetch_coingecko.py
python scripts/fetch_dexscreener.py
python scripts/fetch_news.py
python scripts/update_meta.py
```

### 3. Serve locally

Any static file server works:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# Or open index.html directly in your browser
```

Then visit `http://localhost:8080`

## Deploying to Cloudflare Pages

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com) → Create a project
3. Connect your GitHub repo
4. **Build settings:**
   - Build command: *(leave empty)*
   - Build output directory: `/` (root)
5. Deploy!

The GitHub Actions cron job will automatically commit updated JSON files to your repo, and Cloudflare Pages will auto-deploy on every push.

## Deploying to GitHub Pages

1. Go to your repo → Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` → `/` (root)
4. Save

## AI Features (Phase 2 — BYOK)

Mahikshu supports AI-powered content idea generation using your own API key:

- **OpenAI** (GPT-3.5-turbo)
- **Anthropic** (Claude Haiku)

Your API key is stored **only in `sessionStorage`** and is never sent to our servers. It clears when you close the browser tab.

## Privacy

- No user accounts
- No tracking cookies
- No analytics
- AI keys stored only in browser `sessionStorage`

## License

MIT — use it, fork it, build on it.

---

*Built with 💚 for the crypto content community.*
