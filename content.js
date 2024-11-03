// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'initializeSignature') {
    initializeSignatureMode(request.settings);
  }
});

let signatureMode = false;
let currentSignature = null;

function initializeSignatureMode(settings) {
  signatureMode = true;
  
  // Create overlay for signature placement
  const overlay = document.createElement('div');
  overlay.id = 'pdf-signature-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    cursor: crosshair;
  `;
  
  document.body.appendChild(overlay);
  
  // Create signature preview element
  currentSignature = document.createElement('div');
  currentSignature.id = 'pdf-signature-preview';
  currentSignature.style.cssText = `
    position: absolute;
    display: none;
    pointer-events: none;
  `;
  
  overlay.appendChild(currentSignature);
  
  // Add event listeners
  overlay.addEventListener('mousemove', updateSignaturePosition);
  overlay.addEventListener('click', placeSignature);
  document.addEventListener('keydown', handleKeyPress);
}

function updateSignaturePosition(e) {
  if (!currentSignature) return;
  
  currentSignature.style.display = 'block';
  currentSignature.style.left = `${e.clientX}px`;
  currentSignature.style.top = `${e.clientY}px`;
}

function placeSignature(e) {
  if (!signatureMode) return;
  
  const position = {
    x: e.clientX,
    y: e.clientY,
    pageNumber: getCurrentPage()
  };
  
  chrome.runtime.sendMessage({
    action: 'signaturePlace',
    position: position
  });
}

function handleKeyPress(e) {
  if (e.key === 'Enter' && signatureMode) {
    finalizeSignature();
  } else if (e.key === 'Escape' && signatureMode) {
    cancelSignature();
  }
}

function finalizeSignature() {
  signatureMode = false;
  removeOverlay();
  chrome.runtime.sendMessage({ action: 'signatureComplete' });
}

function cancelSignature() {
  signatureMode = false;
  removeOverlay();
  chrome.runtime.sendMessage({ action: 'signatureCancel' });
}

function removeOverlay() {
  const overlay = document.getElementById('pdf-signature-overlay');
  if (overlay) {
    overlay.remove();
  }
  currentSignature = null;
}

function getCurrentPage() {
  // Implementation depends on the PDF viewer being used
  // This is a simplified example
  const viewer = document.querySelector('.pdfViewer');
  if (!viewer) return 1;
  
  const pages = viewer.querySelectorAll('.page');
  let currentPage = 1;
  
  pages.forEach((page, index) => {
    const rect = page.getBoundingClientRect();
    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
      currentPage = index + 1;
    }
  });
  
  return currentPage;
}