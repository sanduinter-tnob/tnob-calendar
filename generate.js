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

// Ждём, пока календарь загрузится
await page.waitForSelector(".oneDay", { timeout: 15000 });

const events = await page.evaluate(() => {
  const days = document.querySelectorAll(".oneDay");
  const data = [];

  days.forEach(day => {
    const dateText = day.querySelector(".date p")?.innerText.trim();
    const timeText = day.querySelector(".date .clock")?.nextSibling?.textContent.trim();
    const shows = day.querySelectorAll(".about");

    shows.forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();
      if (dateText && title) {
        let [dayNum, monthName] = dateText.split(" ");
        let hour = 18; // default
        let minute = 0;

        if (timeText) {
          const match = timeText.match(/(\d+):(\d+)/);
          if (match) {
            hour = parseInt(match[1], 10);
            minute = parseInt(match[2], 10);
          }
        }

        data.push({
          title,
          day: parseInt(dayNum, 10),
          monthName: monthName.toLowerCase(),
          hour,
          minute
        });
      }
    });
  });

  return data;
}));

console.log("FOUND EVENTS:", events.length);
console.log(events);

const monthsMap = {
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

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

events.forEach(ev => {
  const monthIndex = monthsMap[ev.monthName];
  if (!monthIndex) return;

  // Формируем строку в формате ICS с TZID
  const start = `${year}${String(monthIndex).padStart(2,"0")}${String(ev.day).padStart(2,"0")}T${String(ev.hour).padStart(2,"0")}${String(ev.minute).padStart(2,"0")}00`;

  cal.createEvent({
    start,
    timezone: "Europe/Chisinau",
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();

console.log("Calendar generated ✅");
