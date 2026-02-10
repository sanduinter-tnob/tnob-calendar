import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";
import { DateTime } from "luxon";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  const now = DateTime.now().setZone("Europe/Chisinau");
  const month = now.month;
  const year = now.year;

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  console.log("Open:", url);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".oneDay", { timeout: 20000 });

  const events = await page.evaluate(() => {
    const months = {
      ianuarie: 1, februarie: 2, martie: 3, aprilie: 4,
      mai: 5, iunie: 6, iulie: 7, august: 8,
      septembrie: 9, octombrie: 10, noiembrie: 11, decembrie: 12
    };

    const data = [];

    document.querySelectorAll(".oneDay").forEach(day => {
      const dateEl = day.querySelector(".date p");
      const timeEl = day.querySelector(".date span");
      const titleEl = day.querySelector(".big");

      if (!dateEl || !titleEl || !timeEl) return;

      const title = titleEl.innerText.trim();

      const dateText = dateEl.innerText.trim().toLowerCase(); // "13 februarie"
      const timeText = timeEl.innerText.trim();               // "ora 18:30"

      const d = dateText.match(/(\d+)\s+([a-zăâîșț]+)/);
      const t = timeText.match(/(\d{1,2}):(\d{2})/);

      if (!d || !t) return;

      const dayNum = parseInt(d[1]);
      const monthName = d[2];
      const hour = parseInt(t[1]);
      const minute = parseInt(t[2]);

      const monthNum = months[monthName];
      if (!monthNum) return;

      data.push({
        title,
        day: dayNum,
        month: monthNum,
        hour,
        minute
      });
    });

    return data;
  });

  console.log("FOUND EVENTS:", events.length);

  const cal = ical({
    name: "TNOB Opera & Balet",
    timezone: "Europe/Chisinau"
  });

  events.forEach(ev => {
    const dt = DateTime.fromObject(
      {
        year,
        month: ev.month,
        day: ev.day,
        hour: ev.hour,
        minute: ev.minute
      },
      { zone: "Europe/Chisinau" }
    );

    cal.createEvent({
      start: dt.toJSDate(),
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
