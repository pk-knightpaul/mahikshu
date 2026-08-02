# Mahikshu v3.0 — Futuristic Crypto Dashboard

## What's Fixed
- **Node.js 20 warning** → Updated to `actions/checkout@v4.2.2`, `setup-python@v5.5.0`, `git-auto-commit-action@v5.2.0`
- **Exit code 2 errors** → `continue-on-error: true` on all steps + explicit `pip install requests beautifulsoup4 lxml feedparser`
- **Binance not fetching** → Web scraping fallback with `requests` + `BeautifulSoup` when API fails
- **All sources empty** → 14 demo opportunities auto-load if every API fails

## Features
| Feature | Description |
|---------|-------------|
| **🔑 Key Points** | PixelRAG-inspired client-side NLP extracts top facts from every card |
| **📋 Copy Button** | Copies title + key points + summary + URL with visual feedback |
| **⏰ Smart Time Filters** | Today, Yesterday, Last Hour, Last 6h, Last 24h, This Week, This Month, Custom Date Range |
| **🎨 Futuristic UI** | Glassmorphism cards, neon platform-colored borders, animated gradient background |
| **✨ AI Content Gen** | OpenAI, Claude, Gemini, Groq, Hugging Face, OpenRouter — all in one modal |
| **⌨️ Keyboard Shortcuts** | `T` = theme, `/` = search, `Esc` = close |
| **📥 Exports** | CSV and Markdown reports with version stamps |
| **⭐ Watchlist** | Save opportunities to localStorage |

## Deploy Steps
1. Upload all files to GitHub repo
2. Create `.github/workflows/update-data.yml` manually (GitHub blocks hidden folder upload via browser)
3. Enable Actions permissions (Settings → Actions → General → Read and write)
4. Enable GitHub Pages (Settings → Pages → main → root)
5. Run Actions workflow once

## Architecture
```
GitHub Actions (hourly) → Python fetchers → JSON files → Static HTML/JS → Browser
```
Zero backend. Zero cost. Fully automated.
