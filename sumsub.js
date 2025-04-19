require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL;
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;

function createSignature(method, path, timestamp, body = '') {
  const hmac = crypto.createHmac('sha256', SUMSUB_SECRET_KEY);
  hmac.update(timestamp + method + path + body);
  return hmac.digest('hex');
}

async function createApplicant(externalUserId, levelName, email, country) {
  const path = `/resources/applicants?levelName=${levelName}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature('POST', path, timestamp);
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-App-Token': SUMSUB_APP_TOKEN,
    'X-App-Access-Sig': signature,
    'X-App-Access-Ts': timestamp
  };
  
  const body = {
    externalUserId: externalUserId,
    email: email,
    info: {
      country: country,
      firstName: 'Test', // Default test values
      lastName: 'User'
    }
  };
  
  const response = await axios.post(`${SUMSUB_BASE_URL}${path}`, body, { headers });
  return response.data;
}

async function getAccessToken(externalUserId, levelName) {
  const path = `/resources/accessTokens?userId=${externalUserId}&levelName=${levelName}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature('POST', path, timestamp);
  
  const headers = {
    'Accept': 'application/json',
    'X-App-Token': SUMSUB_APP_TOKEN,
    'X-App-Access-Sig': signature,
    'X-App-Access-Ts': timestamp
  };
  
  const response = await axios.post(`${SUMSUB_BASE_URL}${path}`, {}, { headers });
  return response.data.token;
}

module.exports = {
  createApplicant,
  getAccessToken
};