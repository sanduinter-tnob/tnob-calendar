const puppeteer = require("puppeteer");
const ical = require("ical-generator");
const fs = require("fs");

(async () => {
  const cal = ical({ name: "TNOB Opera & Balet" });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  await page.goto(url, { waitUntil: "networkidle0" });

  // Ищем все спектакли
  const events = await page.$$eval("a[href*='/spectacole/']", nodes =>
    nodes.map(n => {
      const parent = n.closest("div");
      const text = parent ? parent.textContent : "";
      return { title: n.textContent.trim(), text };
    })
  );

  events.forEach(e => {
    const dateMatch = e.text.match(/(\d{2}\.\d{2}\.\d{4})/);
    const timeMatch = e.text.match(/(\d{2}:\d{2})/);

    if (!dateMatch) return;

    const [day, mon, yr] = dateMatch[1].split(".").map(Number);
    const [h, m] = timeMatch ? timeMatch[1].split(":").map(Number) : [19, 0];

    const start = new Date(yr, mon - 1, day, h, m);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    cal.createEvent({
      start,
      end,
      summary: e.title,
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
  await browser.close();
  console.log("calendar.ics generated ✅");
})();
