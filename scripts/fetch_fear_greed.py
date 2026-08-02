#!/usr/bin/env python3
import requests, json, os
from datetime import datetime, timezone

OUTPUT = "data/fear_greed.json"

def fetch():
    try:
        r = requests.get("https://api.alternative.me/fng/?limit=1", timeout=30)
        r.raise_for_status()
        data = r.json()
        item = data.get("data", [{}])[0]
        return [{
            "id": "fear_greed_latest",
            "title": f"Fear & Greed: {item.get('value_classification','Unknown')} ({item.get('value','?')})",
            "platform": "fear_greed",
            "type": "sentiment",
            "url": "https://alternative.me/crypto/fear-and-greed-index/",
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
            "summary": f"Crypto Fear & Greed Index is {item.get('value_classification','Unknown')} at {item.get('value','?')}/100. Market sentiment indicator.",
            "source": "Alternative.me",
            "value": int(item.get("value", 0)),
            "label": item.get("value_classification", "Unknown")
        }]
    except Exception as e:
        print(f"Fear & Greed failed: {e}")
        return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"Fear & Greed: {len(data)} items")
