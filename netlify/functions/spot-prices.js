// Netlify Function: /.netlify/functions/spot-prices
//
// Fetches live gold/silver/platinum spot prices from Metals.Dev and returns
// them in the shape the ticker on the site expects. The API key lives only
// here, as a Netlify environment variable (METALS_API_KEY) - it is never
// sent to the browser.
//
// The Cache-Control header tells Netlify's CDN to cache this response for
// 4 hours and keep serving that cached copy while quietly refreshing it in
// the background. That means no matter how much traffic the site gets, the
// upstream API only gets called a handful of times a day - comfortably
// inside any free tier.

exports.handler = async function () {
  const apiKey = process.env.METALS_API_KEY;

  const fallback = {
    gold: 2415.30, goldChange: 0.4,
    silver: 30.85, silverChange: -0.2,
    platinum: 985.10, platinumChange: 0.6,
    source: "fallback"
  };

  if (!apiKey) {
    // No key configured yet - serve clearly-labeled fallback data instead of failing.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallback)
    };
  }

  try {
    const metals = ["gold", "silver", "platinum"];
    const results = await Promise.all(
      metals.map(async (metal) => {
        const res = await fetch(
          `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=USD`
        );
        if (!res.ok) throw new Error(`Metals.Dev request failed for ${metal}`);
        const data = await res.json();
        return { metal, price: data.rate.price, changePercent: data.rate.change_percent };
      })
    );

    const out = { source: "metals.dev" };
    results.forEach(({ metal, price, changePercent }) => {
      out[metal] = price;
      out[metal + "Change"] = changePercent;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=86400"
      },
      body: JSON.stringify(out)
    };
  } catch (err) {
    // If the upstream API has an issue, fail gracefully with fallback data
    // rather than showing a broken ticker.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallback)
    };
  }
};
