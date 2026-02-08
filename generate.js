import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

const months = {
  ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
  mai: 4, iunie: 5, iulie: 6, august: 7,
  septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
};

(async () => {
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

  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  await page.waitForSelector(".about", { timeout: 20000 });

  const events = await page.evaluate(() => {
    const data = [];

    document.querySelectorAll(".oneDay").forEach(day => {
      const dateBlock = day.querySelector(".date");
      const shows = day.querySelectorAll(".about");

      if (!dateBlock) return;

      const dateText = dateBlock.querySelector("p")?.innerText.trim();
      const rawTime = dateBlock.querySelector("span")?.innerText.trim();

      // из "ora 18:30" делаем "18:30"
      const timeMatch = rawTime.match(/(\d{1,2}:\d{2})/);
      const timeText = timeMatch ? timeMatch[1] : null;

      shows.forEach(show => {
        const title = show.querySelector(".big")?.innerText.trim();
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

  events.forEach(ev => {
  if (!ev.dateText || !ev.timeText) return; // <-- добавлено

  const [dayStr, monthName] = ev.dateText.toLowerCase().split(" ");
  const [hourStr, minuteStr] = ev.timeText.replace(/[^\d:]/g,"").split(":");

  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const monthIndex = months[monthName];
  if (monthIndex === undefined) return;

  const date = new Date(Date.UTC(year, monthIndex, day, hour - 2, minute));

  cal.createEvent({
    start: date,
    summary: ev.title,
    location: "Teatrul Național de Operă și Balet, Chișinău",
    description: "https://www.tnob.md"
  });
});


  fs.writeFileSync("calendar.ics", cal.toString());
  console.log("Calendar generated ✅");

  await browser.close();
})();
