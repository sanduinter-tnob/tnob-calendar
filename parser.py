import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

URL = "https://www.tnob.md/ro/calendar/2-2026"

res = requests.get(URL, timeout=30)
soup = BeautifulSoup(res.text, "html.parser")

events = []

for day in soup.select(".oneDay"):
    date_block = day.select_one(".date p")
    if not date_block:
        continue

    date_text = date_block.text.strip()
    day_num, month_name = date_text.split()

    months = {
        "Ianuarie": 1, "Februarie": 2, "Martie": 3,
        "Aprilie": 4, "Mai": 5, "Iunie": 6,
        "Iulie": 7, "August": 8, "Septembrie": 9,
        "Octombrie": 10, "Noiembrie": 11, "Decembrie": 12
    }

    month = months[month_name]
    date_iso = datetime(2026, month, int(day_num)).strftime("%Y-%m-%d")

    time_text = day.select_one(".date span").text.replace("ora", "").strip()
    title = day.select_one(".big").text.strip()

    events.append({
        "title": title,
        "date": date_iso,
        "time": time_text,
        "totalDuration": 180,
        "language": "original",
        "subtitles": "ro"
    })

with open("events.json", "w", encoding="utf-8") as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print("events.json created:", len(events))
