const fs = require('fs');
const { google } = require('googleapis');

const events = JSON.parse(fs.readFileSync('events.json', 'utf8'));

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

function createDateTime(dateStr, timeStr, durationMinutes) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const start = new Date(year, month - 1, day, hour, minute);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  return { start, end };
}

async function addEvent(eventData) {
  const { start, end } = createDateTime(
    eventData.date,
    eventData.time,
    eventData.totalDuration
  );

  const event = {
    summary: eventData.title,
    description:
      `Language: ${eventData.language}\n` +
      `Subtitles: ${eventData.subtitles}\n` +
      `Duration: ${eventData.totalDuration} min`,
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Chisinau' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Chisinau' },
  };

  await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  console.log(`Added: ${eventData.title}`);
}

async function run() {
  for (const ev of events) {
    await addEvent(ev);
  }
}

run();
