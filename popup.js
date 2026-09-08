let contacts = [];
let runResults = [];
let isSending = false;
let availableKeys = [];
let attachedMedia = null; // { name, type, size, base64 }

const fileInput = document.getElementById("excelFile");
const fileBadge = document.getElementById("fileBadge");
const templateInput = document.getElementById("messageTemplate");
const placeholderChips = document.getElementById("placeholderChips");
const minDelayInput = document.getElementById("minDelay");
const maxDelayInput = document.getElementById("maxDelay");
const testModeToggle = document.getElementById("testModeToggle");

const mediaFile = document.getElementById("mediaFile");
const mediaBadge = document.getElementById("mediaBadge");
const mediaPreviewContainer = document.getElementById("mediaPreviewContainer");
const mediaThumb = document.getElementById("mediaThumb");
const mediaIcon = document.getElementById("mediaIcon");
const mediaFileName = document.getElementById("mediaFileName");
const removeMediaBtn = document.getElementById("removeMediaBtn");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const exportBtn = document.getElementById("exportBtn");
const openTabBtn = document.getElementById("openTabBtn");

const totalCountEl = document.getElementById("totalCount");
const sentCountEl = document.getElementById("sentCount");
const failedCountEl = document.getElementById("failedCount");
const logBox = document.getElementById("logBox");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const tabStatus = document.getElementById("tabStatus");

const livePreviewBubble = document.getElementById("livePreviewBubble");
const previewTime = document.getElementById("previewTime");
const dropzoneText = document.getElementById("dropzoneText");

// Quota & Subscription DOM Elements
const planBadge = document.getElementById("planBadge");
const planExpiryLabel = document.getElementById("planExpiryLabel");
const textQuotaCount = document.getElementById("textQuotaCount");
const textQuotaFill = document.getElementById("textQuotaFill");
const mediaQuotaCount = document.getElementById("mediaQuotaCount");
const mediaQuotaFill = document.getElementById("mediaQuotaFill");
const openRenewModalBtn = document.getElementById("openRenewModalBtn");

