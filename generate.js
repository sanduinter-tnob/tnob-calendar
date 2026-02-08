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

    const dateText = dateBlock.querySelector("p")?.innerTe
