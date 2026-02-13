import fs from "fs";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet"
});

const events = [
  {
    title: "MACBETH",
    year: 2026,
    month: 2,
    day: 13,
    hour: 18,
    minute: 30,
    durationMin: 225
  }
];

events.forEach(ev => {
  const start = new Date(ev.year, ev.month - 1, ev.day, ev.hour, ev.minute);
  const end = new Date(start.getTime() + ev.durationMin * 60000);

  cal.createEvent({
    start: start,
    end: end,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md",
    floating: true
  });
});

fs.writeFileSync("calendar-tnob.ics", cal.toString());
