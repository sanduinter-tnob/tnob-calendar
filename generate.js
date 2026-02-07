import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

(async () => {
  // Запускаем браузер в GitHub Actions без sandbox
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Текущий месяц и год
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  console.log("Open:", url);

  // Открываем страницу и ждём, пока TNOB дорисует календарь
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(".oneDay", { timeout: 15000 });

  // Считываем все события
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

  // Создаём календарь
  const cal = ical({ name: "TNOB Opera & Balet" });

  // Месяцы для преобразования текста
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

  // Генерируем события
  events.forEach(ev => {
    const text = ev.dateText.replace(/\n/g, " ").toLowerCase();

    // Пример текста TNOB: "1 februarie ora 17:00"
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

  // Сохраняем .ics
  fs.writeFileSync("calendar.ics", cal.toString());

  await browser.close();
})();
