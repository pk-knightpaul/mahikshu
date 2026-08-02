#!/usr/bin/env python3
import json, os
from datetime import datetime, timezone

OUTPUT = "data/meta.json"

def main():
    meta = {
        "last_update": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "version": "3.0.0",
        "sources": ["binance", "coingecko", "dexscreener", "news", "defillama", "fear_greed", "snapshot"]
    }
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Meta updated: {meta['last_update']}")

if __name__ == "__main__":
    main()
