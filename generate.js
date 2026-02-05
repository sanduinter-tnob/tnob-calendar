const fs = require("fs");
const ical = require("ical-generator").default;
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // вычисляем текущий месяц и год
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  console.log("Open:", url);

  await page.goto(url, { waitUntil: "networkidle2" });

  const events = await page.evaluate(() => {
    const rows = document.querySelectorAll(".views-row");
    const data = [];

    rows.forEach(row => {
      const title = row.querySelector(".views-field-title")?.innerText.trim();
      const dateText = row.querySelector(".date-display-single")?.innerText.trim();

      if (title && dateText) {
        data.push({ title, dateText });
      }
    });

    return data;
  });

  console.log(events);

  const cal = ical({ name: "TNOB Opera & Balet" });

  events.forEach(ev => {
    // пример даты: 14 februarie 2026 - 18:00
    const match = ev.dateText.match(/(\d+)\s+(\w+)\s+(\d+)\s*-\s*(\d+):(\d+)/);

    if (!match) return;

    const [_, day, monthName, year, hour, minute] = match;

    const months = {
      ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
      mai: 4, iunie: 5, iulie: 6, august: 7,
      septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
    };

    const date = new Date(year, months[monthName.toLowerCase()], day, hour, minute);

    cal.createEvent({
      start: date,
      summary: ev.title,
      description: "TNOB Opera & Balet\nhttps://www.tnob.md",
      location: "Teatrul Național de Operă și Balet, Chișinău"
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());

  await browser.close();
})();
