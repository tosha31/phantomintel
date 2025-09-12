(function () {
 // CMS detection
let cms = "Unknown";
const html = document.documentElement.innerHTML.toLowerCase();
const has = (s) => html.includes(s);

if (
  document.querySelector('meta[name="generator"][content*="WordPress"]') ||
  has("wp-content/") ||
  has("wp-includes/")
) {
  cms = "WordPress";
} else if (window.Shopify || has("cdn.shopify.com") || has("shopify.theme")) {
  cms = "Shopify";
} else if (has("wix.com") || has("wixstatic.com") || has("wixapps.net")) {
  cms = "Wix";
} else if (has("drupal-settings-json") || has("drupal.js") || has("drupal.org")) {
  cms = "Drupal";
} else if (document.querySelector("script[src*='hs-scripts']") || has("hsforms.net") || has("hubspot.com")) {
  cms = "HubSpot CMS";
} else if (has("squarespace.com") || has("sqspcdn.com") || has("sqs-layout")) {
  cms = "Squarespace";
} else if (has("godaddy.com") || has("websitebuilder.godaddy.com")) {
  cms = "GoDaddy Website Builder";
} else if (has("joomla") || document.querySelector('meta[name="generator"][content*="Joomla"]')) {
  cms = "Joomla";
} else if (has("magento") || has("mage/cookies.js") || has("mage-cache")) {
  cms = "Magento/Adobe Commerce";
} else if (has("bigcommerce") || has("cdn.bigcommerce.com")) {
  cms = "BigCommerce";
} else if (has("weebly") || has("weeblycloud.com")) {
  cms = "Weebly";
} else if (has(".php") && !has("wp-content/") && !has("joomla")) {
  cms = "Custom PHP (heuristic)";
}

  
    // Meta Pixel
    const pixel = !!window.fbq || !!document.querySelector("script[src*='connect.facebook.net'][src*='fbevents.js']");
  
    // ESPs
   // ESP detection
let esp = "None";

if (
  document.querySelector("script[src*='klaviyo']") ||
  document.body.innerHTML.includes("klaviyo.com") ||
  document.querySelector("script[src*='static.klaviyo.com']")
) {
  esp = "Klaviyo";
} else if (
  document.querySelector("script[src*='mcjs']") ||
  document.body.innerHTML.includes("list-manage.com") ||
  document.body.innerHTML.includes("mailchimp.com")
) {
  esp = "Mailchimp";
} else if (
  document.querySelector("script[src*='sendgrid']") ||
  document.body.innerHTML.includes("sendgrid.com")
) {
  esp = "SendGrid";
} else if (
  document.querySelector("script[src*='hs-analytics']") ||
  document.querySelector("script[src*='hs-scripts']") ||
  document.body.innerHTML.includes("hsforms.net") ||
  document.body.innerHTML.includes("hubspot.com")
) {
  esp = "HubSpot";
} else if (
  document.querySelector("script[src*='activehosted']") ||
  document.body.innerHTML.includes("activecampaign.com")
) {
  esp = "ActiveCampaign";
}

chrome.runtime.sendMessage({
  type: "scanResults",
  data: { cms, pixel, esp }
});

}());