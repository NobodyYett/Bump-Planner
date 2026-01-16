const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const os = require('os');

const TEAM_ID = 'L7GQ6RN22C';
const KEY_ID = 'Z77WGKY544';
const SERVICE_ID = 'com.zelkz.bloom.web';
const PRIVATE_KEY_PATH = path.join(os.homedir(), 'AuthKey_Z77WGKY544.p8');

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
