const $ = (id) => document.getElementById(id);
const resultsCard = $("results");
const rowIds = ["row-cms", "row-pixel", "row-esp", "row-analytics", "row-ads"];

// -------- Scan Current Site --------
$("scanBtn").addEventListener("click", async () => {
  resultsCard.classList.remove("hidden");
  resultsCard.classList.add("scanning");
  rowIds.forEach((id) => $(id)?.classList.remove("show"));
  resultsCard.dataset.scanStart = String(Date.now());

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    // 1) inject the base detectors (CMS/ESP/Pixel/Analytics)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch (e) {
    console.error("[PhantomIntel] inject content.js failed:", e);
  }

  try {
    // 2) inject Google Ads detector separately (safe to fail)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["detectors/googleAds.js"],
    });
  } catch (e) {
    console.warn("[PhantomIntel] inject googleAds.js failed (continuing):", e);
    // If it fails, we’ll leave "—" in the UI for the Ads row.
  }
});

// -------- Base results listener (from content.js) --------
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "scanResults") return;
  const { cms, pixel, esp, analytics } = msg.data;

  $("cms").textContent = cms || "Unknown";
  $("esp").textContent = esp || "None";
  $("analytics").textContent = analytics || "None";

  const pixelEl = $("pixel");
  pixelEl.textContent = pixel ? "YES" : "NO";
  pixelEl.classList.remove("badge-yes", "badge-no");
  pixelEl.classList.add(pixel ? "badge-yes" : "badge-no");

  // finish after a short minimum scan time; we’ll still allow Ads to update later
  const minScanMs = 700;
  const started = Number(resultsCard.dataset.scanStart || Date.now());
  const delay = Math.max(0, minScanMs - (Date.now() - started));

  setTimeout(() => {
    const stepMs = 140;
    rowIds.forEach((id, i) => setTimeout(() => $(id)?.classList.add("show"), i * stepMs));
    resultsCard.classList.remove("scanning");
  }, delay);
});

// -------- Google Ads results listener (from detectors/googleAds.js) --------
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "googleAdsResults") return;
  const { text } = msg.data || {};
  $("gads").textContent = text || "—";

  // Reveal the Ads row immediately
  $("row-ads")?.classList.add("show"); // <-- fixed (no "#")
  // Optional debug:
  // console.log("[PhantomIntel] googleAdsResults:", msg.data);
});

// -------- Quick Links --------
async function getHostname() {
  const manual = $("domainInput")?.value?.trim();
  if (manual) {
    try { return new URL(manual.startsWith("http") ? manual : "https://" + manual).hostname.replace(/^www\./, ""); }
    catch { return manual.replace(/^https?:\/\//, "").split("/")[0]; }
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new URL(tab.url).hostname.replace(/^www\./, "");
  } catch { return ""; }
}

$("openMeta").addEventListener("click", async () => {
  const host = await getHostname();
  const base = "https://www.facebook.com/ads/library/";
  const url = host
    ? `${base}?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(host)}&search_type=keyword`
    : base;
  chrome.tabs.create({ url });
});

$("openGoogle").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://adstransparency.google.com/" });
});

$("openLinkedIn").addEventListener("click", async () => {
  const host = await getHostname();
  const url = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(host)}`;
  chrome.tabs.create({ url });
});
