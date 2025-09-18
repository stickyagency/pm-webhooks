/**
 * Send test email with today's orders
 */

require('dotenv').config();
const BigCommerceService = require('./services/bigcommerce');
const EmailService = require('./services/email');

async function sendTestEmail() {
  console.log('📧 Sending test email with today\'s orders...\n');
  
  try {
    const bigCommerceService = new BigCommerceService();
    const emailService = new EmailService();
    
    // Get today's orders with shipping information
    console.log('1️⃣ Fetching today\'s orders...');
    const orders = await bigCommerceService.getAllOrdersWithShipping();
    
    console.log(`✅ Found ${orders.length} orders from today`);
    
    // Send email with all today's orders
    console.log('2️⃣ Sending email...');
    await emailService.sendDailyOrdersEmail(orders);
    
    console.log('🎉 Test email sent successfully!');
    console.log(`📊 Email included ${orders.length} orders from today`);
    console.log(`📧 Orders are grouped by shipping method with urgent orders at the top!`);
    
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error('Full error:', error);
  }
}

sendTestEmail();
