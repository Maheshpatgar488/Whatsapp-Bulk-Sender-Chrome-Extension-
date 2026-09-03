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

// Check WhatsApp Web Tab Status on load
checkWhatsAppTab();

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

// Check if current tab is web.whatsapp.com
async function checkWhatsAppTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (currentTab && currentTab.url && currentTab.url.includes("web.whatsapp.com")) {
      tabStatus.textContent = "WhatsApp Connected";
      tabStatus.style.background = "#e7fce3";
      tabStatus.style.color = "#008069";
      openTabBtn.style.display = "none";
    } else {
      tabStatus.textContent = "WhatsApp Tab Not Active";
      tabStatus.style.background = "#ffebee";
      tabStatus.style.color = "#c2002e";
      openTabBtn.style.display = "block";
    }
  } catch (e) {
    console.error("Tab check error:", e);
  }
}

openTabBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://web.whatsapp.com" });
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
    attachedMedia = {
      name: file.name,
      type: file.type || "application/octet-stream",
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
    const maxTimeout = 25000;
    let hasInjectedMedia = false;

    const timer = setInterval(async () => {
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
          const okBtn = modal.querySelector("button");
          if (okBtn) okBtn.click();
          return resolve({ success: false, error: "Invalid WhatsApp Number / Not on WhatsApp" });
        }
      }

      // 2. Check for Media / Document Preview Modal (if media was attached)
      const previewModal = document.querySelector('div[data-animate-modal-popup="true"]') ||
                           document.querySelector('div[data-testid="media-editor-container"]') ||
                           document.querySelector('div[data-testid="document-editor"]');

      if (previewModal) {
        const modalSendBtn = previewModal.querySelector('span[data-icon="send"]')?.closest("button") ||
                             previewModal.querySelector('span[data-icon="send"]')?.closest('div[role="button"]') ||
                             previewModal.querySelector('span[data-icon="send-light"]')?.closest("button") ||
                             previewModal.querySelector('div[aria-label="Send"][role="button"]') ||
                             previewModal.querySelector('button[aria-label="Send"]');

        if (modalSendBtn) {
          clearInterval(timer);

          // Add caption if provided
          if (captionText && captionText.trim().length > 0) {
            const captionBox = previewModal.querySelector('div[contenteditable="true"]');
            if (captionBox) {
              captionBox.focus();
              document.execCommand('insertText', false, captionText);
            }
          }

          setTimeout(() => {
            const btn = modalSendBtn.tagName === "BUTTON" ? modalSendBtn : modalSendBtn.closest("button") || modalSendBtn.closest('div[role="button"]') || modalSendBtn;
            btn.click();

            // Also trigger Enter key on caption input
            const activeInput = document.activeElement;
            if (activeInput && activeInput.getAttribute("contenteditable") === "true") {
              activeInput.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              }));
            }

            setTimeout(() => resolve({ success: true, details: "Media / Document Dispatched" }), 2000);
          }, 600);
          return;
        }
      }

      // 3. Check for Standard WhatsApp Chat Send Button (Text Messages & Fallback)
      const sendButton =
        document.querySelector('button span[data-icon="send"]') ||
        document.querySelector('span[data-icon="send"]')?.closest("button") ||
        document.querySelector('button[aria-label="Send"]') ||
        document.querySelector('footer button span[data-icon="send"]')?.parentElement ||
        document.querySelector('span[data-icon="send-light"]')?.closest("button") ||
        document.querySelector('button[data-testid="send"]') ||
        document.querySelector('button[data-tab="11"]');

      if (sendButton) {
        clearInterval(timer);
        setTimeout(() => {
          const btn = sendButton.tagName === "BUTTON" ? sendButton : sendButton.closest("button") || sendButton;
          btn.click();
          setTimeout(() => resolve({ success: true, details: "Message Delivered via Send Button" }), 1500);
        }, 500);
        return;
      }

      // 4. Fallback: Press Enter on footer message input if text is present
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

      // 5. Timeout check
      if (elapsed >= maxTimeout) {
        clearInterval(timer);
        resolve({ success: false, error: "Timeout: Send button did not respond on WhatsApp Web" });
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

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab || !activeTab.url || !activeTab.url.includes("web.whatsapp.com")) {
    alert("Please ensure https://web.whatsapp.com is active in this tab.");
    return;
  }

  isSending = true;
  runResults = [];
  startBtn.style.display = "none";
  stopBtn.style.display = "block";
  exportBtn.style.display = "none";
  fileInput.disabled = true;
  if (mediaFile) mediaFile.disabled = true;
  progressWrap.style.display = "block";

  const isDryRun = testModeToggle.checked;
  const minDelaySec = Math.max(1, parseInt(minDelayInput.value, 10) || 4);
  const maxDelaySec = Math.max(minDelaySec, parseInt(maxDelayInput.value, 10) || 8);

  let sent = 0;
  let failed = 0;

  const mediaDesc = attachedMedia ? ` + Media [${attachedMedia.name}]` : "";

  log(isDryRun 
    ? `🧪 Starting DRY RUN simulation for ${contacts.length} contacts${mediaDesc}...`
    : `🚀 Starting LIVE bulk sending for ${contacts.length} contacts${mediaDesc}...`, "info");

  for (let i = 0; i < contacts.length; i++) {
    if (!isSending) {
      log(`Process stopped by user at ${i}/${contacts.length}.`, "error");
      break;
    }

    const contact = contacts[i];
    const personalizedMessage = buildMessage(template, contact);

    if (isDryRun) {
      // Safe Simulation
      log(`[TEST MODE ${i + 1}/${contacts.length}] Contact: ${contact._parsedName} (+${contact._parsedPhone})`, "info");
      if (attachedMedia) log(`📎 [Attachment]: ${attachedMedia.name} (${(attachedMedia.size / 1024 / 1024).toFixed(2)} MB)`, "info");
      log(`📝 Message/Caption: "${personalizedMessage}"`, "info");

      await new Promise((resolve) => setTimeout(resolve, 800));

      sent++;
      sentCountEl.textContent = sent;
      runResults.push({
        ...contact,
        DeliveryStatus: "Simulated Sent",
        Attachment: attachedMedia ? attachedMedia.name : "None",
        Timestamp: new Date().toISOString(),
        SentMessage: personalizedMessage
      });
      log(`✓ [Simulated OK] ${contact._parsedName}`, "success");
    } else {
      // Live Sending Flow
      log(`(${i + 1}/${contacts.length}) Opening chat for ${contact._parsedName} (+${contact._parsedPhone})...`, "info");

      // Always include personalized message in WhatsApp Web URL so text is NEVER lost
      const directUrl = `https://web.whatsapp.com/send?phone=${contact._parsedPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      
      try {
        // 1. Navigate active tab to direct URL
        await chrome.tabs.update(activeTab.id, { url: directUrl });

        // 2. Pause to allow WhatsApp Web router to mount and fill input
        await new Promise((r) => setTimeout(r, 2500));

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
      const waitSec = Math.floor(Math.random() * (maxDelaySec - minDelaySec + 1)) + minDelaySec;
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
