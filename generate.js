import fs from "fs";
import ical from "ical-generator";
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const url = `https://www.tnob.md/ro/calendar/${month}-${year}?ajax=1`;
console.log("Fetch:", url);

const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

const html = await res.text();

// Парсим HTML без браузера
const events = [];

const dayRegex = /oneDay([\s\S]*?)<\/div>\s*<\/div>/g;
let dayMatch;

while ((dayMatch = dayRegex.exec(html)) !== null) {
  const block = dayMatch[1];

  const dayMatchNum = block.match(/class="date">(\d+)/);
  if (!dayMatchNum) continue;

  const day = parseInt(dayMatchNum[1], 10);

  const showRegex = /class="about"([\s\S]*?)<\/div>\s*<\/div>/g;
  let showMatch;

  while ((showMatch = showRegex.exec(block)) !== null) {
    const showBlock = showMatch[1];

    const titleMatch = showBlock.match(/class="big">([^<]+)/);
    const timeMatch = showBlock.match(/ora (\d+):(\d+)/);

    if (!titleMatch || !timeMatch) continue;

    events.push({
      title: titleMatch[1].trim(),
      day,
      hour: parseInt(timeMatch[1], 10),
      minute: parseInt(timeMatch[2], 10)
    });
  }
}

console.log("FOUND EVENTS:", events);

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const date = new Date(Date.UTC(year, month - 1, ev.day, ev.hour, ev.minute));


  cal.createEvent({
    start: date,
    summary: ev.title,
  });
});


fs.writeFileSync("calendar.ics", cal.toString());

console.log("Calendar generated ✅");
