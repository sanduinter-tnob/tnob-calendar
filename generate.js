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
  start: date,
  end: endDate,
  summary: title,
  location: "Teatrul Național de Operă și Balet, Chișinău",
  description: description,
  timezone: "Europe/Chisinau"
});

});

fs.writeFileSync("calendar-tnob.ics", cal.toString());
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

