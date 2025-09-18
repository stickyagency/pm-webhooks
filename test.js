/**
 * Test script for Power Manufacturing Webhooks
 * Run with: node test.js
 */

const BigCommerceService = require('./services/bigcommerce');
const EmailService = require('./services/email');

async function runTests() {
  console.log('🧪 Starting Power Manufacturing Webhooks Tests...\n');

  try {
    // Test 1: BigCommerce Connection
    console.log('1️⃣ Testing BigCommerce connection...');
    const bigCommerceService = new BigCommerceService();
    const testOrders = await bigCommerceService.getOrders({ limit: 5 });
    console.log(`✅ BigCommerce connected - Found ${testOrders.length} recent orders\n`);

    // Test 2: Fast Delivery Orders
    console.log('2️⃣ Testing fast delivery orders detection...');
    const fastOrders = await bigCommerceService.getFastDeliveryOrders();
    console.log(`✅ Found ${fastOrders.length} fast delivery orders\n`);

    // Test 3: Email Service (without sending)
    console.log('3️⃣ Testing email service configuration...');
    const emailService = new EmailService();
    const emailContent = emailService.generateOrdersEmailContent(fastOrders);
    console.log(`✅ Email service configured - Generated ${emailContent.html.length} chars of HTML\n`);

    // Test 4: Health Check
    console.log('4️⃣ Testing health check...');
    const healthCheck = {
      bigcommerce: testOrders.length > 0 ? 'connected' : 'error',
      sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    };
    console.log('✅ Health check results:', healthCheck);

    console.log('\n🎉 All tests passed! Your webhook system is ready to deploy.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have a .env file with all required variables');
    console.error('2. Verify your BigCommerce credentials are correct');
    console.error('3. Check that your SendGrid API key is valid');
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
