const axios = require('axios');
const logger = require('../config/logger');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callMLService = async (vitals, retries = 3) => {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.post(`${ML_URL}/api/predict`, vitals, { timeout: 10000 });
      logger.info(`ML prediction success: ${data.predicted_disease} (${data.risk_level})`, { module: 'ML' });
      return data;
    } catch (err) {
      logger.warn(`ML service attempt ${i + 1} failed: ${err.message}`, { module: 'ML' });
      if (i < retries - 1) await sleep(delays[i]);
    }
  }
  const error = new Error('ML service unavailable after 3 attempts');
  error.status = 503;
  throw error;
};

const callMLBatch = async (records) => {
  const { data } = await axios.post(`${ML_URL}/api/predict/batch`, { records }, { timeout: 30000 });
  return data;
};

const getMLHealth = async () => {
  const { data } = await axios.get(`${ML_URL}/api/health`, { timeout: 5000 });
  return data;
};

module.exports = { callMLService, callMLBatch, getMLHealth };
