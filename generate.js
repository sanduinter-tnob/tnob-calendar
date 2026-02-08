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
  const data = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dateBlock = day.querySelector(".date");
    const aboutBlocks = day.querySelectorAll(".about");

    if (!dateBlock) return;

    const dateText = dateBlock.querySelector("p")?.innerText.trim(); // 13 Februarie
    const timeText = dateBlock.querySelector("span")?.innerText.trim(); // ora 18:30

    if (!dateText || !timeText) return;

    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return;

    const [_, hour, minute] = timeMatch;

    aboutBlocks.forEach(about => {
      const title = about.querySelector(".big")?.innerText.trim();
      if (!title) return;

      data.push({
        title,
        dateText,
        hour,
        minute
      });
    });
  });

  return data;
});

console.log("FOUND EVENTS:", events.length);
console.log(events);

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

const cal = ical({ name: "TNOB Opera & Balet" });

events.forEach(ev => {
  const parts = ev.dateText.toLowerCase().split(" ");
  const day = parseInt(parts[0]);
  const monthName = parts[1];

  const monthIndex = months[monthName];
  if (monthIndex === undefined) return;

  const date = new Date(year, monthIndex, day, ev.hour, ev.minute);

  cal.createEvent({
    start: date,
    summ
