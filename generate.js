import fs from "fs";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet"
});

// пример события после парсинга
const events = [
  {
    title: "MACBETH",
    day: 13,
    month: 2,
    year: 2026,
    hour: 18,
    minute: 30,
    durationMin: 225, // 3ч45м с паузами
    language: "Italiană",
    pauses: "2 pauze a câte ~20 min",
    link: "https://www.tnob.md/ro/repertory/opera/macbeth"
  }
];

events.forEach(ev => {
  const start = new Date(ev.year, ev.month - 1, ev.day, ev.hour, ev.minute);
  const end = new Date(start.getTime() + ev.durationMin * 60000);

  cal.createEvent({
    start,
    end,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description:
`${ev.link}

Durata: ${Math.floor(ev.durationMin/60)}h ${ev.durationMin%60}m
Pauze: ${ev.pauses}
Limba operei: ${ev.language}`,
    floating: true
  });
});

fs.writeFileSync("calendar-tnob.ics", cal.toString());
