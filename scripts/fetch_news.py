#!/usr/bin/env python3
import feedparser, json, os
from datetime import datetime, timezone

OUTPUT = "data/news.json"
FEEDS = [
    ("CoinTelegraph", "https://cointelegraph.com/rss"),
    ("CoinDesk", "https://coindesk.com/arc/outboundfeeds/rss/"),
    ("Decrypt", "https://decrypt.co/feed"),
]

def fetch():
    results = []
    for source, url in FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:
                dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat().replace("+00:00","Z") if hasattr(entry, 'published_parsed') else datetime.now(timezone.utc).isoformat().replace("+00:00","Z")
                results.append({
                    "id": f"news_{source.lower()}_{entry.get('id','')[:30]}",
                    "title": entry.get("title", "No title"),
                    "platform": "news",
                    "type": "news",
                    "url": entry.get("link", ""),
                    "timestamp": dt,
                    "summary": entry.get("summary", "")[:200] + "..." if len(entry.get("summary","")) > 200 else entry.get("summary", ""),
                    "source": source
                })
        except Exception as e:
            print(f"News {source} failed: {e}")
    return results

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"News: {len(data)} items")
