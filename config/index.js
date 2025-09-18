require('dotenv').config();

const config = {
  bigcommerce: {
    storeHash: process.env.BIGCOMMERCE_STORE_HASH,
    accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
    clientId: process.env.BIGCOMMERCE_CLIENT_ID,
    clientSecret: process.env.BIGCOMMERCE_CLIENT_SECRET,
    baseUrl: `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3`
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'orders@powermanufacturing.com',
    toEmail: process.env.SENDGRID_TO_EMAIL || 'operations@powermanufacturing.com'
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    timezone: 'America/New_York'
  }
};

// Validate required environment variables
const requiredVars = [
  'BIGCOMMERCE_STORE_HASH',
  'BIGCOMMERCE_ACCESS_TOKEN',
  'SENDGRID_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = config;
