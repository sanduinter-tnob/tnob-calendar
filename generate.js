import fs from "fs";
import ical from "ical-generator";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

// текущий месяц и год
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
console.log("Open:", url);

await page.goto(url, { waitUntil: "networkidle2" });

const events = await page.evaluate(() => {
  const rows = document.querySelectorAll(".views-row");
  const data = [];

  rows.forEach(row => {
    const title = row.querySelector(".views-field-title")?.innerText.trim();
    const dateText = row.querySelector(".date-display-single")?.innerText.trim();

    if (title && dateText) {
      data.push({ title, dateText });
    }
  });

  return data;
});

console.log(events);

const cal = ical({ name: "TNOB Opera & Balet" });

const months = {
  ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
  mai: 4, iunie: 5, iulie: 6, august: 7,
  septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
};

events.forEach(ev => {
  const match = ev.dateText.match(/(\d+)\s+(\w+)\s+(\d+)\s*-\s*(\d+):(\d+)/);
  if (!match) return;

  const [, day, monthName, y, hour, minute] = match;

  const date = new Date(
    Number(y),
    months[monthName.toLowerCase()],
    Number(day),
    Number(hour),
    Number(minute)
  );

  cal.createEvent({
    start: date,
    summary: ev.title,
    description: "TNOB Opera & Balet\nhttps://www.tnob.md",
    location: "Teatrul Național de Operă și Balet, Chișinău"
  });
});

fs.writeFileSync("calendar.ics", cal.toString());

await browser.close();
