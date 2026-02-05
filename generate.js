const puppeteer = require("puppeteer");
const ical = require("ical-generator");
const fs = require("fs");

const cal = ical({ name: "TNOB Opera & Balet" });

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  await page.goto(url, { waitUntil: "networkidle2" });

  const events = await page.evaluate(() => {
    const list = [];
    const anchors = document.querySelectorAll("a[href*='/spectacole/']");
    anchors.forEach((a) => {
      const parent = a.closest("div");
      const text = parent.innerText;

      const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
      const timeMatch = text.match(/(\d{2}:\d{2})/);

      if (!dateMatch) return;

      list.push({
        title: a.innerText.trim(),
        date: dateMatch[1],
        time: timeMatch ? timeMatch[1] : "19:00",
      });
    });
    return list;
  });

  events.forEach((e) => {
    const [day, mon, yr] = e.date.split(".").map(Number);
    const [h, m] = e.time.split(":").map(Number);

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
})();
