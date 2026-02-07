import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";
import { DateTime } from "luxon";

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

await page.goto(url, { waitUntil: "networkidle2" });

// Ждём, пока TNOB дорисует календарь через JS
await page.waitForSelector(".oneDay", { timeout: 15000 });

const events = await page.evaluate(() => {
  const days = document.querySelectorAll(".oneDay");
  const data = [];

  days.forEach(day => {
    const dateText = day.querySelector(".date")?.innerText.trim();
    const shows = day.querySelectorAll(".about");

    shows.forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();
      const timeText = show.querySelector(".ora")?.innerText.trim(); // читаем текстовое время

      if (dateText && title && timeText) {
        data.push({ dateText, title, timeText });
      }
    });
  });

  return data;
});

console.log("FOUND EVENTS:", events.length);
console.log(events);

const cal = ical({ name: "TNOB Opera & Balet", timezone: "Europe/Chisinau" });

const months = {
  ianuarie: 1,
  februarie: 2,
  martie: 3,
  aprilie: 4,
  mai: 5,
  iunie: 6,
  iulie: 7,
  august: 8,
  septembrie: 9,
  octombrie: 10,
  noiembrie: 11,
  decembrie: 12
};

events.forEach(ev => {
  // пример ev.dateText: "Vineri\n13\nFebruarie"
  const dayMatch = ev.dateText.match(/(\d{1,2})/);
  const monthMatch = ev.dateText.match(/([a-zăâîșț]+)/i);
  const timeMatch = ev.timeText.match(/(\d{1,2}):(\d{2})/);

  if (!dayMatch || !monthMatch || !timeMatch) {
    console.log("SKIP EVENT (cannot parse):", ev);
    return;
  }

  const day = Number(dayMatch[1]);
  const monthName = monthMatch[1].toLowerCase();
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const monthNumber = months[monthName];
  if (!monthNumber) {
    console.log("UNKNOWN MONTH:", monthName);
    return;
  }

  const date = DateTime.fromObject(
    { year, month: monthNumber, day, hour, minute },
    { zone: "Europe/Chisinau" }
  ).toJSDate();

  cal.createEvent({
    start: date,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();
console.log("Calendar generated ✅");
