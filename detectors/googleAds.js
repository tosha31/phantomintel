// detectors/googleAds.js
(function () {
    const safeSend = (payload) => {
      try { 
        chrome.runtime.sendMessage({ type: "googleAdsResults", data: payload }); 
        console.log("[PhantomIntel] Google Ads result sent:", payload);
      }
      catch (e) { 
        console.log("[PhantomIntel] Failed to send Google Ads results:", e);
      }
    };

    console.log("[PhantomIntel] Google Ads detector starting...");
    
    function detectGoogleAds() {
      console.log("[PhantomIntel] Running Google Ads detection...");
      
      try {
        const rawHTML = document.documentElement?.innerHTML || document.body?.innerHTML || "";
        const url = window.location.href;
        const cookies = document.cookie || "";
        
        console.log("[PhantomIntel] Analyzing:", {
          url: url,
          htmlLength: rawHTML.length,
          hasCookies: cookies.length > 0
        });

        // === 1. Extract AW IDs and filter out test data ===
        const awMatches = rawHTML.match(/AW-\d{6,}/g) || [];
        const allAwIds = Array.from(new Set(awMatches));
        
        // Filter out common test/fake AW IDs
        const testAwIds = ['AW-1234567890', 'AW-9876543210', 'AW-0000000000', 'AW-1111111111', 'AW-5555444333', 'AW-9999888777'];
        const realAwIds = allAwIds.filter(id => !testAwIds.includes(id));
        
        console.log("[PhantomIntel] AW ID Analysis:", {
          allFound: allAwIds,
          afterFiltering: realAwIds,
          filtered: allAwIds.filter(id => testAwIds.includes(id))
        });

        // === 2. Script and Resource Detection ===
        let adsResources = [];
        let conversionCalls = [];
        let gtmResources = [];
        
        try {
          const resources = performance.getEntriesByType("resource") || [];
          
          adsResources = resources.filter(r => {
            const name = r.name.toLowerCase();
            return name.includes('googleads.g.doubleclick.net') || 
                   name.includes('googleadservices.com') ||
                   name.includes('googlesyndication.com');
          });
          
          conversionCalls = resources.filter(r => {
            const name = r.name.toLowerCase();
            return name.includes('pagead/conversion') || 
                   name.includes('1p-conversion') ||
                   name.includes('conversion_async');
          });
          
          gtmResources = resources.filter(r => {
            const name = r.name.toLowerCase();
            return name.includes('googletagmanager.com');
          });
          
        } catch (e) {
          console.log("[PhantomIntel] Performance API error:", e);
        }

        // === 3. HTML Pattern Analysis ===
        // Google gtag with AW (but exclude test page patterns)
        const gtagAwPattern = /gtag\/js\?id=AW-(\d{6,})/gi;
        const gtagMatches = [...rawHTML.matchAll(gtagAwPattern)];
        const gtagAwIds = gtagMatches.map(m => `AW-${m[1]}`).filter(id => !testAwIds.includes(id));
        
        // Conversion tracking patterns (excluding test data)
        const hasRealConversionId = /google_conversion_id['":\s]*(\d{6,})/i.test(rawHTML) && 
                                   !rawHTML.includes('1234567890') && !rawHTML.includes('5555444333');
        
        const hasRealSendTo = /send_to['":\s]*['"]AW-(\d{6,})/i.test(rawHTML) &&
                             realAwIds.length > 0;
        
        const hasGtagConfig = /gtag\s*\(\s*['"]config['"].*AW-(\d{6,})/i.test(rawHTML) &&
                             realAwIds.length > 0;
        
        // Other script patterns
        const hasConversionScript = /googleadservices\.com\/pagead\/conversion_async\.js/i.test(rawHTML);
        const hasGTMScript = /googletagmanager\.com\/gtm/i.test(rawHTML);
        const hasRemarketingPixel = /googleads\.g\.doubleclick\.net\/pagead\/viewthroughconversion/i.test(rawHTML);

        // === 4. Campaign Tracking ===
        const hasGclidParam = /[?&](gclid|gclsrc|dclid)=/i.test(url);
        const hasGclCookie = /_gcl_au|_gcl_aw|_gcl_dc|_gac_/.test(cookies);

        // === 5. Combine real AW IDs from all sources ===
        const combinedRealAwIds = Array.from(new Set([...realAwIds, ...gtagAwIds]));
        
        console.log("[PhantomIntel] Detection Summary:", {
          realAwIds: combinedRealAwIds,
          resources: { ads: adsResources.length, conversions: conversionCalls.length, gtm: gtmResources.length },
          patterns: { conversionId: hasRealConversionId, sendTo: hasRealSendTo, gtagConfig: hasGtagConfig },
          scripts: { conversion: hasConversionScript, gtm: hasGTMScript },
          tracking: { gclid: hasGclidParam, cookies: hasGclCookie }
        });

        // === 6. Realistic Scoring System ===
        let score = 0;
        let reasons = [];

        // Primary indicators - REAL AW IDs only
        if (combinedRealAwIds.length > 0) {
          score += 60;
          reasons.push(`Google Ads IDs: ${combinedRealAwIds.slice(0, 2).join(', ')}`);
        }

        // Live conversion activity
        if (conversionCalls.length > 0) {
          score += 40;
          reasons.push(`Active conversion calls (${conversionCalls.length})`);
        }

        // Configuration patterns with real data
        if (hasRealConversionId) {
          score += 35;
          reasons.push("Conversion ID configuration");
        }

        if (hasGtagConfig) {
          score += 30;
          reasons.push("Google gtag conversion setup");
        }

        if (hasRealSendTo) {
          score += 25;
          reasons.push("Conversion send_to configuration");
        }

        // Script presence
        if (hasConversionScript) {
          score += 20;
          reasons.push("Google Ads conversion script");
        }

        if (hasRemarketingPixel) {
          score += 20;
          reasons.push("Remarketing pixel detected");
        }

        // Supporting resources
        if (adsResources.length >= 2) {
          score += 15;
          reasons.push(`Google Ads resources (${adsResources.length})`);
        }

        if (hasGTMScript && gtmResources.length > 0) {
          score += 10;
          reasons.push("Google Tag Manager detected");
        }

        // Historical indicators (lower weight)
        if (hasGclCookie) {
          score += 8;
          reasons.push("Click tracking cookies");
        }

        if (hasGclidParam) {
          score += 5;
          reasons.push("Campaign URL parameters");
        }

        // === 7. Generate Realistic Results ===
        let text = "No indicators detected";
        let confidence = score;

        if (score >= 50 && combinedRealAwIds.length > 0) {
          const primaryAw = combinedRealAwIds[0];
          text = `Google Ads active (${primaryAw}) — ${Math.min(90, score + 10)}% confidence`;
        } else if (score >= 30) {
          text = `Google Ads likely — ${Math.min(75, score + 15)}% confidence`;
        } else if (score >= 15) {
          text = `Possible ads activity — ${Math.min(50, score + 10)}% confidence`;
        } else if (score > 0) {
          text = `Weak indicators — ${Math.min(25, score)}% confidence`;
        }

        // Special case: If we only found test IDs, report nothing
        if (allAwIds.length > 0 && combinedRealAwIds.length === 0) {
          text = "No indicators detected";
          confidence = 0;
          reasons = ["Only test data found"];
        }

        const result = {
          text,
          confidence,
          awId: combinedRealAwIds[0] || null,
          reasons,
          debug: {
            url: url.replace(/[?#].*/, ''), // Remove query params from debug
            allAwIds,
            realAwIds: combinedRealAwIds,
            testAwFiltered: allAwIds.filter(id => testAwIds.includes(id)),
            resourceCounts: { 
              ads: adsResources.length, 
              conversions: conversionCalls.length, 
              gtm: gtmResources.length 
            },
            patterns: { 
              hasRealConversionId, 
              hasRealSendTo, 
              hasGtagConfig, 
              hasConversionScript,
              hasGTMScript,
              hasRemarketingPixel 
            },
            tracking: { hasGclidParam, hasGclCookie }
          }
        };

        console.log("[PhantomIntel] Final Google Ads result:", result);
        return result;

      } catch (error) {
        console.error("[PhantomIntel] Detection error:", error);
        return {
          text: "Detection error",
          confidence: 0,
          awId: null,
          reasons: [`Error: ${error.message}`],
          debug: { error: error.message }
        };
      }
    }

    // ---- Execution ----
    const runDetection = () => {
      const result = detectGoogleAds();
      safeSend(result);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runDetection);
    } else {
      runDetection();
    }

    console.log("[PhantomIntel] Google Ads detector ready");
})();