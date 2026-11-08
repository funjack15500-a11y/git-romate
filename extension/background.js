const POPUP_PAGE = "popup.html";
const POPUP_WIDTH = 460;
const POPUP_HEIGHT = 720;

async function findExistingPopup() {
  const url = chrome.runtime.getURL(POPUP_PAGE);
  const wins = await chrome.windows.getAll({ populate: true });
  return wins.find(
    (win) => win.type === "popup" && (win.tabs || []).some((tab) => (tab.url || "").split("?")[0] === url)
  );
}

async function openPopup() {
  const existing = await findExistingPopup();
  if (existing && existing.id != null) {
    await chrome.windows.update(existing.id, { focused: true });
    return;
  }
  await chrome.windows.create({
    url: chrome.runtime.getURL(POPUP_PAGE),
    type: "popup",
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    focused: true,
  });
}

chrome.action.onClicked.addListener(() => {
  openPopup();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    openPopup();
  }
});
