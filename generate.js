import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
console.log("Open:", url);

await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

// ждём отрисовку календаря
await page.waitForSelector(".oneDay", { timeout: 20000 });

const events = await page.evaluate(() => {
  const monthMap = {
    ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
    mai: 4, iunie: 5, iulie: 6, august: 7,
    septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
  };

  const result = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dateBlock = day.querySelector(".date")?.innerText.toLowerCase();

    if (!dateBlock) return;

    const dateMatch = dateBlock.match(/(\d+)\s+([a-zăâîșț]+)/);
    if (!dateMatch) return;

    const dayNum = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2];
    const monthIndex = monthMap[monthName];

    day.querySelectorAll(".about").forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();
      const timeText = show.querySelector(".subtitle")?.innerText.trim();

      if (!title || !timeText) return;

      const timeMatch = timeText.match(/(\d+):(\d+)/);
      if (!timeMatch) return;

      const hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);

      result.push({
        title,
        day: dayNum,
        month: monthIndex,
        hour,
        minute
      });
    });
  });

  return result;
});

console.log("FOUND EVENTS:", events.length);
console.log(events);

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const date = new Date(year, ev.month, ev.day, ev.hour, ev.minute);

  cal.createEvent({
    start: date,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: url
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();

console.log("Calendar generated ✅");
