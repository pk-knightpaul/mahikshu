#!/usr/bin/env python3
"""
Fetch Binance listing announcements from Binance API.
Fetches new coin listings and converts to unified schema.
"""
import requests
import json
import os
from datetime import datetime, timezone

API_URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/catalog/list/query?catalogId=48&pageNo=1&pageSize=50"
OUTPUT_FILE = "data/binance.json"

def fetch_binance():
    try:
        response = requests.get(API_URL, timeout=30)
        response.raise_for_status()
        data = response.json()

        articles = data.get("data", {}).get("articles", [])
        results = []

        for article in articles:
            title = article.get("title", "")
            code = article.get("code", "")
            publish_date = article.get("publishDate", 0)

            # Determine content type from title keywords
            content_type = "announcement"
            tags = ["binance"]

            if "will list" in title.lower() or "lists" in title.lower():
                content_type = "listing"
                tags.append("listing")
            elif "delist" in title.lower():
                content_type = "delisting"
                tags.append("delisting")
            elif "launchpool" in title.lower():
                content_type = "launchpool"
                tags.append("launchpool")
            elif "airdrop" in title.lower():
                content_type = "airdrop"
                tags.append("airdrop")

            # Extract coin symbols from title
            words = title.split()
            for word in words:
                clean = word.strip("()[]{}").upper()
                if len(clean) <= 6 and clean.isalpha() and clean not in ["BINANCE", "WILL", "LIST", "TRADING", "PAIR"]:
                    tags.append(clean.lower())
                    break

            published_at = datetime.fromtimestamp(publish_date / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")

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
