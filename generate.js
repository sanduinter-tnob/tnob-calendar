const puppeteer = require("puppeteer");
const ical = require("ical-generator");
const fs = require("fs");

const cal = ical({ name: "TNOB Opera & Balet" });

async function run() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  // Сбор всех спектаклей
  const events = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll("a[href*='/spectacole/']").forEach((el) => {
      const parent = el.closest("div");
      const text = parent ? parent.textContent : "";
      list.push({ title: el.textContent.trim(), text });
    });
    return list;
  });

  events.forEach(ev => {
    const dateMatch = ev.text.match(/(\d{2}\.\d{2}\.\d{4})/);
    const timeMatch = ev.text.match(/(\d{2}:\d{2})/);
    if (!dateMatch) return;

    const [day, mon, yr] = dateMatch[1].split(".").map(Number);
    const [h, m] = timeMatch ? timeMatch[1].split(":").map(Number) : [19, 0];

    const start = new Date(yr, mon - 1, day, h, m);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    cal.createEvent({
      start,
      end,
      summary: ev.title
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
  await browser.close();
}

run();
