import fs from "fs";
import puppeteer from "puppeteer";
import ical from "ical-generator";

const year = 2026;
const month = 2;

const cal = ical({
  name: "TNOB Opera & Balet",
  timezone: "Europe/Chisinau"
});

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

console.log("Open: https://www.tnob.md/ro/calendar/2-2026");

await page.goto("https://www.tnob.md/ro/calendar/2-2026", {
  waitUntil: "networkidle2",
  timeout: 0
});

// ждём пока точно появятся события
await page.waitForSelector(".oneDay", { timeout: 0 });

const events = await page.evaluate(() => {
  const result = [];
  const days = document.querySelectorAll(".oneDay");

  days.forEach(day => {
    const dateEl = day.querySelector(".date p");
    const timeEl = day.querySelector(".date span");
    const titleEl = day.querySelector(".big");
    const linkEl = day.querySelector(".about a");

    if (!dateEl || !timeEl || !titleEl) return;

    const dateText = dateEl.textContent.trim(); // "13 Februarie"
    const timeText = timeEl.textContent.trim(); // "ora 18:30"

    const dayNumber = parseInt(dateText.split(" ")[0]);

    const timeMatch = timeText.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) return;

    result.push({
      day: dayNumber,
      hour: parseInt(timeMatch[1]),
      minute: parseInt(timeMatch[2]),
      title: titleEl.textContent.trim(),
      link: linkEl ? linkEl.href : ""
    });
  });

  return result;
});

await browser.close();

console.log("FOUND EVENTS:", events.length);

events.forEach(ev => {
  const start = `${year}-${String(month).padStart(2,"0")}-${String(ev.day).padStart(2,"0")}T${String(ev.hour).padStart(2,"0")}:${String(ev.minute).padStart(2,"0")}:00`;

  cal.createEvent({
    start,
    duration: { hours: 2 },
    summary: ev.title,
    url: ev.link,
    timezone: "Europe/Chisinau"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

console.log("Calendar generated ✅");
