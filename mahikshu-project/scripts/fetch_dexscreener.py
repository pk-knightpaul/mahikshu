#!/usr/bin/env python3
"""
Fetch trending pairs from DexScreener API.
"""
import requests
import json
import os
from datetime import datetime, timezone

TRENDING_URL = "https://api.dexscreener.com/token-profiles/latest/v1"
OUTPUT_FILE = "data/dexscreener.json"

def fetch_dexscreener():
    results = []

    try:
        resp = requests.get(TRENDING_URL, timeout=30)
        resp.raise_for_status()
        profiles = resp.json()

        for profile in profiles[:30]:
            token_address = profile.get("tokenAddress", "")
            chain_id = profile.get("chainId", "")
            token_name = ""
            token_symbol = ""

            # Try to get name/symbol from description or URL
            url = profile.get("url", "")
            description = profile.get("description", "")

            # Extract from URL if possible
            if url:
                parts = url.split("/")
                if len(parts) >= 2:
                    token_symbol = parts[-1].upper() if parts[-1] else "UNKNOWN"

            # Use description as name if available
            if description:
                token_name = description[:50]
            else:
                token_name = token_symbol

            published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

            results.append({
                "id": f"dexscreener_{chain_id}_{token_address[:16]}",
                "title": f"🆕 New: {token_name or token_symbol} on {chain_id.upper()}",
                "platform": "dexscreener",
                "content_type": "new_pair",
                "url": url or f"https://dexscreener.com/{chain_id}/{token_address}",
                "published_at": published_at,
                "engagement": 0,
                "summary": f"New token profile on DexScreener for {chain_id.upper()}. {description[:100] if description else ''}",
                "tags": ["new-pair", chain_id.lower(), "dexscreener"]
            })
    except Exception as e:
        print(f"Error fetching DexScreener: {e}")

    return results

def main():
    data = fetch_dexscreener()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(data)} DexScreener items to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
