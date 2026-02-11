import fs from "fs";
import puppeteer from "puppeteer";
import ical from "ical-generator";

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

const url = "https://www.tnob.md/ro/calendar/";
console.log("Open:", url);

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

await page.waitForSelector(".oneDay");

const events = await page.evaluate(() => {
  const data = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dateEl = day.querySelector(".date p");
    const timeEl = day.querySelector(".date span");
    const titleEl = day.querySelector(".big");

    if (!dateEl || !timeEl || !titleEl) return;

    const dateText = dateEl.innerText.trim();      // 13 Februarie
    const timeText = timeEl.innerText.trim();      // ora 18:30
    const title = titleEl.innerText.trim();

    data.push({ dateText, timeText, title });
  });

  return data;
});

console.log("FOUND EVENTS:", events.length);

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

for (const ev of events) {
  const [dayStr, monthStr] = ev.dateText.split(" ");
  const day = parseInt(dayStr);
  const month = months[monthStr.toLowerCase()];

  const timeMatch = ev.timeText.match(/(\d+):(\d+)/);
  if (!timeMatch) continue;

  const hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);

  const now = new Date();
  const year = now.getFullYear();

  const start = new Date(year, month, day, hour, minute);

  cal.createEvent({
    start,
    end: new Date(start.getTime() + 3 * 60 * 60 * 1000),
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
}

fs.writeFileSync("calendar-tnob.ics", cal.toString());

await browser.close();

console.log("Calendar generated ✅");
