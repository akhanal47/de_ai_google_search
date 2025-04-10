const masterToggle = document.getElementById('masterToggle'); // New
const toggleMinusAi = document.getElementById('toggleMinusAi');
const toggleUdm14 = document.getElementById('toggleUdm14');
const minusAiOption = document.getElementById('minusAiOption'); // Get parent div
const udm14Option = document.getElementById('udm14Option');   // Get parent div

// local state vars
let currentActiveMode = 'none'; 
let currentGlobalState = true; 

// update the UI based on the current state
function updateUI(isGloballyEnabled, activeMode) {
  masterToggle.checked = isGloballyEnabled;

  toggleMinusAi.checked = (activeMode === 'minus_ai');
  toggleUdm14.checked = (activeMode === 'udm14');

  // mode toggles based on global state
  const isDisabled = !isGloballyEnabled;
  toggleMinusAi.disabled = isDisabled;
  toggleUdm14.disabled = isDisabled;

  // mode options based on global state
  minusAiOption.classList.toggle('disabled', isDisabled);
  udm14Option.classList.toggle('disabled', isDisabled);
}

// handle state changes and reload if needed
function handleStateUpdate(action, data, reloadNeeded = true) {
  chrome.runtime.sendMessage({ action: action, ...data }, function(response) {
    if (response && response.success) {
      if (reloadNeeded) {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length > 0 && tabs[0].id && tabs[0].url) {
              const tabUrl = tabs[0].url;
              const isGoogleSearchPage = tabUrl.includes('.google.') && tabUrl.includes('/search?');
              const shouldReload = isGoogleSearchPage &&
                                  (currentGlobalState || (action === 'setGlobalEnable' && data.enabled)); 
              if (shouldReload) {
                 chrome.tabs.reload(tabs[0].id, { bypassCache: true });
              }
            }
          });
      }
    } else {
       console.error(`Failed to ${action}:`, response ? response.error : "No response");
       fetchAndUpdateState(); // resync on failure
    }
  });
}

function fetchAndUpdateState() {
    chrome.runtime.sendMessage({ action: 'getState' }, function(response) {
      if (response) {
        currentActiveMode = response.activeMode;
        currentGlobalState = response.isGloballyEnabled;
        updateUI(currentGlobalState, currentActiveMode);
      } else {
        console.error("Failed to get initial state from background script.");
        updateUI(false, 'none'); // default case for error
      }
    });
}

// load initial state on popup
fetchAndUpdateState();

// Master Switch Listener
masterToggle.addEventListener('change', function() {
  const isEnabled = masterToggle.checked;
  currentGlobalState = isEnabled; 
  updateUI(isEnabled, currentActiveMode);
  handleStateUpdate('setGlobalEnable', { enabled: isEnabled });
});

// Mode Toggles Listeners
toggleMinusAi.addEventListener('change', function() {
  const isChecked = toggleMinusAi.checked;
  const newMode = isChecked ? 'minus_ai' : 'none';
  currentActiveMode = newMode; 
  updateUI(currentGlobalState, newMode); 
  handleStateUpdate('setActiveMode', { mode: newMode });
});

toggleUdm14.addEventListener('change', function() {
  const isChecked = toggleUdm14.checked;
  const newMode = isChecked ? 'udm14' : 'none';
  currentActiveMode = newMode; 
  updateUI(currentGlobalState, newMode);
  handleStateUpdate('setActiveMode', { mode: newMode });
});