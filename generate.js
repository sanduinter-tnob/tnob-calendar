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

await page.goto(url, { waitUntil: "networkidle2" });
await page.waitForSelector(".oneDay", { timeout: 15000 });

const events = await page.evaluate(() => {
  const days = document.querySelectorAll(".oneDay");
  const data = [];

  days.forEach(day => {
    const dateText = day.querySelector(".date")?.innerText.trim();
    const shows = day.querySelectorAll(".about");

    shows.forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();
      if (dateText && title) {
        data.push({ dateText, title });
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
  const text = ev.dateText.replace(/\n/g, " ").toLowerCase();

  // пример текста: "1 februarie ora 17:00"
  const match = text.match(/(\d+)\s+([a-zăâîșț]+).*?(\d+):(\d+)/);
  if (!match) {
    console.log("DATE PARSE FAIL:", text);
    return;
  }

  const [_, day, monthName, hour, minute] = match;
  const monthIndex = months[monthName];

  if (monthIndex === undefined) {
    console.log("UNKNOWN MONTH:", monthName);
    return;
  }

  const date = new Date(year, monthIndex, Number(day), Number(hour), Number(minute));

  cal.createEvent({
    start: date,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();
