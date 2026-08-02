#!/usr/bin/env python3
import requests, json, os
from datetime import datetime, timezone

OUTPUT = "data/defillama.json"

def fetch():
    try:
        r = requests.get("https://yields.llama.fi/pools", timeout=30)
        r.raise_for_status()
        data = r.json()
        pools = data.get("data", [])[:20]
        results = []
        for p in pools:
            if p.get("apy", 0) > 5:
                results.append({
                    "id": f"defillama_{p.get('pool','')[:30]}",
                    "title": f"High Yield: {p.get('symbol','')} on {p.get('project','')}",
                    "platform": "defillama",
                    "type": "high_yield",
                    "url": f"https://defillama.com/yields",
                    "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
                    "summary": f"APY: {p.get('apy',0):.2f}% | TVL: ${p.get('tvlUsd',0)/1e6:.1f}M | Chain: {p.get('chain','?')} | Pool: {p.get('pool','')[:40]}...",
                    "source": "DeFiLlama",
                    "apy": round(p.get("apy", 0), 2),
                    "tvl": p.get("tvlUsd", 0),
                    "chain": p.get("chain", "unknown")
                })
        return results
    except Exception as e:
        print(f"DeFiLlama failed: {e}")
        return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"DeFiLlama: {len(data)} items")
