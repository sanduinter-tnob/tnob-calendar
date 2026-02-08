import fs from "fs";
import ical from "ical-generator";

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const url = `https://www.tnob.md/ro/calendar/${month}-${year}?ajax=1`;
console.log("Fetch:", url);

const res = await fetch(url);
const html = await res.text();

const events = [];

const dayRegex = /<div class="oneDay">([\s\S]*?)<\/div>\s*<\/div>/g;
let match;

while ((match = dayRegex.exec(html)) !== null) {
  const block = match[1];

  const dateMatch = block.match(/<p>(\d+)\s+([A-Za-zăâîșț]+)<\/p>/i);
  const timeMatch = block.match(/ora\s*(\d{1,2}):(\d{2})/i);
  const titleMatch = block.match(/class="big">([^<]+)</i);

  if (!dateMatch || !timeMatch || !titleMatch) continue;

  const day = parseInt(dateMatch[1]);
  const monthName = dateMatch[2].toLowerCase();
  const hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);
  const title = titleMatch[1].trim();

  events.push({ day, monthName, hour, minute, title });
}

console.log("FOUND EVENTS:", events.length);
console.log(events);

const months = {
  ianuarie: 0,
  februarie: 1,
  martie: 2,
  aprilie: 3,
  mai: 4,
  iunie: 5,
  iulie: 6,
  august: 7,
  septembrie: 8,
  octombrie: 9,
  noiembrie: 10,
  decembrie: 11
};

const cal = ical({ name: "TNOB Opera & Balet" });

events.forEach(ev => {
  const monthIndex = months[ev.monthName];
  if (monthIndex === undefined) return;

  const date = new Date(year, monthIndex, ev.day, ev.hour, ev.minute);

  cal.createEvent({
    start: date,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

console.log("Calendar generated ✅");
