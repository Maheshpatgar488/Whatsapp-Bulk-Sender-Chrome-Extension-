// content.js - WhatsApp Web Automation

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRIGGER_SEND") {
    executeSendAction()
      .then((res) => sendResponse({ success: true, details: res }))
      .catch((err) => sendResponse({ success: false, error: err.message || err.toString() }));
    return true; // Keep message channel open for async response
  }

  if (request.action === "PING") {
    sendResponse({ status: "READY" });
    return false;
  }
});

function executeSendAction() {
  return new Promise((resolve, reject) => {
    let elapsed = 0;
    const pollInterval = 400;
    const maxTimeout = 25000; // 25 seconds timeout

    const timer = setInterval(() => {
      elapsed += pollInterval;

      // 1. Check for Invalid Phone Number / Error Dialog
      const modal = document.querySelector('div[data-animate-modal-popup="true"]') ||
                    document.querySelector('div[role="dialog"]') ||
                    document.querySelector('div[data-testid="popup-contents"]');

      if (modal) {
        const text = (modal.innerText || "").toLowerCase();
        if (
          text.includes("invalid") ||
          text.includes("phone number shared via url is invalid") ||
          text.includes("url is invalid") ||
          text.includes("couldn't find")
        ) {
          clearInterval(timer);
          // Dismiss the popup dialog by clicking OK
          const okBtn = modal.querySelector("button");
          if (okBtn) okBtn.click();
          return reject(new Error("Invalid WhatsApp Number / Not on WhatsApp"));
        }
      }

      // 2. Check for WhatsApp Send Button
      const sendButton =
        document.querySelector('button span[data-icon="send"]') ||
        document.querySelector('span[data-icon="send"]')?.closest("button") ||
        document.querySelector('button[aria-label="Send"]') ||
        document.querySelector('footer button span[data-icon="send"]')?.parentElement ||
        document.querySelector('span[data-icon="send-light"]')?.closest("button");

      if (sendButton) {
        clearInterval(timer);
        // Small delay to simulate human click
        setTimeout(() => {
          const btnToClick = sendButton.tagName === "BUTTON" ? sendButton : sendButton.closest("button") || sendButton;
          btnToClick.click();
          
          // Wait 1.5s for message to send over socket
          setTimeout(() => resolve("Sent via Send Button"), 1500);
        }, 600);
        return;
      }

      // 3. Fallback: Check if message text is loaded into footer and press Enter
      const inputBox = document.querySelector('footer div[contenteditable="true"]');
      if (inputBox && inputBox.innerText.trim().length > 0 && elapsed > 4000) {
        clearInterval(timer);
        inputBox.focus();
        
        // Dispatch Enter key event
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        inputBox.dispatchEvent(enterEvent);

        setTimeout(() => resolve("Sent via Enter Key"), 1500);
        return;
      }

      // 4. Timeout check
      if (elapsed >= maxTimeout) {
        clearInterval(timer);
        reject(new Error("Chat load timeout (Send button not found)"));
      }
    }, pollInterval);
  });
}