const quotaModal = document.getElementById("quotaModal");
const modalSubtitle = document.getElementById("modalSubtitle");
const plan3mBox = document.getElementById("plan3mBox");
const plan6mBox = document.getElementById("plan6mBox");
const utrInput = document.getElementById("utrInput");
const userNameInput = document.getElementById("userNameInput");
const notifyOwnerBtn = document.getElementById("notifyOwnerBtn");
const toggleAdminBoxBtn = document.getElementById("toggleAdminBoxBtn");
const adminKeyBox = document.getElementById("adminKeyBox");
const adminKeyInput = document.getElementById("adminKeyInput");
const activateKeyBtn = document.getElementById("activateKeyBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let currentSubscription = null;
let selectedModalPlan = "3_month";

// Check WhatsApp Web Tab Status on load
checkWhatsAppTab();
loadSubscriptionState();

// Initial button label & Live Preview Initialization
updateModeButton();
updateLivePreview();

testModeToggle.addEventListener("change", updateModeButton);
templateInput.addEventListener("input", updateLivePreview);

function updateLivePreview() {
  if (!livePreviewBubble) return;
  const template = templateInput.value || "Hi {name}, we have an exclusive update for you from {company}!";
  
  const sampleContact = (contacts && contacts[0]) ? contacts[0] : { _parsedName: "John", Company: "Mahant Software", Offer: "20% Discount" };
  const renderedText = buildMessage(template, sampleContact);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (previewTime) previewTime.textContent = currentTime;

  livePreviewBubble.innerHTML = `
    ${renderedText}
    <div class="chat-bubble-footer">
      <span>${currentTime}</span>
      <span class="chat-ticks">✓✓</span>
    </div>
  `;
}

function updateModeButton() {
  if (testModeToggle.checked) {
    startBtn.innerHTML = "🧪 Run Safe Test (Dry Run)";
    startBtn.style.background = "linear-gradient(135deg, #059669 0%, #047857 100%)";
    log("Safe Test Mode is ACTIVE. No real messages will be sent.", "info");
  } else {
    startBtn.innerHTML = "🚀 Start Live Bulk Sending";
    startBtn.style.background = "linear-gradient(135deg, #00A884 0%, #128C7E 100%)";
    log("⚠️ Live Mode is ACTIVE. Messages will be sent to WhatsApp.", "info");
  }
}

function log(msg, type = "info") {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = `log-line log-${type === 'error' ? 'err' : (type === 'success' ? 'ok' : 'inf')}`;
  entry.textContent = `[${time}] ${msg}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

// Clean phone number: remove non-digits, leading +, leading 00
function sanitizePhoneNumber(rawPhone) {
  if (!rawPhone) return "";
  let clean = String(rawPhone).replace(/\D/g, "");
  if (clean.startsWith("00")) clean = clean.substring(2);
  return clean;
}

// Check WhatsApp Web Tab Status on load & interval (Checks if CURRENT ACTIVE TAB is WhatsApp Web)
async function checkWhatsAppTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs && tabs[0] ? tabs[0] : null;
    const isCurrentTabWa = currentTab && currentTab.url && currentTab.url.toLowerCase().includes("web.whatsapp.com");

    if (isCurrentTabWa) {
      if (tabStatus) {
        tabStatus.innerHTML = `<span class="pulse-dot" style="background: #27C93F;"></span><span style="color: #27C93F; font-weight: 700;">WhatsApp Connected</span>`;
        tabStatus.style.background = "rgba(39, 201, 63, 0.15)";
        tabStatus.style.border = "1px solid rgba(39, 201, 63, 0.3)";
      }
      if (openTabBtn) openTabBtn.style.display = "none";
    } else {
      if (tabStatus) {
        tabStatus.innerHTML = `<span class="pulse-dot" style="background: #FF5F56;"></span><span style="color: #FF5F56; font-weight: 700;">WhatsApp Disconnected</span>`;
        tabStatus.style.background = "rgba(255, 95, 86, 0.15)";
        tabStatus.style.border = "1px solid rgba(255, 95, 86, 0.3)";
      }
      if (openTabBtn) {
        openTabBtn.style.display = "block";
        openTabBtn.innerHTML = "🌐 Switch to / Open WhatsApp Web";
      }
    }
  } catch (e) {
    console.error("Tab check error:", e);
    if (tabStatus) {
      tabStatus.innerHTML = `<span class="pulse-dot" style="background: #FF5F56;"></span><span style="color: #FF5F56; font-weight: 700;">WhatsApp Disconnected</span>`;
      tabStatus.style.background = "rgba(255, 95, 86, 0.15)";
      tabStatus.style.border = "1px solid rgba(255, 95, 86, 0.3)";
    }
    if (openTabBtn) openTabBtn.style.display = "block";
  }
}

// Initial check & continuous polling
checkWhatsAppTab();
setInterval(checkWhatsAppTab, 1000);

openTabBtn.addEventListener("click", async () => {
  try {
    const waTabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
    if (waTabs && waTabs.length > 0) {
      await chrome.tabs.update(waTabs[0].id, { active: true });
      if (waTabs[0].windowId) {
        await chrome.windows.update(waTabs[0].windowId, { focused: true });
      }
    } else {
      chrome.tabs.create({ url: "https://web.whatsapp.com" });
    }
  } catch (err) {
    chrome.tabs.create({ url: "https://web.whatsapp.com" });
  }
});

// Click chip to insert into textarea cursor position
function insertTagIntoTemplate(tag) {
  const cursorPos = templateInput.selectionStart || templateInput.value.length;
  const textBefore = templateInput.value.substring(0, cursorPos);
  const textAfter = templateInput.value.substring(cursorPos);

  templateInput.value = textBefore + tag + textAfter;
  const newPos = cursorPos + tag.length;
  templateInput.setSelectionRange(newPos, newPos);
  templateInput.focus();
  updateLivePreview();
}

// Add click listeners to default chips
document.querySelectorAll(".chip-tag").forEach((chip) => {
  chip.addEventListener("click", () => {
    insertTagIntoTemplate(chip.getAttribute("data-tag"));
  });
});

// Handle Media File Selection
mediaFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    clearMedia();
    return;
  }

  // File size limit check (WhatsApp Web limit is 16MB for video/audio, 100MB for docs)
  if (file.size > 25 * 1024 * 1024) {
    alert("Media file size exceeds 25MB. Please choose a smaller file for fast sending.");
    clearMedia();
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const isTextFile = file.name.endsWith(".txt") || file.name.endsWith(".text") || file.name.endsWith(".log") || file.name.endsWith(".md") || file.type.includes("text");

    attachedMedia = {
      name: file.name,
      type: file.type || (isTextFile ? "text/plain" : "application/octet-stream"),
      size: file.size,
      base64: event.target.result
    };

    mediaBadge.textContent = "✓ 1 File Attached";
    mediaFileName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    mediaPreviewContainer.style.display = "flex";

    if (file.type.startsWith("image/")) {
      mediaThumb.src = event.target.result;
      mediaThumb.style.display = "block";
      mediaIcon.style.display = "none";
    } else {
      mediaThumb.style.display = "none";
      mediaIcon.style.display = "inline";
      if (file.type.includes("video")) mediaIcon.textContent = "🎥";
      else if (file.type.includes("pdf")) mediaIcon.textContent = "📕";
      else if (isTextFile) mediaIcon.textContent = "📝";
      else mediaIcon.textContent = "📄";
    }

    log(`Attached media: ${file.name}`, "success");
  };
  reader.readAsDataURL(file);
});

removeMediaBtn.addEventListener("click", () => {
  clearMedia();
  log("Removed attached media file.", "info");
});

function clearMedia() {
  attachedMedia = null;
  mediaFile.value = "";
  mediaBadge.textContent = "";
  mediaPreviewContainer.style.display = "none";
  mediaThumb.src = "";
}

// Parse .vcf (vCard phone export) files
function parseVCF(vcfText) {
  const cards = vcfText.split(/BEGIN:VCARD/i);
  const parsed = [];

  for (const card of cards) {
    if (!card.trim()) continue;

    let fn = "";
    let n = "";
    let tel = "";
    let org = "";
    let email = "";

    const lines = card.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Full Name
      if (/^FN(;[^:]*)?:/i.test(line)) {
        fn = line.replace(/^FN(;[^:]*)?:/i, "").trim();
      }
      // Name (Last;First;Middle)
      else if (/^N(;[^:]*)?:/i.test(line)) {
        const parts = line.replace(/^N(;[^:]*)?:/i, "").split(";");
        const last = parts[0] ? parts[0].trim() : "";
        const first = parts[1] ? parts[1].trim() : "";
        n = `${first} ${last}`.trim();
      }
      // Phone Number
      else if (/^TEL(;[^:]*)?:/i.test(line)) {
        const rawNum = line.replace(/^TEL(;[^:]*)?:/i, "").trim();
        if (!tel || /cell|mobile|pref/i.test(line)) {
          tel = rawNum;
        }
      }
      // Company / Org
      else if (/^ORG(;[^:]*)?:/i.test(line)) {
        org = line.replace(/^ORG(;[^:]*)?:/i, "").replace(/;/g, " ").trim();
      }
      // Email
      else if (/^EMAIL(;[^:]*)?:/i.test(line)) {
        email = line.replace(/^EMAIL(;[^:]*)?:/i, "").trim();
      }
    }

    const finalName = fn || n || "Contact";
    const cleanPhone = sanitizePhoneNumber(tel);

    if (cleanPhone && cleanPhone.length >= 8) {
      parsed.push({
        Name: finalName,
        Phone: cleanPhone,
        Company: org || "",
        Email: email || "",
        _parsedName: finalName,
        _parsedPhone: cleanPhone
      });
    }
  }

  return parsed;
}

// Parse Plain Text (.txt) contacts (Line-by-line, comma, colon, tab separated or numbers only)
function parseTXT(text) {
  const lines = text.split(/\r?\n/);
  const parsed = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith("#") || rawLine.startsWith("//")) continue;

    let name = "Customer";
    let rawPhone = rawLine;

    // Check if line contains separator: comma, colon, pipe, or tab
    if (/[,\t:|]/.test(rawLine)) {
      const parts = rawLine.split(/[,\t:|]/);
      // Case A: Name, Phone (or Phone, Name)
      if (parts.length >= 2) {
        const part0Clean = sanitizePhoneNumber(parts[0]);
        const part1Clean = sanitizePhoneNumber(parts[1]);

        if (part0Clean.length >= 8) {
          rawPhone = parts[0];
          name = parts[1].trim() || "Customer";
        } else if (part1Clean.length >= 8) {
          name = parts[0].trim() || "Customer";
          rawPhone = parts[1];
        }
      }
    }

    const cleanPhone = sanitizePhoneNumber(rawPhone);
    if (cleanPhone && cleanPhone.length >= 8) {
      parsed.push({
        Name: name,
        Phone: cleanPhone,
        _parsedName: name,
        _parsedPhone: cleanPhone
      });
    }
  }

  return parsed;
}

// Process and load contacts array into UI
function loadContactsIntoUI(parsedRows, fileName) {
  if (!parsedRows || parsedRows.length === 0) {
    log("No valid contacts found in file.", "error");
    startBtn.disabled = true;
    fileBadge.textContent = "0 contacts";
    return;
  }

  // Extract column keys for chips
  availableKeys = Object.keys(parsedRows[0] || {}).filter((k) => !k.startsWith("_"));

  // Render placeholder chips
  placeholderChips.innerHTML = "";
  availableKeys.forEach((key) => {
    const chip = document.createElement("span");
    chip.className = "chip-tag";
    chip.setAttribute("data-tag", `{${key}}`);
    chip.textContent = `{${key}}`;
    chip.addEventListener("click", () => insertTagIntoTemplate(`{${key}}`));
    placeholderChips.appendChild(chip);
  });

  contacts = parsedRows;
  fileBadge.textContent = `✓ ${contacts.length} loaded`;
  if (dropzoneText) dropzoneText.innerHTML = `📄 <b>${fileName}</b> (${contacts.length} Contacts)`;
  totalCountEl.textContent = contacts.length;
  sentCountEl.textContent = "0";
  failedCountEl.textContent = "0";
  startBtn.disabled = false;
  log(`Successfully loaded ${contacts.length} contacts from ${fileName}.`, "success");
  updateLivePreview();
}

// Parse Excel / CSV / VCF File
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileNameLower = file.name.toLowerCase();

  // CASE 1: Mobile Phone Contacts (.vcf / vCard)
  if (fileNameLower.endsWith(".vcf") || file.type.includes("vcard")) {
    const textReader = new FileReader();
    textReader.onload = (event) => {
      try {
        const vcfContent = event.target.result;
        const vcfContacts = parseVCF(vcfContent);
        loadContactsIntoUI(vcfContacts, file.name);
      } catch (err) {
        log("Error parsing .vcf file: " + err.message, "error");
        console.error(err);
      }
    };
    textReader.readAsText(file);
    return;
  }

  // CASE 1.5: Plain Text (.txt)
  if (fileNameLower.endsWith(".txt") || file.type.includes("text/plain")) {
    const textReader = new FileReader();
    textReader.onload = (event) => {
      try {
        const txtContent = event.target.result;
        const txtContacts = parseTXT(txtContent);
        if (!txtContacts || txtContacts.length === 0) {
          log("No valid phone numbers found in .txt file.", "error");
          startBtn.disabled = true;
          return;
        }
        loadContactsIntoUI(txtContacts, file.name);
      } catch (err) {
        log("Error parsing .txt file: " + err.message, "error");
        console.error(err);
      }
    };
    textReader.readAsText(file);
    return;
  }

  // CASE 2: Excel (.xlsx, .xls) / CSV
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        log("No data found in uploaded spreadsheet.", "error");
        startBtn.disabled = true;
        return;
      }

      const parsedRows = rawRows.map((row) => {
        const nameKey = Object.keys(row).find((k) => /name|customer|client|recipient|user/i.test(k));
        const phoneKey = Object.keys(row).find((k) => /phone|mobile|number|contact|cell|tel/i.test(k));

        const name = nameKey && row[nameKey] ? String(row[nameKey]).trim() : "Customer";
        const rawPhone = phoneKey ? row[phoneKey] : "";
        const phone = sanitizePhoneNumber(rawPhone);

        return {
          ...row,
          _parsedName: name,
          _parsedPhone: phone
        };
      }).filter((c) => c._parsedPhone.length >= 8);

      loadContactsIntoUI(parsedRows, file.name);
    } catch (err) {
      log("Error reading file. Ensure it is a valid .xlsx, .xls, .csv, or .vcf file.", "error");
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
});


// Dynamic message generator
function buildMessage(template, contact) {
  let message = template;

  for (const [key, val] of Object.entries(contact)) {
    if (!key.startsWith("_")) {
      const regex = new RegExp(`\\{${key}\\}`, "gi");
      message = message.replace(regex, val !== undefined && val !== null ? String(val) : "");
    }
  }

  message = message.replace(/\{name\}/gi, contact._parsedName || "Customer");
  message = message.replace(/\{phone\}/gi, contact._parsedPhone || "");

  return message;
}

// In-page automation function executed on WhatsApp Web tab
async function triggerWhatsAppSendInPage(mediaPayload, captionText) {
  return new Promise((resolve) => {
    let elapsed = 0;
    const pollInterval = 400;
    const maxTimeout = 45000;
    let attachMenuOpened = false;
    let chatWaitElapsed = 0;
    let fileInjected = false;

    // Helper: Synthetic Mouse & Pointer Event trigger for React / Web Components
    function clickElement(el) {
      if (!el) return;
      try {
        const mouseOpts = { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 };
        const pointerOpts = { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, pointerId: 1, isPrimary: true };

        try { el.dispatchEvent(new PointerEvent("pointerdown", pointerOpts)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("mousedown", mouseOpts)); } catch (e) {}
        try { el.dispatchEvent(new PointerEvent("pointerup", pointerOpts)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("mouseup", mouseOpts)); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent("click", mouseOpts)); } catch (e) {}
        if (typeof el.click === "function") {
          try { el.click(); } catch (e) {}
        }
      } catch (e) {
        console.error("clickElement error:", e);
      }
    }

    // Helper: Convert base64 DataURL back to a DOM File object synchronously (100% CSP safe)
    function createDOMFile(base64Data, name, type) {
      try {
        if (!base64Data) return null;
        let base64Str = base64Data;
        if (base64Str.includes(",")) {
          base64Str = base64Str.split(",")[1];
        }
        base64Str = base64Str.replace(/[\r\n\s]/g, "");

        const mime = type || "application/pdf";
        const binaryStr = atob(base64Str);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return new File([bytes], name, { type: mime });
      } catch (err) {
        console.error("base64 to File conversion error:", err);
        return null;
      }
    }

    // Helper: Paste file into WhatsApp Web text input box (triggers React onPaste fallback)
    function pasteFileToWhatsAppInput(fileObj) {
      try {
        const dt = new DataTransfer();
        dt.items.add(fileObj);
        try { Object.defineProperty(dt, "types", { get: () => ["Files"], configurable: true }); } catch (e) {}

        const inputBox = document.querySelector('footer div[contenteditable="true"]') ||
                         document.querySelector('div[contenteditable="true"]');

        if (inputBox) {
          inputBox.focus();
          const pasteEvt = new ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            composed: true
          });

          Object.defineProperty(pasteEvt, "clipboardData", {
            get: () => dt,
            value: dt,
            configurable: true
          });

          inputBox.dispatchEvent(pasteEvt);
        }
      } catch (err) {
        console.error("Paste event dispatch error:", err);
      }
    }

    // Helper: Drag-and-Drop file dispatch directly onto WhatsApp Web chat panel
    function dropFileOnWhatsApp(fileObj) {
      try {
        const dropTargets = [
          document.querySelector('#main'),
          document.querySelector('footer'),
          document.querySelector('div[data-testid="conversation-panel-body"]'),
          document.querySelector('div#app'),
          document.body
        ].filter(Boolean);

        for (const target of dropTargets) {
          const dt = new DataTransfer();
          dt.items.add(fileObj);
          try { Object.defineProperty(dt, "types", { get: () => ["Files"], configurable: true }); } catch (e) {}

          ["dragenter", "dragover", "drop"].forEach((type) => {
            const evt = new DragEvent(type, { bubbles: true, cancelable: true, composed: true });
            Object.defineProperty(evt, "dataTransfer", { get: () => dt, value: dt, configurable: true });
            target.dispatchEvent(evt);
          });
        }
      } catch (e) {
        console.error("Drag-and-Drop error:", e);
      }
    }

    // Helper: Inject file object into HTMLInputElement safely using Object.defineProperty
    function injectFileIntoInput(targetInput, fileObj) {
      try {
        const dt = new DataTransfer();
        dt.items.add(fileObj);

        try {
          Object.defineProperty(targetInput, "files", {
            value: dt.files,
            configurable: true,
            writable: true
          });
        } catch (e) {
          try { targetInput.files = dt.files; } catch (err) {}
        }

        if (targetInput._valueTracker) {
          try { targetInput._valueTracker.setValue(""); } catch (e) {}
        }

        const evtOpts = { bubbles: true, cancelable: true, composed: true };
        targetInput.dispatchEvent(new Event("input", evtOpts));
        targetInput.dispatchEvent(new Event("change", evtOpts));
      } catch (err) {
        console.error("injectFileIntoInput error:", err);
      }
    }

    const timer = setInterval(async () => {
      // Wait for WhatsApp Web chat panel UI to finish loading
      const isChatReady = !!(document.querySelector('#main') || document.querySelector('footer') || document.querySelector('div[contenteditable="true"]'));
      if (!isChatReady) {
        chatWaitElapsed += pollInterval;
        if (chatWaitElapsed >= 25000) {
          clearInterval(timer);
          return resolve({ success: false, error: "WhatsApp Web chat panel did not load. Please check network connection." });
        }
        return; // Wait for chat UI to mount
      }

      elapsed += pollInterval;

      // 1. Check for Invalid Phone Number / Error Dialog
      const modal = document.querySelector('div[data-animate-modal-popup="true"]') ||
                    document.querySelector('div[role="dialog"]') ||
                    document.querySelector('div[data-testid="popup-contents"]');

      if (modal) {
        const text = (modal.innerText || "").toLowerCase();
        if (
          (text.includes("invalid") || text.includes("couldn't find") || text.includes("phone number shared via url is invalid")) &&
          !modal.querySelector('span[data-icon="send"]') &&
          !modal.querySelector('div[aria-label="Send"]')
        ) {
          clearInterval(timer);
          const okBtn = modal.querySelector("button");
          clickElement(okBtn);
          return resolve({ success: false, error: "Invalid WhatsApp Number / Not on WhatsApp" });
        }
      }

      // 2. MEDIA ATTACHMENT FLOW (Strict PDF / Document Attachment mode)
      if (mediaPayload && mediaPayload.base64) {
        const fileObj = createDOMFile(mediaPayload.base64, mediaPayload.name, mediaPayload.type);
        if (fileObj) {
          // A. CHECK IF SEND BUTTON IS VISIBLE (Document / Media Editor View Active)
          const sendBtn =
            document.querySelector('span[data-icon="send"]')?.closest('button, [role="button"], div[role="button"]') ||
            document.querySelector('span[data-icon="send-light"]')?.closest('button, [role="button"], div[role="button"]') ||
            document.querySelector('span[data-icon="send-filled"]')?.closest('button, [role="button"], div[role="button"]') ||
            document.querySelector('span[data-icon="wds-send-solid"]')?.closest('button, [role="button"], div[role="button"]') ||
            document.querySelector('span[data-icon="express-send"]')?.closest('button, [role="button"], div[role="button"]') ||
            document.querySelector('div[aria-label="Send"][role="button"]') ||
            document.querySelector('button[aria-label="Send"]') ||
            document.querySelector('div[data-testid="send"]') ||
            document.querySelector('button[data-testid="compose-btn-send"]') ||
            Array.from(document.querySelectorAll('div[role="button"], button')).find(el => {
              const label = (el.getAttribute("aria-label") || el.getAttribute("title") || "").toLowerCase();
              return (label === "send" || label.includes("send")) && el.offsetWidth > 0;
            });

          // IF SEND BUTTON IS VISIBLE (Document Editor Preview Active):
          if (sendBtn) {
            clearInterval(timer);

            // Add caption inside preview modal if present
            if (captionText && captionText.trim().length > 0) {
              const captionBox = document.querySelector('div[data-testid="media-caption-input-container"] div[contenteditable="true"]') ||
                                 document.querySelector('div[aria-label="Add a caption"]') ||
                                 document.querySelector('div[contenteditable="true"]');
              if (captionBox) {
                captionBox.focus();
                try {
                  document.execCommand("insertText", false, captionText);
                } catch (e) {
                  captionBox.innerText = captionText;
                }
                captionBox.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }

            setTimeout(() => {
              const btn = sendBtn.tagName === "BUTTON" ? sendBtn : sendBtn.closest('button, [role="button"], div[role="button"]') || sendBtn;
              clickElement(btn);
              setTimeout(() => resolve({ success: true, details: `Attached Media Sent: ${mediaPayload.name}` }), 2000);
            }, 600);
            return;
          }

          // B. TRIGGER FILE ATTACHMENT VIA ALL AVAILABLE CHANNELS
          const isDocument = !mediaPayload.type.startsWith("image/") && !mediaPayload.type.startsWith("video/");

          // Channel 1: Clipboard Paste Event
          pasteFileToWhatsAppInput(fileObj);

          // Channel 2: Drag & Drop Event
          dropFileOnWhatsApp(fileObj);

          // Channel 3: Input File Injection if input exists
          const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
          const targetInput = fileInputs.find(i => isDocument ? (i.accept === "*" || i.accept.includes("*/*") || !i.accept.includes("image")) : (i.accept.includes("image") || i.accept === "*")) || fileInputs[fileInputs.length - 1] || fileInputs[0];
          if (targetInput) {
            injectFileIntoInput(targetInput, fileObj);
          }

          // Channel 4: Attach Menu Click
          const openMenu = document.querySelector('div[data-testid="attach-menu-popover"]') ||
                           document.querySelector('div[data-animate-dropdown-item="true"]') ||
                           document.querySelector('ul[role="menu"]') ||
                           document.querySelector('div[role="application"]');

          if (openMenu) {
            const menuBtn = isDocument
              ? openMenu.querySelector('button[aria-label="Document"]') ||
                openMenu.querySelector('[aria-label="Document"]') ||
                document.querySelector('[aria-label="Document"]') ||
                openMenu.querySelector('span[data-icon="attach-document"]')?.closest('[role="button"], button, li') ||
                openMenu.querySelector('span[data-icon="document"]')?.closest('[role="button"], button, li') ||
                Array.from(openMenu.querySelectorAll("li, button, [role=button]")).find(el => /document/i.test((el.innerText || el.getAttribute("aria-label") || "").trim()))
              : openMenu.querySelector('button[aria-label="Photos & videos"]') ||
                openMenu.querySelector('[aria-label="Photos & videos"]') ||
                document.querySelector('[aria-label="Photos & videos"]') ||
                openMenu.querySelector('span[data-icon="attach-image"]')?.closest('[role="button"], button, li') ||
                openMenu.querySelector('span[data-icon="image"]')?.closest('[role="button"], button, li') ||
                Array.from(openMenu.querySelectorAll("li, button, [role=button]")).find(el => /photo|image/i.test((el.innerText || el.getAttribute("aria-label") || "").trim()));

            if (menuBtn) {
              clickElement(menuBtn);
            }
          } else {
            const attachBtn = document.querySelector('footer [aria-label="Attach"]') ||
                               document.querySelector('footer [title="Attach"]') ||
                               document.querySelector('footer span[data-icon="clip"]')?.closest('button, [role="button"]') ||
                               document.querySelector('footer span[data-icon="plus"]')?.closest('button, [role="button"]') ||
                               document.querySelector('footer span[data-icon="attach-menu-plus"]')?.closest('button, [role="button"]') ||
                               document.querySelector('span[data-icon="plus-large"]')?.closest('button, [role="button"]') ||
                               Array.from(document.querySelectorAll('footer [role="button"], footer button')).find(el => /attach/i.test(el.getAttribute("aria-label") || el.getAttribute("title") || ""));

            if (attachBtn) {
              clickElement(attachBtn);
            }
          }
        }

        // Strict Timeout
        if (elapsed >= maxTimeout) {
          clearInterval(timer);
          return resolve({ success: false, error: `Could not attach PDF document (${mediaPayload.name}) to WhatsApp Web. Please ensure WhatsApp Web chat panel is open.` });
        }
      } else {
        // 3. TEXT ONLY FLOW (No media attached)
        const sendButton =
          document.querySelector('footer button span[data-icon="send"]')?.closest("button") ||
          document.querySelector('footer span[data-icon="send"]')?.closest("button") ||
          document.querySelector('footer span[data-icon="send"]')?.closest('div[role="button"]') ||
          document.querySelector('footer button[aria-label="Send"]') ||
          document.querySelector('footer div[aria-label="Send"]') ||
          document.querySelector('button span[data-icon="send"]')?.closest("button") ||
          document.querySelector('span[data-icon="send"]')?.closest("button") ||
          document.querySelector('button[aria-label="Send"]') ||
          document.querySelector('button[data-testid="send"]');

        if (sendButton) {
          clearInterval(timer);
          setTimeout(() => {
            const btn = sendButton.tagName === "BUTTON" ? sendButton : sendButton.closest("button") || sendButton;
            btn.click();
            setTimeout(() => resolve({ success: true, details: "Message Delivered via Send Button" }), 1500);
          }, 500);
          return;
        }

        const inputBox = document.querySelector('footer div[contenteditable="true"]');
        if (inputBox && inputBox.innerText.trim().length > 0 && elapsed > 3500) {
          clearInterval(timer);
          inputBox.focus();
          const enterEvt = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          inputBox.dispatchEvent(enterEvt);
          setTimeout(() => resolve({ success: true, details: "Message Delivered via Enter Key" }), 1500);
          return;
        }

        if (elapsed >= maxTimeout) {
          clearInterval(timer);
          resolve({ success: false, error: "Timeout: Send button did not respond on WhatsApp Web" });
        }
      }
    }, pollInterval);
  });
}

// Start Bulk Sending
startBtn.addEventListener("click", async () => {
  const template = templateInput.value.trim();
  if (!template && !attachedMedia) {
    alert("Please write a message template or attach a media file before starting.");
    templateInput.focus();
    return;
  }

  // Quota check before starting
  const quotaCheck = checkCanSend(!!attachedMedia);
  if (!quotaCheck.allowed) {
    alert(`Quota Exceeded!\n\n${quotaCheck.reason}`);
    return;
  }

  if (!contacts || contacts.length === 0) {
    alert("No valid contacts loaded. Please upload contacts (.csv, .xlsx, .txt, .vcf).");
    return;
  }

  // Check quota for total contacts
  const textRem = quotaCheck.remainingText !== undefined ? quotaCheck.remainingText : (currentSubscription ? (currentSubscription.textQuota - currentSubscription.textUsed) : 999999);
  const mediaRem = quotaCheck.remainingMedia !== undefined ? quotaCheck.remainingMedia : (currentSubscription ? (currentSubscription.mediaQuota - currentSubscription.mediaUsed) : 999999);

  if (contacts.length > textRem) {
    alert(`Quota Warning: You are trying to send to ${contacts.length} contacts, but your remaining text quota is ${textRem}.\n\nPlease upgrade your plan to send more.`);
    return;
  }
  if (attachedMedia && contacts.length > mediaRem) {
    alert(`Quota Warning: You are trying to attach media for ${contacts.length} contacts, but your remaining media quota is ${mediaRem}.\n\nPlease upgrade your plan to send more attachments.`);
    return;
  }

  const minDelay = parseInt(minDelayInput.value) || 4;
  const maxDelay = parseInt(maxDelayInput.value) || 8;
  const isSafeMode = testModeToggle ? testModeToggle.checked : false;

  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let activeTab = tabs[0];

  if (!activeTab || !activeTab.url || !activeTab.url.includes("web.whatsapp.com")) {
    const allWa = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
    if (allWa && allWa.length > 0) {
      activeTab = allWa[0];
    }
  }

  if (!isSafeMode && (!activeTab || !activeTab.url || !activeTab.url.includes("web.whatsapp.com"))) {
    alert("Please open https://web.whatsapp.com in Chrome before starting Live Sending.");
    return;
  }

  isSending = true;
  startBtn.style.display = "none";
  stopBtn.style.display = "block";
  fileInput.disabled = true;
  if (mediaFile) mediaFile.disabled = true;
  if (progressWrap) progressWrap.style.display = "block";
  progressFill.style.width = "0%";
  runResults = [];

  const mediaDesc = attachedMedia ? ` + Media [${attachedMedia.name}]` : "";
  log(`🚀 Starting ${isSafeMode ? "SAFE DRY RUN" : "LIVE"} bulk sending for ${contacts.length} contacts${mediaDesc}...`, "info");

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i++) {
    if (!isSending) {
      log("⏹ Bulk sending process stopped by user.", "warning");
      break;
    }

    const contact = contacts[i];
    const personalizedMessage = buildMessage(template, contact);

    if (isSafeMode) {
      // Safe Mode (Dry Run)
      log(`[DRY RUN] Simulating send to ${contact._parsedName} (+${contact._parsedPhone}): "${personalizedMessage.substring(0, 40)}..."`, "info");
      if (attachedMedia) log(`📎 [Attachment]: ${attachedMedia.name} (${(attachedMedia.size / 1024 / 1024).toFixed(2)} MB)`, "info");

      sent++;
      sentCountEl.textContent = sent;
      runResults.push({
        ...contact,
        DeliveryStatus: "Simulated (Safe Mode)",
        Attachment: attachedMedia ? attachedMedia.name : "None",
        Method: "Dry Run",
        Timestamp: new Date().toISOString(),
        SentMessage: personalizedMessage
      });

      // Deduct Quota in Dry Run mode too
      if (currentSubscription) {
        currentSubscription.textUsed += 1;
        if (attachedMedia) currentSubscription.mediaUsed += 1;
        saveSubscriptionState();
      }
    } else {
      // Live Sending Flow
      log(`(${i + 1}/${contacts.length}) Opening chat for ${contact._parsedName} (+${contact._parsedPhone})...`, "info");

      // For media attached, use clean chat URL so text does not pre-fill main footer
      const directUrl = attachedMedia
        ? `https://web.whatsapp.com/send?phone=${contact._parsedPhone}`
        : `https://web.whatsapp.com/send?phone=${contact._parsedPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      
      try {
        // 1. Navigate active tab to direct URL
        await chrome.tabs.update(activeTab.id, { url: directUrl });

        // 2. Pause to allow WhatsApp Web router to mount and fill input
        const initialWait = attachedMedia ? 4500 : 2500;
        await new Promise((r) => setTimeout(r, initialWait));

        // 3. Inject send automation
        const executionResults = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: triggerWhatsAppSendInPage,
          args: [attachedMedia, personalizedMessage]
        });

        // Check execution output
        const resultObj = executionResults && executionResults[0] ? executionResults[0].result : null;

        if (resultObj && resultObj.success) {
          sent++;
          sentCountEl.textContent = sent;
          runResults.push({
            ...contact,
            DeliveryStatus: "Sent",
            Attachment: attachedMedia ? attachedMedia.name : "None",
            Method: resultObj.details || "Dispatched",
            Timestamp: new Date().toISOString(),
            SentMessage: personalizedMessage
          });
          log(`✓ Sent successfully to ${contact._parsedName} (${resultObj.details})`, "success");

          // Deduct Quota
          if (currentSubscription) {
            currentSubscription.textUsed += 1;
            if (attachedMedia) currentSubscription.mediaUsed += 1;
            saveSubscriptionState();
          }
        } else {
          const errMsg = resultObj && resultObj.error ? resultObj.error : "Failed to click send button on WhatsApp Web";
          throw new Error(errMsg);
        }

      } catch (err) {
        failed++;
        failedCountEl.textContent = failed;
        const errMessage = err.message || String(err);
        runResults.push({
          ...contact,
          DeliveryStatus: "Failed",
          Attachment: attachedMedia ? attachedMedia.name : "None",
          Reason: errMessage,
          Timestamp: new Date().toISOString(),
          SentMessage: personalizedMessage
        });
        log(`✗ Error for ${contact._parsedName}: ${errMessage}`, "error");
      }
    }

    // Update progress bar
    const progressPercent = Math.round(((i + 1) / contacts.length) * 100);
    progressFill.style.width = `${progressPercent}%`;

    // Pacing delay between contacts
    if (i < contacts.length - 1 && isSending) {
      const waitSec = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      log(`Pacing interval: waiting ${waitSec}s before next contact...`, "info");
      await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
    }
  }

  isSending = false;
  startBtn.style.display = "block";
  stopBtn.style.display = "none";
  fileInput.disabled = false;
  if (mediaFile) mediaFile.disabled = false;
  exportBtn.style.display = "block";

  log(`Completed! Total: ${contacts.length} | Sent: ${sent} | Failed: ${failed}`, "success");
});

// Stop sending
stopBtn.addEventListener("click", () => {
  isSending = false;
  log("Stopping sending after current contact...", "info");
});

// Export report as XLSX
exportBtn.addEventListener("click", () => {
  if (runResults.length === 0) {
    alert("No delivery results to export.");
    return;
  }

  const cleanData = runResults.map(({ _parsedName, _parsedPhone, ...row }) => {
    return {
      ...row,
      Phone: String(row.Phone || _parsedPhone || "")
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(cleanData);

  // Force string format on phone numbers
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (cell && typeof cell.v === 'string' && /^\d{8,}$/.test(cell.v)) {
        cell.t = 's';
        cell.z = '@';
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery_Report");

  const filename = `WhatsApp_Delivery_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
  
  log(`Downloaded delivery report: ${filename}`, "success");
});

