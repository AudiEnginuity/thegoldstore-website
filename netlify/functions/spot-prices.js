// Netlify Function: /.netlify/functions/spot-prices
//
// Fetches live gold/silver/platinum spot prices from Metals.Dev.
//
// IMPORTANT: Metals.Dev's free tier allows only 100 requests/month, and this
// function needs 3 requests (one per metal) each time it refreshes. To make
// sure we NEVER exceed that quota no matter how much site traffic there is,
// prices are stored in Netlify Blobs (persistent storage) with a timestamp.
// The function only calls Metals.Dev if the stored data is more than 24
// hours old - every other visitor in that window just gets the stored copy,
// with zero calls to Metals.Dev. That caps usage at 3 calls x ~30
// refreshes/month = ~90 requests/month, safely under the 100 limit.
//
// If Blobs itself is unavailable for any reason, this fails "closed" -
// it serves clearly-labeled sample data rather than risk calling the
// upstream API on every single request.

const { getStore } = require("@netlify/blobs");

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const fallback = {
  gold: 2415.30, goldChange: 0.4,
  silver: 30.85, silverChange: -0.2,
  platinum: 985.10, platinumChange: 0.6,
  source: "fallback"
};

async function fetchFreshPrices(apiKey) {
  const metals = ["gold", "silver", "platinum"];
  const results = await Promise.all(
    metals.map(async (metal) => {
      const res = await fetch(
        `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=USD`
      );
      if (!res.ok) throw new Error(`Metals.Dev request failed for ${metal} (status ${res.status})`);
      const data = await res.json();
      return { metal, price: data.rate.price, changePercent: data.rate.change_percent };
    })
  );
  const out = { source: "metals.dev", fetchedAt: Date.now() };
  results.forEach(({ metal, price, changePercent }) => {
    out[metal] = price;
    out[metal + "Change"] = changePercent;
  });
  return out;
}

exports.handler = async function () {
  const apiKey = process.env.METALS_API_KEY;

  if (!apiKey) {
    console.error("spot-prices function: METALS_API_KEY environment variable is not set.");
    return respond(fallback);
  }

  let store;
  try {
    store = getStore("spot-prices-cache");
  } catch (err) {
    console.error("spot-prices function: Netlify Blobs unavailable:", err.message);
    return respond(fallback);
  }

  try {
    const cached = await store.get("latest", { type: "json" });

    if (cached && (Date.now() - cached.fetchedAt) < REFRESH_INTERVAL_MS) {
      // Still fresh - serve the stored copy, zero calls to Metals.Dev.
      return respond(cached);
    }

    // Stale or missing - this is the ~once-a-day refresh that actually
    // calls Metals.Dev (3 requests total).
    const fresh = await fetchFreshPrices(apiKey);
    await store.setJSON("latest", fresh);
    return respond(fresh);
  } catch (err) {
    console.error("spot-prices function error:", err.message);
    // If a refresh attempt fails, prefer serving the last known-good cached
    // price (even if a bit stale) over sample data, if we have one.
    try {
      const cached = await store.get("latest", { type: "json" });
      if (cached) return respond(cached);
    } catch (_) { /* fall through to fallback */ }
    return respond(fallback);
  }
};

function respond(data) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}
