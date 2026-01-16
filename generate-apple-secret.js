const fs = require('fs');
const jwt = require('jsonwebtoken');

// ============ FILL THESE IN ============
const TEAM_ID = 'L7GQ6RN22C';           // From Apple Developer account
const KEY_ID = 'Z77WGKY544';             // From the key you just created
const SERVICE_ID = 'com.zelkz.bloom.web'; // Your Service ID for web
const PRIVATE_KEY_PATH = 'AuthKey_Z77WGKY544.p8';  // Path to your downloaded .p8 file
// =======================================

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: SERVICE_ID,
  keyid: KEY_ID,
});

console.log('\n=== Your Apple Client Secret ===\n');
console.log(token);
console.log('\n=================================\n');
