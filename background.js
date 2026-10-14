function setup() {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error(err));
}
chrome.runtime.onInstalled.addListener(setup);
setup();