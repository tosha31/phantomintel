(function () {
    // CMS detection heuristics (lightweight; no network calls)
    const html = document.documentElement.innerHTML;
    const has = (s) => html.toLowerCase().includes(s);
  
    let cms = "Unknown";
    if (document.querySelector('meta[name="generator"][content*="WordPress"]') || has("wp-content/")) {
      cms = "WordPress";
    } else if (window.Shopify || has("cdn.shopify.com") || has("shopify.theme")) {
      cms = "Shopify";
    } else if (has("wix.com") || has("wixapps.net") || has("wixstatic.com")) {
      cms = "Wix";
    } else if (has("drupal-settings-json") || has("drupal.js")) {
      cms = "Drupal";
    } else if (has(".php") && !has("wp-content/")) {
      cms = "Custom PHP (heuristic)";
    }
  
    // Meta Pixel
    const pixel = !!window.fbq || !!document.querySelector("script[src*='connect.facebook.net'][src*='fbevents.js']");
  
    // ESPs
    const klaviyo =
      !!document.querySelector("script[src*='klaviyo']") ||
      has("klaviyo.com") ||
      !!document.querySelector("script[src*='static.klaviyo.com']");
    const mailchimp =
      !!document.querySelector("script[src*='mcjs']") ||
      has("list-manage.com") ||
      has("mailchimp.com");
  
    chrome.runtime.sendMessage({
      type: "scanResults",
      data: { cms, pixel, klaviyo, mailchimp }
    });
  })();
  