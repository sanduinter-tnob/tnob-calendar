const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const ical = require('ical-generator').default;

const cal = new ical({ name: 'TNOB Opera & Balet' });


async function run() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  const res = await axios.get(url);
  const dom = new JSDOM(res.data);
  const doc = dom.window.document;

  const rows = doc.querySelectorAll(".calendar-item");

  rows.forEach((r) => {
    const date = r.querySelector(".date")?.textContent.trim();
    const time = r.querySelector(".hour")?.textContent.trim();
    const title = r.querySelector(".title")?.textContent.trim();

    if (!date || !title) return;

    const [day, mon] = date.split(".").map((x) => parseInt(x));
    const [h, m] = time?.split(":").map((x) => parseInt(x)) ?? [19, 0];

    const start = new Date(year, mon - 1, day, h, m);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    cal.createEvent({
      start,
      end,
      summary: title,
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
}

run();
