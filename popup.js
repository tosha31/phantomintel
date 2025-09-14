const $ = (id) => document.getElementById(id);
const resultsCard = $("results");
const rowIds = ["row-cms", "row-pixel", "row-esp", "row-analytics"];

// -------- Scan Current Site --------
$("scanBtn").addEventListener("click", async () => {
  // show card + scanning overlay
  resultsCard.classList.remove("hidden");
  resultsCard.classList.add("scanning");

  // hide rows so we can reveal them after results land
  rowIds.forEach((id) => $(id)?.classList.remove("show"));

  // mark start time so we can hold the scanning effect for a minimum duration
  resultsCard.dataset.scanStart = String(Date.now());

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});

// -------- Listen for results --------
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "scanResults") return;

  const { cms, pixel, esp, analytics } = msg.data;

  // fill values immediately
  $("cms").textContent = cms || "Unknown";
  $("esp").textContent = esp || "None";
  $("analytics").textContent = analytics || "None";

  // Pixel badge
  const pixelEl = $("pixel");
  pixelEl.textContent = pixel ? "YES" : "NO";
  pixelEl.classList.remove("badge-yes", "badge-no");
  pixelEl.classList.add(pixel ? "badge-yes" : "badge-no");

  // keep scanning overlay visible at least a short beat so the effect is noticeable
  const minScanMs = 700; // tweak: 600–1000ms feels good
  const started = Number(resultsCard.dataset.scanStart || Date.now());
  const delay = Math.max(0, minScanMs - (Date.now() - started));

  setTimeout(() => {
    // reveal rows top→bottom with a small stagger
    const stepMs = 140;
    rowIds.forEach((id, i) => {
      setTimeout(() => $(id)?.classList.add("show"), i * stepMs);
    });

    resultsCard.classList.remove("scanning");
  }, delay);
});

// -------- Quick Links (Meta, Google, LinkedIn) --------
async function getHostname() {
  const manual = $("domainInput")?.value?.trim();
  if (manual) {
    try {
      return new URL(manual.startsWith("http") ? manual : "https://" + manual)
        .hostname.replace(/^www\./, "");
    } catch {
      return manual.replace(/^https?:\/\//, "").split("/")[0];
    }
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new URL(tab.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

$("openMeta").addEventListener("click", async () => {
  const host = await getHostname();
  const base = "https://www.facebook.com/ads/library/";
  // Force sensible defaults; domain search can be flaky but this is the best generic link
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
