import fs from "fs";
import ical from "ical-generator";

const url = "https://www.tnob.md/ro/calendar/2-2026";

console.log("Open:", url);

const html = await fetch(url).then(r => r.text());

const events = [];

const dayBlocks = html.split('<div class="oneDay">');

dayBlocks.forEach(block => {
  if (!block.includes('class="big"')) return;

  const dateMatch = block.match(/<p>(\d+)\s+([A-Za-zăâîșțĂÂÎȘȚ]+)<\/p>/);
  const timeMatch = block.match(/ora<\/span>\s*(\d{2}):(\d{2})/);
  const titleMatch = block.match(/class="big">([^<]+)</);

  if (!dateMatch || !timeMatch || !titleMatch) return;

  const day = parseInt(dateMatch[1]);
  const monthName = dateMatch[2].toLowerCase();
  const hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);
  const title = titleMatch[1].trim();

  const months = {
    ianuarie: "01",
    februarie: "02",
    martie: "03",
    aprilie: "04",
    mai: "05",
    iunie: "06",
    iulie: "07",
    august: "08",
    septembrie: "09",
    octombrie: "10",
    noiembrie: "11",
    decembrie: "12"
  };

  const month = months[monthName];
  if (!month) return;

  events.push({ day, month, hour, minute, title });
});

console.log("FOUND EVENTS:", events.length);

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const dateString = `2026-${ev.month}-${String(ev.day).padStart(2, "0")}T${String(ev.hour).padStart(2, "0")}:${String(ev.minute).padStart(2, "0")}:00`;

  cal.createEvent({
    start: new Date(dateString),
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

console.log("Calendar generated ✅");
