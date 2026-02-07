import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

// Запускаем браузер без sandbox для GitHub Actions
const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

// Получаем текущий месяц и год
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

// URL календаря TNOB
const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
console.log("Open:", url);

await page.goto(url, { waitUntil: "networkidle2" });

// Ждём, пока календарь дорисуется
await page.waitForSelector(".oneDay", { timeout: 15000 });

// Парсим события
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

// Создаём календарь с указанием часового пояса (Europe/Chisinau)
const cal = ical({ name: "TNOB Opera & Balet", timezone: "Europe/Chisinau" });

// Словарь для месяцев на румынском
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

// Преобразуем дату из текста в объект Date
events.forEach(ev => {
  const text = ev.dateText.replace(/\n/g, " ").toLowerCase();

  // Пример: "14 februarie ora 18:00"
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

  // Создаём объект Date с часовым поясом локальной Молдовы
  const date = new Date(Date.UTC(year, monthIndex, Number(day), Number(hour) - 2, Number(minute))); 
  // -2 корректирует разницу UTC+2 для Молдовы зимой

  cal.createEvent({
    start: date,
    summary: ev.tit
