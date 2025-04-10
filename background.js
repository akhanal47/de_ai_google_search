let activeMode = 'udm14';
let isGloballyEnabled = true; // global state (main toggle) 

chrome.storage.sync.get(['activeMode', 'isGloballyEnabled'], function(data) {
  const validModes = ['none', 'minus_ai', 'udm14'];

  const loadedGlobalState = data.isGloballyEnabled !== undefined ? data.isGloballyEnabled : true;
  if (loadedGlobalState) {
      if (data.activeMode && validModes.includes(data.activeMode)) {
          activeMode = data.activeMode;
      } else {
          activeMode = 'udm14'; // default to 'udm14' if global state is enabled or active mode invalid
      }
  } else {
      activeMode = 'none';
  }
  isGloballyEnabled = loadedGlobalState;


  chrome.storage.sync.set({
      'activeMode': activeMode,
      'isGloballyEnabled': isGloballyEnabled
  }, () => {
      if (chrome.runtime.lastError) {
          console.error("Error saving initial state:", chrome.runtime.lastError);
      }
      updateVisualState(isGloballyEnabled, activeMode);
  });
});


// URL modification logic
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId !== 0) return;

  // if master toggle is off, do nothing
  if (!isGloballyEnabled) return;

  // master toggle on, check url and apply modifications
  if (details.url.includes('/search?')) {
    try {
      const url = new URL(details.url);
      const currentQuery = url.searchParams.get('q');
      const currentUdm = url.searchParams.get('udm');
      let urlModified = false;

      // Bail early conditions
      if (!currentQuery && activeMode === 'minus_ai') return;

      // Apply modifications based on the active mode
      if (activeMode === 'minus_ai') {
        if (currentUdm === '14') { url.searchParams.delete('udm'); urlModified = true; }
        if (currentQuery && !/\s*-ai\b/.test(currentQuery)) {
           url.searchParams.set('q', `${currentQuery.trim()} -ai`);
           urlModified = true;
        }
      } else if (activeMode === 'udm14') {
        if (currentQuery && /\s*-ai\b/.test(currentQuery)) {
            const cleanedQuery = currentQuery.replace(/\s*-ai\b/g, '').trim();
            url.searchParams.set('q', cleanedQuery);
            urlModified = true;
        }
        if (currentUdm !== '14') { url.searchParams.set('udm', '14'); urlModified = true; }
      } else {
         if (currentQuery && /\s*-ai\b/.test(currentQuery)) {
             const cleanedQuery = currentQuery.replace(/\s*-ai\b/g, '').trim();
             url.searchParams.set('q', cleanedQuery);
             urlModified = true;
         }
         if (currentUdm === '14') { url.searchParams.delete('udm'); urlModified = true; }
      }
      if (urlModified) {
          const newUrlString = url.toString();
          if (newUrlString !== details.url) {
              chrome.tabs.update(details.tabId, { url: newUrlString });
          }
      }

    } catch (e) { console.error("Error processing URL:", details.url, e); }
  }
}, { url: [{ urlMatches: 'https?://[^/]*google\.[^/]+/search.*' }] });


// icon update
function updateVisualState(globallyEnabled, currentMode) {
  const iconPath = globallyEnabled ? { "128": "assets/icon128.png" } : { "128": "assets/icon128_grey.png" };
  chrome.action.setIcon({ path: iconPath }).catch(e => console.error("Error setting icon:", e));

  let title = "Search Modifier";
  if (globallyEnabled) {
      if (currentMode === 'minus_ai') title = "Search Modifier (-ai active)";
      else if (currentMode === 'udm14') title = "Search Modifier (Web Only active)";
      else title = "Search Modifier (Active, no mode selected)";
  } else {
      title = "Search Modifier (Globally Disabled)";
  }
  chrome.action.setTitle({ title: title }).catch(e => console.error("Error setting title:", e));
}


// clean current tab url
function cleanupCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0 || !tabs[0].id || !tabs[0].url) return; // No active tab or URL

    const tabId = tabs[0].id;
    const currentTabUrl = tabs[0].url;

    // act only on google search pages
    if (currentTabUrl.includes('google.') && currentTabUrl.includes('/search?')) {
      try {
        const url = new URL(currentTabUrl);
        let urlModified = false;

        const currentQuery = url.searchParams.get('q');
        const currentUdm = url.searchParams.get('udm');

        // check and remove "-ai"
        if (currentQuery && /\s*-ai\b/.test(currentQuery)) {
           const cleanedQuery = currentQuery.replace(/\s*-ai\b/g, '').trim();
           url.searchParams.set('q', cleanedQuery);
           urlModified = true;
        }

        // check and remove "-ai"
        if (currentUdm === '14') {
           url.searchParams.delete('udm');
           urlModified = true;
        }

        // update url if modified
        if (urlModified) {
           const newUrlString = url.toString();
           if (newUrlString !== currentTabUrl) {
               chrome.tabs.update(tabId, { url: newUrlString });
           }
        }
      } catch (e) {
        console.error("Error cleaning up URL:", currentTabUrl, e);
      }
    }
  });
}


// message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let needsAsyncResponse = false;

  if (request.action === "getState") {
    sendResponse({ activeMode: activeMode, isGloballyEnabled: isGloballyEnabled });

  } else if (request.action === "setActiveMode") {
    if (!isGloballyEnabled) {
        sendResponse({ success: false, error: "Extension is globally disabled."});
        return false;
    }

    const newMode = request.mode;
    const validModes = ['none', 'minus_ai', 'udm14'];
    if (validModes.includes(newMode)) {
      activeMode = newMode;
      updateVisualState(isGloballyEnabled, activeMode);
      chrome.storage.sync.set({ 'activeMode': activeMode }, () => {
         if (chrome.runtime.lastError) {
             console.error("Error saving activeMode:", chrome.runtime.lastError);
             sendResponse({ success: false, error: chrome.runtime.lastError.message });
         } else {
             sendResponse({ success: true });
         }
      });
      needsAsyncResponse = true;
    } else {
       sendResponse({ success: false, error: "Invalid mode provided" });
    }

  } else if (request.action === "setGlobalEnable") {
    const newState = request.enabled;
    let stateToSave = {};

    if (typeof newState === 'boolean') {
        isGloballyEnabled = newState;

        if (newState === true) {
            activeMode = 'udm14';
            stateToSave = { 'isGloballyEnabled': true, 'activeMode': 'udm14' };
        } else {
            activeMode = 'none';
            stateToSave = { 'isGloballyEnabled': false, 'activeMode': 'none' };
        }

        updateVisualState(isGloballyEnabled, activeMode);

        chrome.storage.sync.set(stateToSave, () => {
             if (chrome.runtime.lastError) {
                console.error("Error saving global state:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
             } else {
                if (newState === false) {
                    cleanupCurrentTab();
                }
                sendResponse({ success: true });
             }
        });
        needsAsyncResponse = true;
    } else {
        sendResponse({ success: false, error: "Invalid enabled state provided" });
    }
  }

  return needsAsyncResponse;
});