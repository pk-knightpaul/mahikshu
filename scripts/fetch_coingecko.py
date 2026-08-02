#!/usr/bin/env python3
import requests, json, os
from datetime import datetime, timezone

OUTPUT = "data/coingecko.json"

def fetch():
    try:
        r = requests.get("https://api.coingecko.com/api/v3/search/trending", headers={"User-Agent":"Mozilla/5.0"}, timeout=30)
        r.raise_for_status()
        data = r.json()
        coins = data.get("coins", [])
        results = []
        for c in coins:
            item = c.get("item", {})
            results.append({
                "id": f"coingecko_{item.get('id','unknown')}",
                "title": f"🔥 Trending: {item.get('name','')} ({item.get('symbol','').upper()})",
                "platform": "coingecko",
                "type": "trending",
                "url": f"https://www.coingecko.com/en/coins/{item.get('id','')}",
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
                "summary": f"Market cap rank #{item.get('market_cap_rank','?')}. Price: ${item.get('price_btc',0):.8f} BTC. Trending on CoinGecko.",
                "source": "CoinGecko"
            })
        return results
    except Exception as e:
        print(f"CoinGecko failed: {e}")
        return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"CoinGecko: {len(data)} items")
