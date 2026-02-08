import puppeteer from 'puppeteer';
import ical from 'ical-generator';
import fs from 'fs';

const URL = 'https://www.tnob.md/ro/calendar/2-2026';

const MONTHS = {
  Ianuarie: 0,
  Februarie: 1,
  Martie: 2,
  Aprilie: 3,
  Mai: 4,
  Iunie: 5,
  Iulie: 6,
  August: 7,
  Septembrie: 8,
  Octombrie: 9,
  Noiembrie: 10,
  Decembrie: 11,
};

(async () => {
  console.log('Open:', URL);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const events = await page.evaluate(() => {
    const result = [];

    const dateBlocks = document.querySelectorAll('.date');

    dateBlocks.forEach(dateBlock => {
      const aboutBlock = dateBlock.nextElementSibling;
      if (!aboutBlock || !aboutBlock.classList.contains('about')) return;

      const dateText = dateBlock.querySelector('p')?.textContent.trim(); // "13 Februarie"
      const timeRaw = dateBlock.querySelector('span')?.textContent;     // "ora 18:30"
      if (!dateText || !timeRaw) return;

      const timeMatch = timeRaw.match(/\d{2}:\d{2}/);
      if (!timeMatch) return;

      const time = timeMatch[0];

      const title = aboutBlock.querySelector('p.title')?.textContent.trim();
      const link = aboutBlock.querySelector('a')?.href;

      result.push({ dateText, time, title, link });
    });

    return result;
  });

  console.log('FOUND EVENTS:', events.length);
  console.log(events);

  const calendar = ical({ name: 'TNOB Opera & Ballet' });

  events.forEach(ev => {
    const [dayStr, monthName] = ev.dateText.split(' ');
    const day = parseInt(dayStr, 10);
    const month = MONTHS[monthName];

    const [hour, minute] = ev.time.split(':').map(Number);

    const start = new Date(2026, month, day, hour, minute);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    calendar.createEvent({
      start,
      end,
      summary: ev.title,
      description: ev.link,
      location: 'TNOB Chișinău',
    });
  });

  fs.writeFileSync('tnob.ics', calendar.toString());
  console.log('Calendar generated ✅');

  await browser.close();
})();
