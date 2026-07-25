#!/usr/bin/env python3
"""
Fetch Binance listing announcements from Binance API.
Fetches new coin listings and converts to unified schema.
"""
import requests
import json
import os
from datetime import datetime, timezone

# Updated API endpoint - catalogId=49 for Latest Binance News
API_URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=49&pageNo=1&pageSize=50"
OUTPUT_FILE = "data/binance.json"

def fetch_binance():
    try:
        response = requests.get(API_URL, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # New response structure: data -> catalogs -> articles
        catalogs = data.get("data", {}).get("catalogs", [])
        if not catalogs:
            print("No catalogs found in response")
            return []
            
        articles = catalogs[0].get("articles", [])
        results = []
        
        for article in articles:
            title = article.get("title", "")
            code = article.get("code", "")
            release_date = article.get("releaseDate", 0)
            
            # Determine content type from title keywords
            content_type = "announcement"
            tags = ["binance"]
            
            title_lower = title.lower()
            if "will list" in title_lower or "lists" in title_lower:
                content_type = "listing"
                tags.append("listing")
            elif "delist" in title_lower:
                content_type = "delisting"
                tags.append("delisting")
            elif "launchpool" in title_lower:
                content_type = "launchpool"
                tags.append("launchpool")
            elif "airdrop" in title_lower:
                content_type = "airdrop"
                tags.append("airdrop")
            elif "monitoring tag" in title_lower:
                content_type = "monitoring"
                tags.append("monitoring")
            
            # Extract coin symbols from title
            words = title.split()
            for word in words:
                clean = word.strip("()[]{}").upper()
                if 2 <= len(clean) <= 6 and clean.isalpha() and clean not in ["BINANCE", "WILL", "LIST", "TRADING", "PAIR", "THE", "AND", "FOR", "WITH", "FROM", "USD", "APR"]:
                    if clean not in [t.upper() for t in tags]:
                        tags.append(clean.lower())
            
            # Parse releaseDate (milliseconds timestamp)
            if release_date:
                try:
                    published_at = datetime.fromtimestamp(release_date / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                except:
                    published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            else:
                published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            
            results.append({
                "id": f"binance_{code}",
                "title": title,
                "platform": "binance",
                "content_type": content_type,
                "url": f"https://www.binance.com/en/support/announcement/{code}",
                "published_at": published_at,
                "engagement": 0,
                "summary": f"Binance announcement: {title}",
                "tags": list(set(tags))
            })
        
        return results
    except Exception as e:
        print(f"Error fetching Binance: {e}")
        return []

def main():
    data = fetch_binance()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(data)} Binance items to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
