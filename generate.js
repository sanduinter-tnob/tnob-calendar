import fs from "fs";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

// Evenimentele tale (vor veni din parser ulterior)
const events = [
  {
    title: "MACBETH",
    link: "https://www.tnob.md/ro/repertory/opera/macbeth",
    year: 2026,
    month: 2,
    day: 13,
    hour: 18,
    minute: 30,
    durationMin: 225
  }
];

// -------- PARSARE PAGINĂ SPECTACOL --------
async function getExtraInfo(url) {
  const res = await fetch(url);
  const html = await res.text();

  const durationMatch = html.match(/Durata spectacolului:[\s\S]*?<strong>(.*?)<\/strong>/i);
  const duration = durationMatch ? durationMatch[1].trim() : "";

  const languageMatch = html.match(/Opera se prezintă în[\s\S]*?<strong>(.*?)<\/strong>/i);
  const language = languageMatch ? languageMatch[1].trim() : "";

  const subtitlesMatch = html.match(/Subtitrare în[\s\S]*?<strong>(.*?)<\/strong>/i);
  const subtitles = subtitlesMatch ? subtitlesMatch[1].trim() : "";

  return { duration, language, subtitles };
}

// -------- CREARE CALENDAR --------
for (const ev of events) {
  const start = new Date(
    Date.UTC(ev.year, ev.month - 1, ev.day, ev.hour - 2, ev.minute)
  );

  const end = new Date(start.getTime() + ev.durationMin * 60000);

  const extra = await getExtraInfo(ev.link);

  const description =
    `Durata: ${extra.duration}\n` +
    (extra.language ? `Limba: ${extra.language}\n` : "") +
    (extra.subtitles ? `Subtitrare: ${extra.subtitles}\n` : "") +
    `\nBilete: ${ev.link}`;

  cal.createEvent({
    start,
    end,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description,
    timezone: "Europe/Chisinau"
  });
}

// -------- SALVARE ICS --------
fs.writeFileSync("calendar-tnob.ics", cal.toString());

console.log("Calendar generat cu info complete ✅");
