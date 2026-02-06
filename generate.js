const fs = require("fs");
const ical = require("ical-generator").default;
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  console.log("Open:", url);

  await page.goto(url, { waitUntil: "networkidle2" });

  const events = await page.evaluate(() => {
    const days = document.querySelectorAll(".oneDay");
    const data = [];

    days.forEach(day => {
      const dateText = day.querySelector(".date")?.innerText.trim();
      const title = day.querySelector(".about .big")?.innerText.trim();

      if (dateText && title) {
        data.push({ dateText, title });
      }
    });

    return data;
  });

  console.log(events);

  const cal = ical({ name: "TNOB Opera & Balet" });

  events.forEach(ev => {
    // пример dateText: 14.02.2026 18:00
    const match = ev.dateText.match(/(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+)/);
    if (!match) return;

    const [_, day, month, year, hour, minute] = match;
    const date = new Date(year, month - 1, day, hour, minute);

    cal.createEvent({
      start: date,
      summary: ev.title,
      location: "Teatrul Național de Operă și Balet, Chișinău",
      description: "https://www.tnob.md"
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
  await browser.close();
})();
