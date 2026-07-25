#!/usr/bin/env python3
"""
Fetch crypto news from RSS feeds.
"""
import feedparser
import json
import os
from datetime import datetime, timezone

FEEDS = [
    "https://cointelegraph.com/rss",
    "https://coindesk.com/arc/outboundfeeds/rss/",
    "https://decrypt.co/feed",
]

OUTPUT_FILE = "data/news.json"

def fetch_news():
    results = []

    for feed_url in FEEDS:
        try:
            feed = feedparser.parse(feed_url)

            for entry in feed.entries[:15]:
                title = entry.get("title", "")
                link = entry.get("link", "")
                published = entry.get("published", "")
                summary = entry.get("summary", "")

                # Parse date
                try:
                    if published:
                        parsed = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                        published_at = parsed.isoformat().replace("+00:00", "Z")
                    else:
                        published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                except:
                    published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

                # Determine content type
                content_type = "news"
                tags = ["news"]

                title_lower = title.lower()
                if any(word in title_lower for word in ["list", "listing", "binance", "coinbase"]):
                    content_type = "listing_news"
                    tags.append("listing")
                elif any(word in title_lower for word in ["hack", "exploit", "breach", "stolen"]):
                    content_type = "security"
                    tags.append("security")
                elif any(word in title_lower for word in ["regulation", "sec", "etf", "approval"]):
                    content_type = "regulation"
                    tags.append("regulation")
                elif any(word in title_lower for word in ["airdrop", "claim", "free"]):
                    content_type = "airdrop"
                    tags.append("airdrop")

                # Extract source from URL
                source = "news"
                if "cointelegraph" in link:
                    source = "cointelegraph"
                elif "coindesk" in link:
                    source = "coindesk"
                elif "decrypt" in link:
                    source = "decrypt"

                tags.append(source)

                entry_id = link.split("/")[-1].split("?")[0] or str(hash(title))

                results.append({
                    "id": f"news_{source}_{entry_id[:30]}",
                    "title": title,
                    "platform": "news",
                    "content_type": content_type,
                    "url": link,
                    "published_at": published_at,
                    "engagement": 0,
                    "summary": summary[:200] + "..." if len(summary) > 200 else summary,
                    "tags": tags
                })
        except Exception as e:
            print(f"Error fetching {feed_url}: {e}")

    return results

def main():
    data = fetch_news()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(data)} news items to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
