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

await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

// Ждём, пока календарь полностью дорисуется
await page.waitForSelector(".about", { timeout: 20000 });

const events = await page.evaluate(() => {
  const data = [];

  document.querySelectorAll(".oneDay").forEach(day => {
    const dateBlock = day.querySelector(".date");
    const showBlocks = day.querySelectorAll(".about");

    if (!dateBlock) return;

    const dateText = dateBlock.querySelector("p")?.innerText.trim(); // 13 Februarie
    const timeText = dateBlock.querySelector("span:last-child")?.innerText.trim(); // 18:30

    showBlocks.forEach(show => {
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

const months = {
  ianuarie: 0, februarie: 1, martie: 2, aprilie: 3,
  mai: 4, iunie: 5, iulie: 6, august: 7,
  septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
};

const cal = ical({ name: "TNOB Opera & Balet" });

events.forEach(ev => {
  const [day, monthName] = ev.dateText.toLowerCase().split(" ");
  const [hour, minute] = ev.timeText.split(":");

  const monthIndex = months[monthName];
  if (monthIndex === undefined) return;

  // ВАЖНО: создаём дату в локальной таймзоне Молдовы
  const date = new Date(Date.UTC(year, monthIndex, day, hour - 2, minute));

  cal.createEvent({
    start: date,
    summary: ev.
