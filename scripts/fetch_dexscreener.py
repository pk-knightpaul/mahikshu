#!/usr/bin/env python3
import requests, json, os
from datetime import datetime, timezone

OUTPUT = "data/dexscreener.json"

def fetch():
    try:
        r = requests.get("https://api.dexscreener.com/token-profiles/latest/v1", headers={"User-Agent":"Mozilla/5.0"}, timeout=30)
        r.raise_for_status()
        data = r.json()
        results = []
        for item in data[:20]:
            results.append({
                "id": f"dexscreener_{item.get('tokenAddress','')[:20]}",
                "title": f"New Pair: {item.get('description','Token')[:60]}",
                "platform": "dexscreener",
                "type": "new_pair",
                "url": item.get("url", "https://dexscreener.com"),
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
                "summary": f"Chain: {item.get('chainId','?')} | Token: {item.get('tokenAddress','')[:20]}... | New DEX pair detected.",
                "source": "DexScreener",
                "chain": item.get("chainId", "unknown")
            })
        return results
    except Exception as e:
        print(f"DexScreener failed: {e}")
        return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"DexScreener: {len(data)} items")
