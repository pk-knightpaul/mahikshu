#!/usr/bin/env python3
"""
Update meta.json with last_updated timestamp and platform status.
"""
import json
import os
from datetime import datetime, timezone

DATA_DIR = "data"
OUTPUT_FILE = "data/meta.json"

def update_meta():
    platforms = ["binance", "coingecko", "dexscreener", "news"]
    status = {}

    for platform in platforms:
        filepath = os.path.join(DATA_DIR, f"{platform}.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                status[platform] = "ok" if isinstance(data, list) else "error"
            except:
                status[platform] = "error"
        else:
            status[platform] = "missing"

    meta = {
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "platforms_status": status
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"Updated meta.json: {meta['last_updated']}")

if __name__ == "__main__":
    update_meta()
