// WhatsApp Web Canary & Version Monitor
// Checks live web.whatsapp.com client releases and validates selectors.json integrity

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SELECTORS_PATH = path.join(__dirname, '..', 'selectors.json');
const BUILD_RECORD_PATH = path.join(__dirname, 'last_whatsapp_build.json');

function fetchPageViaCurl(url) {
  try {
    const stdout = execSync(`curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "${url}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    return stdout;
  } catch (err) {
    throw new Error('Failed to fetch via curl: ' + err.message);
  }
}

function validateSelectors() {
  console.log('🔍 Step 1: Validating selectors.json schema...');
  if (!fs.existsSync(SELECTORS_PATH)) {
    throw new Error('selectors.json does not exist!');
  }
  const raw = fs.readFileSync(SELECTORS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const requiredKeys = ['searchBox', 'clearSearch', 'attachButton', 'sendButton', 'mediaViewerSend'];

  for (const key of requiredKeys) {
    if (!parsed[key] || !Array.isArray(parsed[key]) || parsed[key].length === 0) {
      throw new Error(`selectors.json is missing valid array for key: "${key}"`);
    }
    console.log(`  ✓ ${key}: ${parsed[key].length} fallback selectors defined.`);
  }
  return parsed;
}

async function checkWhatsAppWeb() {
  console.log('\n🌐 Step 2: Checking web.whatsapp.com live release status...');
  const body = fetchPageViaCurl('https://web.whatsapp.com/');

  if (!body || body.length < 500) {
    throw new Error('WhatsApp Web returned empty or incomplete HTML');
  }
  console.log(`  ✓ WhatsApp Web is online (received ${body.length} bytes).`);

  // Extract script bundle hashes / build signature
  const scriptRegex = /src="([^"]*?(?:app|bootstrap|manifest)[^"]*?\.js)"/gi;
  const scriptMatches = [];
  let match;
  while ((match = scriptRegex.exec(body)) !== null) {
    scriptMatches.push(match[1]);
  }

  const metaVersionMatch = body.match(/data-app-version="([^"]+)"/i);
  const metaAppVersion = metaVersionMatch ? metaVersionMatch[1] : null;

  const currentSignature = {
    checkedAt: new Date().toISOString(),
    contentLength: body.length,
    appVersion: metaAppVersion || 'web-prod',
    bundleCount: scriptMatches.length,
    bundleSamples: scriptMatches.slice(0, 5)
  };

  let previousBuild = null;
  if (fs.existsSync(BUILD_RECORD_PATH)) {
    try {
      previousBuild = JSON.parse(fs.readFileSync(BUILD_RECORD_PATH, 'utf8'));
    } catch (e) {}
  }

  const hasChanged = !previousBuild ||
    previousBuild.appVersion !== currentSignature.appVersion ||
    previousBuild.bundleCount !== currentSignature.bundleCount ||
    JSON.stringify(previousBuild.bundleSamples) !== JSON.stringify(currentSignature.bundleSamples);

  if (hasChanged) {
    console.log('⚠️  WhatsApp Web release update detected!');
    console.log(`   Previous Build Samples: ${previousBuild ? JSON.stringify(previousBuild.bundleSamples) : 'None'}`);
    console.log(`   Current Build Samples:  ${JSON.stringify(currentSignature.bundleSamples)}`);
    fs.writeFileSync(BUILD_RECORD_PATH, JSON.stringify(currentSignature, null, 2), 'utf8');
    console.log('  ✓ Updated scripts/last_whatsapp_build.json');
  } else {
    console.log('  ✓ WhatsApp Web build version is unchanged since last check.');
  }

  return { hasChanged, currentSignature };
}

async function run() {
  try {
    validateSelectors();
    await checkWhatsAppWeb();
    console.log('\n✅ Canary check passed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Canary check failed:', err.message);
    process.exit(1);
  }
}

run();
