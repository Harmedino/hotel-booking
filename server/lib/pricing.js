const env = require('../config/env');

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round(n * 100) / 100;

function nightsBetween(checkIn, checkOut) {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / DAY_MS);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function quote({ pricePerNight, nights, percentOff = 0 }) {
  const subtotal = round2(pricePerNight * nights);
  const discount = round2((subtotal * percentOff) / 100);
  const taxes = round2((subtotal - discount) * env.taxRate);
  const total = round2(subtotal - discount + taxes);
  return { pricePerNight, nights, subtotal, discount, taxes, total, taxRate: env.taxRate, percentOff };
}

module.exports = { nightsBetween, todayIso, quote, round2 };
