import ical from 'ical-generator';
import fs from 'fs';

const cal = ical({ name: "TNOB Opera & Balet" });

cal.createEvent({
  start: new Date(),
  end: new Date(new Date().getTime() + 60 * 60 * 1000),
  summary: "Test event TNOB",
  description: "Calendar works!",
  location: "Chisinau TNOB"
});

fs.writeFileSync('calendar.ics', cal.toString());
