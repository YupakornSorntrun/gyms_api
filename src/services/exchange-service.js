// services/exchange-service.js
const { fetchWithRetry } = require("./external-api");

// เก็บอัตราล่าสุดที่เรียกสำเร็จ ไว้ใช้เป็น fallback ชั้นที่ 1
const lastKnownRates = new Map();

// คืนค่าเสมอ ไม่ throw:
//   { ok: true,  rate, source: "external" }  เรียก API สำเร็จ
//   { ok: true,  rate, source: "cache" }     API ล้มเหลว แต่เคยได้อัตราไว้แล้ว
//   { ok: false, rate: null, source: "fallback" }  API ล้มเหลวและไม่มีข้อมูลเก่า
//   { ok: false, unknownCurrency: true }     API ตอบสำเร็จแต่ไม่มีสกุลเงินนี้
async function getExchangeRate(currency) {
  const target = currency.toUpperCase();
  const url = process.env.EXCHANGE_API_URL || "http://localhost:4000";

  try {
    const data = await fetchWithRetry(url, 3000, 2);

    const rate = data && data.rates && data.rates[target];
    if (typeof rate !== "number") {
      return { ok: false, rate: null, source: "external", unknownCurrency: true };
    }

    lastKnownRates.set(target, rate);
    return { ok: true, rate, source: "external" };
  } catch (error) {
    console.error(
      `[exchange-service] external API unavailable after retries: ${error.message}`,
    );

    if (lastKnownRates.has(target)) {
      return { ok: true, rate: lastKnownRates.get(target), source: "cache" };
    }
    return { ok: false, rate: null, source: "fallback" };
  }
}

module.exports = { getExchangeRate };
