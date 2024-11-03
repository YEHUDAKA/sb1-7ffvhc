chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ signatureSets: [] });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'signaturePlace') {
    handleSignaturePlacement(request.position, sender.tab.id);
  } else if (request.action === 'signatureComplete') {
    finalizeDocument(sender.tab.id);
  }
});

async function handleSignaturePlacement(position, tabId) {
  // Store position for the current signature placement
  await chrome.storage.local.set({
    [`signature_${tabId}`]: position
  });
}

async function finalizeDocument(tabId) {
  const positions = await chrome.storage.local.get(`signature_${tabId}`);
  if (!positions) return;
  
  // Clean up stored positions
  await chrome.storage.local.remove(`signature_${tabId}`);
  
  // Notify popup that signature placement is complete
  chrome.runtime.sendMessage({
    action: 'documentSigned',
    positions: positions[`signature_${tabId}`]
  });
}