import fs from "fs";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

const events = [
  {
    title: "MACBETH",
    year: 2026,
    month: 2,
    day: 13,
    hour: 18,
    minute: 30,
    durationMin: 225,
    language: "italiană",
    pauses: "2 x ~20 min",
    video: "https://synology/tnob/macbeth-13-02.mp4"
  }
];

events.forEach(ev => {
  const start = new Date(ev.year, ev.month - 1, ev.day, ev.hour, ev.minute);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + ev.durationMin);

  cal.createEvent({
    start: start,
    end: end,
    timezone: "Europe/Chisinau",   // ⭐ ВОТ ЭТО РЕШАЕТ ВСЁ
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description:
`Durata: ${Math.floor(ev.durationMin/60)}h ${ev.durationMin%60}m (cu pauze)
Limba: ${ev.language}
Pauze: ${ev.pauses}
Video: ${ev.video}`
  });
});

fs.writeFileSync("calendar-tnob.ics", cal.toString());
