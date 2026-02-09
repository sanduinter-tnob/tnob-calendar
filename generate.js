import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

const now = new Date();
const month = now.getMonth(); // 0-11
const year = now.getFullYear();

const url = `https://www.tnob.md/ro/calendar/${month + 1}-${year}`;
console.log("Open:", url);

await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
await page.waitForSelector(".oneDay", { timeout: 20000 });

const events = await page.evaluate(() => {
  const result = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dayNum = parseInt(day.querySelector(".date")?.innerText.trim(), 10);

    day.querySelectorAll(".about").forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();
      const timeText = show.querySelector(".subtitle")?.innerText.trim();

      if (!title || !timeText || isNaN(dayNum)) return;

      const timeMatch = timeText.match(/(\d+):(\d+)/);
      if (!timeMatch) return;

      const hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);

      result.push({
        title,
        day: dayNum,
        hour,
        minute
      });
    });
  });

  return result;
});

console.log("FOUND EVENTS:", events);

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const date = new Date(year, month, ev.day, ev.hour, ev.minute);

  console.log("Creating:", ev.title, date);

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