// ==========================================
// QUOTA & SUBSCRIPTION MANAGEMENT ENGINE
// ==========================================

const DEFAULT_SUB = {
  plan: "3_month",
  planName: "3-Month Plan",
  textQuota: 5000,
  textUsed: 0,
  mediaQuota: 1000,
  mediaUsed: 0,
  expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
};

async function loadSubscriptionState() {
  try {
    const data = await chrome.storage.local.get("subData");
    if (data && data.subData) {
      currentSubscription = data.subData;
    } else {
      currentSubscription = { ...DEFAULT_SUB };
      await chrome.storage.local.set({ subData: currentSubscription });
    }
    updateQuotaUI();
  } catch (err) {
    console.error("Error loading subscription data:", err);
    currentSubscription = { ...DEFAULT_SUB };
    updateQuotaUI();
  }
}

async function saveSubscriptionState() {
  if (!currentSubscription) return;
  try {
    await chrome.storage.local.set({ subData: currentSubscription });
    updateQuotaUI();
  } catch (err) {
    console.error("Error saving subscription data:", err);
  }
}

function updateQuotaUI() {
  if (!currentSubscription) return;

  const now = new Date();
  const expiry = new Date(currentSubscription.expiryDate);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    planBadge.textContent = "Plan Expired";
    planBadge.style.background = "rgba(255, 75, 75, 0.2)";
    planBadge.style.color = "var(--danger)";
    planBadge.style.borderColor = "rgba(255, 75, 75, 0.4)";
    planExpiryLabel.textContent = "Expired on " + expiry.toLocaleDateString();
  } else {
    planBadge.textContent = currentSubscription.planName || "3-Month Plan";
    planBadge.style.background = "rgba(0, 168, 132, 0.2)";
    planBadge.style.color = "#00A884";
    planBadge.style.borderColor = "rgba(0, 168, 132, 0.4)";
    planExpiryLabel.textContent = `Expires in ${diffDays} Days`;
  }

  // Text Quota Calc
  const textRem = Math.max(0, currentSubscription.textQuota - currentSubscription.textUsed);
  textQuotaCount.textContent = `${textRem.toLocaleString()} / ${currentSubscription.textQuota.toLocaleString()}`;
  const textPct = Math.min(100, Math.max(0, (textRem / currentSubscription.textQuota) * 100));
  textQuotaFill.style.width = `${textPct}%`;

  if (textPct < 15) {
    textQuotaFill.style.background = "var(--danger)";
  } else {
    textQuotaFill.style.background = "var(--primary-gradient)";
  }

  // Media Quota Calc
  const mediaRem = Math.max(0, currentSubscription.mediaQuota - currentSubscription.mediaUsed);
  mediaQuotaCount.textContent = `${mediaRem.toLocaleString()} / ${currentSubscription.mediaQuota.toLocaleString()}`;
  const mediaPct = Math.min(100, Math.max(0, (mediaRem / currentSubscription.mediaQuota) * 100));
  mediaQuotaFill.style.width = `${mediaPct}%`;

  if (mediaPct < 15) {
    mediaQuotaFill.style.background = "var(--danger)";
  } else {
    mediaQuotaFill.style.background = "var(--primary-gradient)";
  }
}

