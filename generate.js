import fs from "fs";
import ical from "ical-generator";

const year = 2026;
const month = 2; // февраль

const html = fs.readFileSync("calendar.html", "utf8");

// -------- парсим события из HTML --------
const eventRegex = /<div class="date">[\s\S]*?<p>(\d+)\s+Februarie<\/p>[\s\S]*?ora<\/span>\s*(\d{2}):(\d{2})[\s\S]*?<a href="([^"]+)">[\s\S]*?<p class="big">([^<]+)<\/p>/g;

let match;
const events = [];

while ((match = eventRegex.exec(html)) !== null) {
  events.push({
    day: parseInt(match[1]),
    hour: parseInt(match[2]),
    minute: parseInt(match[3]),
    link: match[4],
    title: match[5]
  });
}

console.log("FOUND EVENTS:", events.length);

// -------- создаём календарь --------
const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const start = `${year}-${String(month).padStart(2,'0')}-${String(ev.day).padStart(2,'0')}T${String(ev.hour).padStart(2,'0')}:${String(ev.minute).padStart(2,'0')}:00`;

  cal.createEvent({
    start,
    duration: { hours: 2 },
    summary: ev.title,
    url: ev.link,
    timezone: "Europe/Chisinau"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());
console.log("Calendar generated ✅");
