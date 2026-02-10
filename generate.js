import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

async function main() {
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

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  } catch (err) {
    console.error("Navigation timeout:", err.message);
    await browser.close();
    return;
  }

  // Ждём, пока календарь дорисуется
  try {
    await page.waitForSelector(".oneDay", { timeout: 15000 });
  } catch (err) {
    console.error("No calendar loaded:", err.message);
    await browser.close();
    return;
  }

  // Собираем события
  const events = await page.evaluate(() => {
    const months = {
      ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
      mai: 4, iunie: 5, iulie: 6, august: 7,
      septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
    };

    const days = Array.from(document.querySelectorAll(".oneDay"));
    const data = [];

    days.forEach(day => {
      const dateEl = day.querySelector(".date p");
      const clockEl = day.querySelector(".clock");
      const timeText = clockEl ? clockEl.nextSibling.textContent.trim() : null;

      const showEl = day.querySelector(".big");
      if (!dateEl || !showEl) return;

      const title = showEl.innerText.trim();

      // Дата
      const dateText = dateEl.innerText.trim().toLowerCase(); // "13 februarie"
      const dateMatch = dateText.match(/(\d+)\s+([a-zăâîșț]+)/);
      if (!dateMatch) return;

      const dayNum = parseInt(dateMatch[1]);
      const monthName = dateMatch[2];
      const monthNum = months[monthName];
      if (monthNum === undefined) return;

      // Время
      let hour = 18, minute = 0; // дефолтное время, если нет
      if (timeText) {
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          hour = parseInt(timeMatch[1]);
          minute = parseInt(timeMatch[2]);
        }
      }

      const dateObj = new Date();
      dateObj.setFullYear(new Date().getFullYear());
      dateObj.setMonth(monthNum);
      dateObj.setDate(dayNum);
      dateObj.setHours(hour);
      dateObj.setMinutes(minute);
      dateObj.setSeconds(0);
      dateObj.setMilliseconds(0);

      data.push({
        title,
        date: dateObj
      });
    });

    return data;
  });

  console.log("FOUND EVENTS:", events.length);

  // Генерация календаря
  const cal = ical({ name: "TNOB Opera & Balet", timezone: "Europe/Chisinau" });

  events.forEach(ev => {
    cal.createEvent({
      start: ev.date,
      summary: ev.title,
      location: "Teatrul Național de Operă și Balet, Chișinău",
      description: "https://www.tnob.md"
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
  console.log("Calendar generated ✅");

  await browser.close();
}

main().catch(err => console.error(err));