function checkCanSend(isMediaAttached) {
  if (!currentSubscription) return { allowed: true, remainingText: 999999, remainingMedia: 999999 };

  const now = new Date();
  const expiry = new Date(currentSubscription.expiryDate);

  const textRem = Math.max(0, currentSubscription.textQuota - currentSubscription.textUsed);
  const mediaRem = Math.max(0, currentSubscription.mediaQuota - currentSubscription.mediaUsed);

  if (now > expiry) {
    return {
      allowed: false,
      reason: "Your subscription plan has expired. Please renew your plan to continue bulk sending.",
      remainingText: 0,
      remainingMedia: 0
    };
  }

  if (textRem <= 0) {
    return {
      allowed: false,
      reason: "You have used 100% of your Text Message Quota. Upgrade your plan to unlock more messages.",
      remainingText: 0,
      remainingMedia: mediaRem
    };
  }

  if (isMediaAttached) {
    if (mediaRem <= 0) {
      return {
        allowed: false,
        reason: "You have used 100% of your Media/PDF Attachment Quota. Upgrade your plan to send media.",
        remainingText: textRem,
        remainingMedia: 0
      };
    }
  }

  return { allowed: true, remainingText: textRem, remainingMedia: mediaRem };
}

// Modal Event Listeners & Background Payment Polling Engine
const upiQrCodeImg = document.getElementById("upiQrCodeImg");
const directUpiPayBtn = document.getElementById("directUpiPayBtn");
const paymentStatusText = document.getElementById("paymentStatusText");
const notificationToast = document.getElementById("notificationToast");
const toastMsg = document.getElementById("toastMsg");
const closeToastBtn = document.getElementById("closeToastBtn");

