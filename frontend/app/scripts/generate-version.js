// scripts/generate-version.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a version hash based on content of key files
function generateVersionHash() {
  // Get current timestamp
  const timestamp = new Date().toISOString();
  
  // Create a hash of the timestamp and a random value
  // This ensures each build has a unique version
  const hash = crypto.createHash('md5')
    .update(timestamp + Math.random().toString())
    .digest('hex')
    .substring(0, 8);
  
  return hash;
}

// Main function to generate version information
async function generateVersion() {
  const versionHash = generateVersionHash();
  console.log(`Generating version: ${versionHash}`);
  
  // Create version.json file
  const versionData = {
    version: versionHash,
    buildTime: new Date().toISOString()
  };
  
  // Write version.json to public folder
  fs.writeFileSync(
    path.join(__dirname, '../public/version.json'),
    JSON.stringify(versionData, null, 2)
  );
  
  // Read service worker template
  const swPath = path.join(__dirname, '../public/service-worker.js');
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace version placeholder with actual version
  swContent = swContent.replace('BUILD_VERSION_HASH', versionHash);
  
  // Write updated service worker
  fs.writeFileSync(swPath, swContent);
  
  console.log('Version files generated successfully');
}

// Run the generator
generateVersion().catch(err => {
  console.error('Error generating version:', err);
  process.exit(1);
});