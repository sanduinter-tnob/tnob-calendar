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

await page.goto(url, { waitUntil: "networkidle2" });
await page.waitForSelector(".oneDay", { timeout: 15000 });

const events = await page.evaluate(() => {
  const days = document.querySelectorAll(".oneDay");
  const data = [];

  // Словарь месяцев румынских
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

  days.forEach(day => {
    const dateText = day.querySelector(".date")?.innerText.trim();
    const shows = day.querySelectorAll(".about");

    shows.forEach(show => {
      const title = show.querySelector(".big")?.innerText.trim();

      if (dateText && title) {
        // Парсим дату и время прямо из текста, как видит человек
        // пример dateText: "Vineri\n13\nFebruarie\nora 18:30"
        const text = dateText.replace(/\n/g, " ").toLowerCase(); // "vineri 13 februarie ora 18:30"
        const match = text.match(/(\d+)\s+([a-zăâîșț]+).*?(\d+):(\d+)/);
        if (!match) return;

        const [_, dayNum, monthName, hour, minute] = match;

        // Создаём дату прямо в JS без конвертации UTC
        const date = new Date(
          new Date().getFullYear(),      // текущий год
          months[monthName],             // индекс месяца
          Number(dayNum),                // день
          Number(hour),                  // час
          Number(minute)                 // минуты
        );

        data.push({
          title,
          date
        });
      }
    });
  });

  return data;
});

console.log("FOUND EVENTS:", events.length);
console.log(events);

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

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
  const monthIndex = months[monthName.toLowerCase()];


  if (monthIndex === undefined) {
    console.log("UNKNOWN MONTH:", monthName);
    return;
  }

  const date = DateTime.fromObject(
  {
    year: Number(year),
    month: monthIndex + 1,
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute)
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

// записываем календарь после всех событий
fs.writeFileSync("calendar.ics", cal.toString());

// закрываем браузер в конце файла
await browser.close();
