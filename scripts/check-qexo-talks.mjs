const targets = [
  {
    name: "Qexo upstream",
    url: "https://small-tan.vercel.app/pub/talks/?page=1&limit=10",
  },
  {
    name: "Supabase proxy",
    url: "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/qexo-talks-proxy?page=1&limit=10",
  },
];

let failed = false;

for (const target of targets) {
  console.log(`\n=== ${target.name} ===`);
  console.log(target.url);
  try {
    const response = await fetch(target.url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SmallJia-Qexo-Diagnostics/1.0",
      },
      redirect: "follow",
    });

    console.log("HTTP", response.status, response.statusText);
    console.log("content-type:", response.headers.get("content-type"));
    console.log("access-control-allow-origin:", response.headers.get("access-control-allow-origin"));

    const text = await response.text();
    console.log("body-preview:", text.slice(0, 3000));

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      console.error("JSON parse failed:", error.message);
      failed = true;
      continue;
    }

    if (!response.ok || payload?.status !== true || !Array.isArray(payload?.data)) {
      console.error("Invalid talks response shape");
      failed = true;
      continue;
    }

    console.log("count:", payload.count);
    console.log("returned:", payload.data.length);
    console.log(
      "latest:",
      payload.data.slice(0, 5).map((talk) => ({
        id: talk?.id,
        time: talk?.time,
        contentLength: String(talk?.content ?? "").length,
        contentPreview: String(talk?.content ?? "").slice(0, 120),
        valueKeys: talk?.values && typeof talk.values === "object" ? Object.keys(talk.values) : [],
        values: talk?.values && typeof talk.values === "object" ? talk.values : {},
      }))
    );
  } catch (error) {
    console.error("Request failed:", error);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
