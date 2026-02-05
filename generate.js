const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const ical = require("ical-generator").default;

const cal = ical({
  name: "TNOB Opera & Balet",
});

async function run() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url = `https://www.tnob.md/ro/calendar/${month}-${year}`;
  const res = await axios.get(url);
  const dom = new JSDOM(res.data);
  const doc = dom.window.document;

  const items = [...doc.querySelectorAll("a[href*='/spectacole/']")];

  items.forEach((item) => {
    const text = item.parentElement.textContent;

    const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
    const timeMatch = text.match(/(\d{2}:\d{2})/);

    if (!dateMatch) return;

    const [day, mon, yr] = dateMatch[1].split(".").map(Number);
    const [h, m] = timeMatch ? timeMatch[1].split(":").map(Number) : [19, 0];

    const start = new Date(yr, mon - 1, day, h, m);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    cal.createEvent({
      start,
      end,
      summary: item.textContent.trim(),
    });
  });

  fs.writeFileSync("calendar.ics", cal.toString());
}

run();
