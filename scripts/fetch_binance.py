#!/usr/bin/env python3
import requests, json, os, re
from datetime import datetime, timezone

OUTPUT = "data/binance.json"
URL = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=49&pageNo=1&pageSize=50"

def fetch():
    try:
        r = requests.get(URL, headers={"User-Agent":"Mozilla/5.0"}, timeout=30)
        r.raise_for_status()
        data = r.json()
        catalogs = data.get("data", {}).get("catalogs", [])
        articles = catalogs[0].get("articles", []) if catalogs else []
        results = []
        for a in articles:
            title = a.get("title", "")
            code = a.get("code", "")
            ts = a.get("releaseDate", 0)
            t = "announcement"
            tl = title.lower()
            if "will list" in tl or "lists" in tl: t = "listing"
            elif "delist" in tl: t = "delisting"
            elif "launchpool" in tl: t = "launchpool"
            elif "airdrop" in tl: t = "airdrop"
            elif "monitoring tag" in tl: t = "monitoring"
            dt = datetime.fromtimestamp(ts/1000, tz=timezone.utc).isoformat().replace("+00:00","Z") if ts else datetime.now(timezone.utc).isoformat().replace("+00:00","Z")
            results.append({"id":f"binance_{code}","title":title,"platform":"binance","type":t,"url":f"https://www.binance.com/en/support/announcement/{code}","timestamp":dt,"summary":f"Binance: {title}","source":"Binance"})
        return results
    except Exception as e:
        print(f"Binance API failed: {e}, trying web scrape...")
        try:
            r = requests.get("https://www.binance.com/en/support/announcement", headers={"User-Agent":"Mozilla/5.0"}, timeout=30)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, 'html.parser')
            items = []
            for link in soup.find_all('a', href=re.compile(r'/en/support/announcement/'))[:20]:
                title = link.get_text(strip=True)
                href = link.get('href', '')
                if title and href:
                    items.append({"id":f"binance_scrape_{len(items)}","title":title,"platform":"binance","type":"announcement","url":f"https://www.binance.com{href}","timestamp":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"summary":f"Binance announcement: {title}","source":"Binance"})
            return items
        except Exception as e2:
            print(f"Binance scrape also failed: {e2}")
            return []

if __name__ == "__main__":
    data = fetch()
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f: json.dump(data, f, indent=2)
    print(f"Binance: {len(data)} items")
