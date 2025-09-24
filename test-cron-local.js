/**
 * Test the external cron endpoint locally
 */

require('dotenv').config();
const BigCommerceService = require('./services/bigcommerce');
const EmailService = require('./services/email');

async function testCronLocally() {
  console.log('🧪 Testing external cron endpoint locally...\n');
  
  try {
    const startTime = new Date();
    const etTime = new Date(startTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    console.log(`[CRON-TEST] Starting at ${startTime.toISOString()} (${etTime.toLocaleString()})`);
    
    // Validate environment variables
    const requiredEnvVars = ['SENDGRID_API_KEY', 'BIGCOMMERCE_STORE_HASH', 'BIGCOMMERCE_ACCESS_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    const bigCommerceService = new BigCommerceService();
    const emailService = new EmailService();
    
    console.log('[CRON-TEST] Fetching orders from BigCommerce...');
    const orders = await bigCommerceService.getAllOrdersWithShipping();
    
    console.log(`[CRON-TEST] Found ${orders.length} orders for today`);
    
    // Send email with orders (even if no orders, the email service handles this)
    console.log('[CRON-TEST] Sending daily orders email...');
    await emailService.sendDailyOrdersEmail(orders);
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log(`[CRON-TEST] ✅ Cron test completed successfully in ${duration}ms`);
    console.log(`📧 Email sent with ${orders.length} orders`);
    
  } catch (error) {
    console.error('❌ Error in cron test:', error.message);
    console.error('Full error:', error);
  }
}

testCronLocally();
