(function () {
    // Grab both raw and lowercased HTML for flexible checks
    const rawHTML = document.documentElement.innerHTML || "";
    const html = rawHTML.toLowerCase();
    const has = (s) => html.includes(s.toLowerCase());
  
    // ===== CMS detection
    let cms = "Unknown";
  
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
    } else if (has("websitebuilder.godaddy.com") || has("godaddy.com")) {
      cms = "GoDaddy Website Builder";
    } else if (has("joomla") || document.querySelector('meta[name="generator"][content*="Joomla"]')) {
      cms = "Joomla";
    } else if (has("magento") || has("mage/cookies.js") || has("mage-cache")) {
      cms = "Magento/Adobe Commerce";
    } else if (has("bigcommerce") || has("cdn.bigcommerce.com")) {
      cms = "BigCommerce";
    } else if (has("weebly") || has("weeblycloud.com")) {
      cms = "Weebly";
    } else if (has("multiscreensite.com") || has("s.multiscreensite.com")) {
      cms = "Duda";
    } else if (
      document.querySelector("img[src*='cdn.sanity.io/'], source[srcset*='cdn.sanity.io/'], link[href*='cdn.sanity.io/'], script[src*='cdn.sanity.io/']") ||
      has("cdn.sanity.io/")
    ) {
      cms = "Sanity (headless)";
    } else if (has(".php") && !has("wp-content/") && !has("joomla")) {
      cms = "Custom PHP (heuristic)";
    }
  
    // ===== Meta Pixel (prefer script presence; fbq may be isolated)
    const pixel =
      !!document.querySelector("script[src*='connect.facebook.net'][src*='fbevents.js']") ||
      !!window.fbq;
  
    // ===== ESP detection (pick one for now)
    let esp = "None";
    if (
      document.querySelector("script[src*='klaviyo']") ||
      has("klaviyo.com") ||
      document.querySelector("script[src*='static.klaviyo.com']")
    ) {
      esp = "Klaviyo";
    } else if (
      document.querySelector("script[src*='mcjs']") ||
      has("list-manage.com") ||
      has("mailchimp.com")
    ) {
      esp = "Mailchimp";
    } else if (
      document.querySelector("script[src*='sendgrid']") ||
      has("sendgrid.com")
    ) {
      esp = "SendGrid";
    } else if (
      document.querySelector("script[src*='hs-analytics']") ||
      document.querySelector("script[src*='hs-scripts']") ||
      has("hsforms.net") ||
      has("hubspot.com")
    ) {
      esp = "HubSpot";
    } else if (
      document.querySelector("script[src*='activehosted']") ||
      has("activecampaign.com")
    ) {
      esp = "ActiveCampaign";
    }
  
    // ===== Analytics (GA4 / UA / GTM)
    let analytics = "None";
    const hasGA4 =
      !!document.querySelector("script[src*='gtag/js']") ||
      /G-[A-Z0-9]{6,}/i.test(rawHTML);         // use raw + /i so case doesn't matter
    const hasUA =
      !!document.querySelector("script[src*='analytics.js']") ||
      /UA-\d{4,}-\d+/i.test(rawHTML) ||
      has("ga('create'");
    const hasGTM =
      !!document.querySelector("script[src*='googletagmanager.com/gtm']") ||
      has("window.datalayer") ||
      has("datalayer =");
  
    if (hasGA4) {
      analytics = "Google Analytics 4";
    } else if (hasUA) {
      analytics = "Universal Analytics";
    } else if (hasGTM) {
      analytics = "Google Tag Manager";
    }
  
    // ===== Send results (include analytics!)
    chrome.runtime.sendMessage({
      type: "scanResults",
      data: { cms, pixel, esp, analytics }
    });
  })();
  