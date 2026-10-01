const env = require('../config/env');

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round(n * 100) / 100;

function nightsBetween(checkIn, checkOut) {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / DAY_MS);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

// Friday and Saturday nights.
const isWeekendNight = (iso) => [5, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay());

// The price of one night. A seasonal rate beats the weekend rate, which beats the base price.
function rateFor(room, date) {
  const season = (room.seasonalRates || []).find((s) => s.start <= date && date <= s.end);
  if (season) return { price: season.price, label: season.name };
  if (room.weekendPrice && isWeekendNight(date)) return { price: room.weekendPrice, label: 'Weekend' };
  return { price: room.pricePerNight, label: 'Standard' };
}

function nightlyRates(room, checkIn, checkOut) {
  const nights = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) nights.push({ date: d, ...rateFor(room, d) });
  return nights;
}

// "2 × Standard $120, 1 × Weekend $150": nights grouped by rate, in stay order.
function priceLines(nightly) {
  const lines = [];
  for (const n of nightly) {
    const line = lines.find((l) => l.label === n.label && l.price === n.price);
    if (line) line.nights += 1;
    else lines.push({ label: n.label, price: n.price, nights: 1 });
  }
  return lines;
}

// Either `nightly` (from nightlyRates) or a flat `pricePerNight` × `nights`.
function quote({ nightly, pricePerNight, nights, percentOff = 0 }) {
  const stay = nightly || Array.from({ length: nights }, () => ({ price: pricePerNight, label: 'Standard' }));
  const subtotal = round2(stay.reduce((sum, n) => sum + n.price, 0));
  const discount = round2((subtotal * percentOff) / 100);
  const taxes = round2((subtotal - discount) * env.taxRate);
  const total = round2(subtotal - discount + taxes);
  return {
    // The average when rates vary within the stay.
    pricePerNight: round2(subtotal / stay.length),
    nights: stay.length,
    lines: priceLines(stay),
    subtotal,
    discount,
    taxes,
    total,
    taxRate: env.taxRate,
    percentOff,
  };
}

module.exports = { nightsBetween, todayIso, addDays, rateFor, nightlyRates, priceLines, quote, round2 };
