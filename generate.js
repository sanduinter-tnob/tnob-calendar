import fs from "fs";
import ical from "ical-generator";

// Текущий месяц и год
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

// URL с AJAX, чтобы получить календарь без JS рендера
const url = `https://www.tnob.md/ro/calendar/${month}-${year}?ajax=1`;
console.log("Fetch:", url);

// Делаем fetch
const res = await fetch(url);
const html = await res.text();

// Собираем события
const events = [];

// Берём все блоки дней
const dayBlocks = html.match(/<div class="oneDay">[\s\S]*?<\/div>\s*<\/div>/g) || [];

for (const block of dayBlocks) {
  // Дата и время
  const dateMatch = block.match(
    /<div class="date">[\s\S]*?<p>(\d+)\s+([A-Za-zăâîșț]+)<\/p>[\s\S]*?<span class="clock">ora\s*(\d{1,2}):(\d{2})<\/span>/i
  );
  if (!dateMatch) continue;

  const [_, day, monthName, hour, minute] = dateMatch;

  // Название спектакля
  const titleMatch = block.match(/<div class="about">[\s\S]*?<p class="big">([^<]+)<\/p>/i);
  if (!titleMatch) continue;

  const title = titleMatch[1].trim();

  events.push({
    day: parseInt(day),
    monthName: monthName.toLowerCase(),
    hour: parseInt(hour),
    minute: parseInt(minute),
    title
  });
}

console.log("FOUND EVENTS:", events.length);
console.log(events);

// Соответствие месяцев
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

// Создаём календарь
const cal = ical({ name: "
