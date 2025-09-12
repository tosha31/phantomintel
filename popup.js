const byId = (id) => document.getElementById(id);
const resultsCard = byId("results");
const set = (id, text) => (byId(id).textContent = text);

byId("scanBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "scanResults") {
      const { cms, pixel, esp } = msg.data;
      byId("cms").textContent = cms;
      byId("pixel").textContent = pixel ? "✅ Yes" : "❌ No";
      byId("esp").textContent = esp;
      resultsCard.classList.remove("hidden");
    }
  });
  

// —— Quick intel links ——
const domainFromInputOrTab = async () => {
  const manual = byId("domainInput").value.trim();
  if (manual) return manual.replace(/^https?:\/\//, "").split("/")[0];

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    return url.hostname.replace(/^www\./, "");
  } catch { return ""; }
};

byId("openMeta").addEventListener("click", async () => {
  const domain = await domainFromInputOrTab();
  const q = domain ? encodeURIComponent(domain) : "";
  const url = q
    ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${q}`
    : `https://www.facebook.com/ads/library/`;
  chrome.tabs.create({ url });
});

byId("openGoogle").addEventListener("click", async () => {
    const domain = await domainFromInputOrTab();
    const url = "https://adstransparency.google.com/";
    chrome.tabs.create({ url });
  });
  
  
  

byId("openLinkedIn").addEventListener("click", async () => {
  const domain = await domainFromInputOrTab();
  const query = domain || "";
  const url = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
  chrome.tabs.create({ url });
});
