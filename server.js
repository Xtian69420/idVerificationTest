require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sumsub = require('./sumsub');
const storage = require('./storage'); // NEW

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.post('/api/create-applicant', async (req, res) => {
  try {
    const { userId, email, country } = req.body;
    const applicant = await sumsub.createApplicant(userId, 'basic-kyc-level', email, country);
    storage.saveApplicant(userId, { email, country }); // NEW
    res.json(applicant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/get-access-token', async (req, res) => {
  try {
    const { userId } = req.body;
    const token = await sumsub.getAccessToken(userId, 'basic-kyc-level');
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/verification-results/:userId', (req, res) => { // NEW
  try {
    const results = storage.getVerificationResults(req.params.userId);
    res.json(results || { status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sumsub-webhook', (req, res) => {
  // In production, verify webhook signature here
  const { applicantId, reviewResult } = req.body;
  
  console.log('Received verification results:', req.body);
  
  // Save verification results
  storage.saveVerificationResults(applicantId, {
    status: reviewResult.reviewStatus,
    decision: reviewResult.reviewAnswer,
    details: reviewResult.moderationComment,
    createdAt: new Date().toISOString()
  });
  
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test KYC at http://localhost:${PORT}/test-kyc.html`);
});