#!/usr/bin/env python3
import requests, json, os
from datetime import datetime, timezone

OUTPUT = "data/snapshot.json"

def fetch():
    try:
        query = """
        query {
          proposals(first: 20, where: {state: "active"}, orderBy: "created", orderDirection: desc) {
            id
            title
            body
            state
            space { id name }
            start
            end
          }
        }
        """
        r = requests.post("https://hub.snapshot.org/graphql", json={"query": query}, headers={"Content-Type":"application/json"}, timeout=30)
        r.raise_for_status()
        data = r.json()
        proposals = data.get("data", {}).get("proposals", [])
        results = []
        for p in proposals:
            results.append({
                "id": f"snapshot_{p.get('id','')[:30]}",
                "title": f"[{p.get('space',{}).get('name','DAO')}] {p.get('title','Proposal')[:80]}",
                "platform": "snapshot",
                "type": "governance",
                "url": f"https://snapshot.org/#/{p.get('space',{}).get('id','')}/proposal/{p.get('id','')}",
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
                "summary": f"Governance vote by {p.get('space',{}).get('name','DAO')}. State: {p.get('state','active')}. {p.get('body','')[:150]}...",
                "source": "Snapshot",
                "space": p.get("space", {}).get("name", "Unknown"),
                "state": p.get("state", "active")
            })
        return results
    except Exception as e:
        print(f"Snapshot failed: {e}")
        return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"Snapshot: {len(data)} items")
