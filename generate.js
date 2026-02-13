import fs from "fs";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

function localDate(y, m, d, h, min) {
  return `${y}${String(m).padStart(2,"0")}${String(d).padStart(2,"0")}T${String(h).padStart(2,"0")}${String(min).padStart(2,"0")}`;
}

// Пример данных, у тебя они приходят из парсера
const events = [
  {
    title: "MACBETH",
    year: 2026,
    month: 2,
    day: 13,
    hour: 18,
    minute: 30,
    durationMin: 225, // 3ч45м
    language: "italiană",
    pauses: "2 x ~20 min",
    video: "https://synology/tnob/macbeth-13-02.mp4"
  }
];

events.forEach(ev => {
  const start = localDate(ev.year, ev.month, ev.day, ev.hour, ev.minute);

  const endDate = new Date(ev.year, ev.month-1, ev.day, ev.hour, ev.minute);
  endDate.setMinutes(endDate.getMinutes() + ev.durationMin);

  const end = localDate(
    endDate.getFullYear(),
    endDate.getMonth()+1,
    endDate.getDate(),
    endDate.getHours(),
    endDate.getMinutes()
  );

  cal.createEvent({
    start: start,
    end: end,
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
