# 🚀 WhatsApp Business Bulk Sender - Chrome Extension (Manifest V3)

[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/Version-1.2.2-blue?style=for-the-badge)](https://github.com/Maheshpatgar488/Whatsapp-Bulk-Sender-Chrome-Extension-)
[![Platform](https://img.shields.io/badge/Platform-WhatsApp%20Web-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://web.whatsapp.com)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

A lightweight, powerful, and privacy-focused Chrome Extension to send personalized WhatsApp messages, brochures, resumes, and promotions in bulk directly from **Excel (`.xlsx`, `.xls`)**, **CSV**, or **Phone Contacts (`.vcf`)** spreadsheets via **WhatsApp Web**.

---

## 🌟 Key Features

- 📁 **Universal File Support**: Upload `.xlsx`, `.xls`, `.csv`, or phone contact `.vcf` files directly.
- 🏷️ **Dynamic Template Variables**: Insert dynamic placeholders like `{name}`, `{phone}`, `{company}`, `{offer}`, or any custom column from your spreadsheet with 1 click.
- 🛡️ **Anti-Ban Safety Engine**: Randomized human-like pacing intervals (e.g. 4–8s or 8–15s) to keep your WhatsApp account safe and protect against bot detection.
- 🧪 **Safe Test Mode (Dry Run)**: Simulate your entire batch campaign with live message previews before sending a single real message.
- 🤖 **Auto-Dismiss Error Alerts**: Automatically detects and dismisses WhatsApp "Invalid Phone Number" popups so your queue never gets stuck.
- 📊 **Excel Delivery Report (.xlsx)**: Export a clean delivery report with formatted phone numbers, timestamps, and delivery statuses (`Sent` / `Failed`).
- 🔒 **100% Client-Side & Private**: All contact parsing and message processing happens locally on your computer. Zero external tracking or data collection.

---

## 📸 Screenshots & UI Preview

```text
+-------------------------------------------------------------+
|               WhatsApp Bulk Sender                          |
| [ WhatsApp Connected ]                                      |
+-------------------------------------------------------------+
| 1. UPLOAD CONTACTS                                          |
| [ Choose File ] contacts.csv (✓ 5 Loaded)                   |
| Supported: .xlsx, .csv, or Phone .vcf                       |
+-------------------------------------------------------------+
| 2. MESSAGE TEMPLATE                                         |
| [ Hi {name}, check out our offer from {company}!         ]  |
| Click variables: {name}  {phone}  {company}  {offer}        |
+-------------------------------------------------------------+
| 3. SENDING MODE & SAFETY                                    |
| [X] Safe Test Mode (Dry Run)                                |
| Min Delay (s): [ 4 ]        Max Delay (s): [ 8 ]            |
+-------------------------------------------------------------+
| TOTAL: 5          SENT: 5          FAILED: 0                |
| [=================== 100% ===================]             |
| [Activity Log: Completed! Total: 5 | Sent: 5 | Failed: 0]   |
+-------------------------------------------------------------+
| [ 🚀 Start Live Bulk Sending ]                              |
| [ 📊 Export Delivery Report (.xlsx) ]                       |
+-------------------------------------------------------------+
```

---

## ⚡ Quick 30-Second Installation Guide

1. **Clone or Download this Repository**:
   ```bash
   git clone https://github.com/Maheshpatgar488/Whatsapp-Bulk-Sender-Chrome-Extension-.git
   ```
   *(Or click **Code ➡️ Download ZIP** on GitHub and extract the folder).*

2. **Open Google Chrome Extensions**:
   - In Chrome, navigate to `chrome://extensions` in the address bar.
   - Toggle **ON** the **Developer mode** switch in the top-right corner.

3. **Load the Extension**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the cloned/extracted project folder (`Whatsapp-Bulk-Sender-Chrome-Extension-`).
   - *(Optional)* Click the Chrome puzzle icon (🧩) and pin 📌 **WhatsApp Bulk Sender** to your toolbar.

---

## 📖 How to Use

1. **Log in to WhatsApp Web**:
   - Open a tab and go to [https://web.whatsapp.com](https://web.whatsapp.com).
   - Log in by scanning the QR code with your phone.

2. **Open the Extension Popup**:
   - Click the extension icon on your Chrome toolbar while on the WhatsApp Web tab.

3. **Upload your Contacts**:
   - Upload your `contacts.csv`, `.xlsx`, or `.vcf` file.
   - Example CSV format:
     ```csv
     Name,Phone,Company,Offer
     John Doe,919876543210,Apex Solutions,20% Exclusive Discount
     Sarah Connor,14155552671,Cyberdyne Tech,VIP Access Pass
     ```

4. **Write your Message Template**:
   - Use dynamic tags matching your spreadsheet columns:
     ```text
     Hi {name}, we have a special {offer} for you from {company}!
     Check our portfolio here: https://drive.google.com/file/d/your-link/view
     ```

5. **Choose Sending Mode**:
   - Keep **🧪 Safe Test Mode (Dry Run)** checked to preview and test safely.
   - **Uncheck** Safe Test Mode when you are ready to send live messages.

6. **Click Start**:
   - Click **🚀 Start Live Bulk Sending**.
   - The extension will automatically open each chat, paste the customized message, and dispatch it!
   - When finished, click **📊 Export Delivery Report (.xlsx)** to download the run log.

---

## 📞 Phone Number Formatting Guidelines

Always ensure phone numbers in your files include the **Country Code** without spaces, dashes, brackets, or leading `+`:

| Country | Example Format |
| :--- | :--- |
| 🇮🇳 **India (+91)** | `919876543210` |
| 🇺🇸 **USA / Canada (+1)** | `14155552671` |
| 🇬🇧 **UK (+44)** | `447911123456` |
| 🇦🇪 **UAE (+971)** | `971501234567` |
| 🇦🇺 **Australia (+61)** | `61412345678` |

---

## 🛡️ Anti-Ban Best Practices

To ensure your WhatsApp Business account operates safely without risk:

1. **Keep Delay Pacing**: Keep the delay set between **6–12 seconds** (or 10–18s for large lists).
2. **Personalize Every Message**: Always use `{name}` and custom fields to avoid duplicate content triggers.
3. **Warm Up New SIMs**: If using a newly registered SIM, start with 30–50 messages/day and increase gradually.
4. **Use Cloud Links for PDFs/Catalogs**: Share resumes, brochures, and documents via Google Drive/Dropbox links to generate rich preview cards.

---

## 📁 Project Structure

```text
Whatsapp-Bulk-Sender-Chrome-Extension-/
├── manifest.json                    # Chrome Extension Manifest V3 configuration
├── popup.html                       # Modern WhatsApp-themed popup interface
├── popup.js                         # Spreadsheet parser, queue manager & dispatcher
├── content.js                       # WhatsApp Web in-page automation scripts
├── xlsx.mini.min.js                 # Offline SheetJS engine for Excel/CSV parsing
├── contacts.csv                     # Ready-to-test dummy contact list
├── sample_contacts.vcf              # Sample vCard phone contact export file
├── INSTALLATION_AND_TESTING_GUIDE.html # Printable user & testing guide
└── README.md                        # Full documentation & setup guide
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

### 👨‍💻 Developed by [Mahesh Patgar](https://github.com/Maheshpatgar488)
*Feel free to star ⭐ the repository if you found this useful!*
