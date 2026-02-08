import { DateTime } from "luxon";
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

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

// ждём, пока календарь дорисуется JS-ом
await page.waitForSelector(".oneDay", { timeout: 20000 });

const events = await page.evaluate(() => {
  const data = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dateBlock = day.querySelector(".date");
    const aboutBlocks = day.querySelectorAll(".about");

    if (!dateBlock) return;

    const dateText = dateBlock.querySelector("p")?.innerText.trim(); // "13 Februarie"
    const timeText = dateBlock.querySelector(".clock")?.parentElement?.innerText
      .replace("ora", "")
      .trim(); // "18:30"

    aboutBlocks.forEach(about => {
      const title = about.querySelector(".big")?.innerText.trim();
      if (title && dateText && timeText) {
        data.push({ title, dateText, timeText });
      }
    });
  });

  return data;
});

console.log("FOUND EVENTS:", events.length);
console.log(events);

const cal = ical({ name: "TNOB Opera & Balet" });

const months = {
  ianuarie: 0,
  februarie: 1,
  martie: 2,
  aprilie: 3,
  mai: 4,
  iunie: 5,
  iulie: 6,
  august: 7,
  septembrie: 8,
  octombrie: 9,
  noiembrie: 10,
  decembrie: 11
};

events.forEach(ev => {
  const [dayStr, monthNameRaw] = ev.dateText.toLowerCase().split(" ");
  const [hourStr, minuteStr] = ev.timeText.split(":");

  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const monthName = monthNameRaw.trim();
  const monthIndex = months[monthName];

  if (monthIndex === undefined) return;

  const date = DateTime.fromObject(
  {
    year: year,
    month: monthIndex + 1,
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  },
  { zone: "Europe/Chisinau" }
).toJSDate();


  cal.createEvent({
  start: date,
  timezone: "Europe/Chisinau",
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();

console.log("Calendar generated ✅");