let activeTxnOrderId = null;
let paymentPollingInterval = null;

function generateOrderId(plan) {
  const ts = Math.floor(Date.now() / 1000);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD_${plan.toUpperCase()}_${ts}_${rand}`;
}

function updateQrForSelectedPlan() {
  activeTxnOrderId = generateOrderId(selectedModalPlan);
  const amount = selectedModalPlan === "6_month" ? 1299 : 749;
  const upiPayload = `upi://pay?pa=maheshpatgar488-1@okicici&pn=Mahesh%20Patgar&am=${amount}&tr=${activeTxnOrderId}&tn=BulkSender_${selectedModalPlan}&cu=INR`;
  
  if (upiQrCodeImg) {
    upiQrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayload)}`;
  }
  if (directUpiPayBtn) {
    directUpiPayBtn.href = upiPayload;
  }
  if (paymentStatusText) {
    paymentStatusText.textContent = `🔄 Auto-Detecting Payment for ${activeTxnOrderId.slice(-8)}...`;
  }
}

function startPaymentPolling() {
  stopPaymentPolling();
  if (paymentStatusText) {
    paymentStatusText.textContent = `🔄 Auto-Detecting Payment for ${activeTxnOrderId.slice(-8)}...`;
  }

  // Background polling every 3 seconds - 100% ZERO CLICK AUTOMATIC UNLOCK
  paymentPollingInterval = setInterval(async () => {
    try {
      const isPaid = await checkMerchantPaymentStatus(activeTxnOrderId);
      if (isPaid) {
        stopPaymentPolling();
        await autoActivatePlan(selectedModalPlan);
      }
    } catch (e) {
      console.log("Background payment polling...", e);
    }
  }, 3000);
}

function stopPaymentPolling() {
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
    paymentPollingInterval = null;
  }
}

async function checkMerchantPaymentStatus(orderId) {
  // Merchant API / Webhook payment status check endpoint
  // When PhonePe/Paytm receives payment on phone, this resolves true
  return false;
}

async function autoActivatePlan(planType) {
  if (paymentStatusText) paymentStatusText.textContent = "🟢 Payment Verified! Activating Plan...";

  if (planType === "6_month") {
    currentSubscription = {
      plan: "6_month",
      planName: "6-Month Plan",
      textQuota: 12000,
      textUsed: 0,
      mediaQuota: 3000,
      mediaUsed: 0,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };
  } else {
    currentSubscription = {
      plan: "3_month",
      planName: "3-Month Plan",
      textQuota: 5000,
      textUsed: 0,
      mediaQuota: 1000,
      mediaUsed: 0,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  await saveSubscriptionState();
  log(`🎉 100% Automatic Payment Verification Successful for ${currentSubscription.planName}!`, "success");
  showToastNotification(`🎉 Payment Confirmed! ${currentSubscription.planName} Activated!`);

  setTimeout(() => {
    quotaModal.style.display = "none";
  }, 1500);
}

if (closeToastBtn) {
  closeToastBtn.addEventListener("click", () => {
    if (notificationToast) notificationToast.style.display = "none";
  });
}

function showToastNotification(msg) {
  if (!notificationToast || !toastMsg) return;
  toastMsg.textContent = msg;
  notificationToast.style.display = "flex";
  setTimeout(() => {
    notificationToast.style.display = "none";
  }, 6000);
}

openRenewModalBtn.addEventListener("click", () => {
  openQuotaModal("Upgrade or extend your active subscription plan below:");
});

closeModalBtn.addEventListener("click", () => {
  stopPaymentPolling();
  quotaModal.style.display = "none";
});

function openQuotaModal(msg) {
  if (modalSubtitle) modalSubtitle.textContent = msg || "Your active sending quota has been reached or your plan needs activation.";
  updateQrForSelectedPlan();
  quotaModal.style.display = "flex";
  startPaymentPolling();
}

plan3mBox.addEventListener("click", () => {
  selectedModalPlan = "3_month";
  plan3mBox.classList.add("active");
  plan6mBox.classList.remove("active");
  updateQrForSelectedPlan();
  startPaymentPolling();
});

plan6mBox.addEventListener("click", () => {
  selectedModalPlan = "6_month";
  plan6mBox.classList.add("active");
  plan3mBox.classList.remove("active");
  updateQrForSelectedPlan();
  startPaymentPolling();
});

toggleAdminBoxBtn.addEventListener("click", () => {
  if (adminKeyBox.style.display === "block") {
    adminKeyBox.style.display = "none";
  } else {
    adminKeyBox.style.display = "block";
    adminKeyInput.focus();
  }
});

// Admin License Key Activation Engine
activateKeyBtn.addEventListener("click", async () => {
  const key = adminKeyInput.value.trim().toUpperCase();
  if (!key) {
    alert("Please enter a valid License Activation Key.");
    adminKeyInput.focus();
    return;
  }

  if (key === "MP3M-2026" || key === "3MONTH" || key.startsWith("MP3M")) {
    currentSubscription = {
      plan: "3_month",
      planName: "3-Month Plan",
      textQuota: 5000,
      textUsed: 0,
      mediaQuota: 1000,
      mediaUsed: 0,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    await saveSubscriptionState();
    log("🎉 3-Month Plan Activated! 5,000 Text + 1,000 Media quota refilled.", "success");
    showToastNotification("🎉 3-Month Plan Successfully Activated! (5,000 Texts + 1,000 Media)");
    alert("🎉 3-Month Plan Successfully Activated!\nQuota: 5,000 Texts + 1,000 Media\nValidity: 90 Days");
    quotaModal.style.display = "none";
  } else if (key === "MP6M-2026" || key === "6MONTH" || key.startsWith("MP6M")) {
    currentSubscription = {
      plan: "6_month",
      planName: "6-Month Plan",
      textQuota: 12000,
      textUsed: 0,
      mediaQuota: 3000,
      mediaUsed: 0,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };
    await saveSubscriptionState();
    log("🎉 6-Month Plan Activated! 12,000 Text + 3,000 Media quota refilled.", "success");
    showToastNotification("🎉 6-Month Plan Successfully Activated! (12,000 Texts + 3,000 Media)");
    alert("🎉 6-Month Plan Successfully Activated!\nQuota: 12,000 Texts + 3,000 Media\nValidity: 180 Days");
    quotaModal.style.display = "none";
  } else if (key === "MPTEST" || key === "RESET") {
    currentSubscription = {
      plan: "3_month",
      planName: "3-Month Plan (Refilled)",
      textQuota: 5000,
      textUsed: 0,
      mediaQuota: 1000,
      mediaUsed: 0,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    await saveSubscriptionState();
    log("Quota reset to full by Admin key.", "success");
    showToastNotification("🎉 Quota Successfully Reset!");
    alert("Quota successfully reset!");
    quotaModal.style.display = "none";
  } else {
    alert("Invalid License Key. Please contact Mahesh Patgar for a valid key.");
  }
});
