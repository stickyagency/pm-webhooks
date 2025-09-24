/**
 * Debug cron endpoint - helps diagnose why cron isn't running
 * GET /api/debug-cron - shows cron configuration and environment status
 */
module.exports = async (req, res) => {
  try {
    const now = new Date();
    const utcTime = now.toISOString();
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Check if this is running in Vercel
    const isVercel = !!process.env.VERCEL;
    const vercelRegion = process.env.VERCEL_REGION;
    const vercelEnv = process.env.VERCEL_ENV;
    
    // Check environment variables
    const envStatus = {
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: !!process.env.SENDGRID_FROM_EMAIL,
      SENDGRID_TO_EMAIL: !!process.env.SENDGRID_TO_EMAIL,
      BIGCOMMERCE_STORE_HASH: !!process.env.BIGCOMMERCE_STORE_HASH,
      BIGCOMMERCE_ACCESS_TOKEN: !!process.env.BIGCOMMERCE_ACCESS_TOKEN,
      NODE_ENV: process.env.NODE_ENV
    };
    
    // Test BigCommerce connection
    let bigCommerceTest = { status: 'not_tested', error: null };
    try {
      const BigCommerceService = require('../services/bigcommerce');
      const bc = new BigCommerceService();
      const orders = await bc.getAllOrdersWithShipping();
      bigCommerceTest = { 
        status: 'success', 
        ordersCount: orders.length,
        hasOrdersToday: orders.length > 0
      };
    } catch (error) {
      bigCommerceTest = { 
        status: 'error', 
        error: error.message 
      };
    }
    
    // Test email service
    let emailTest = { status: 'not_tested', error: null };
    try {
      const EmailService = require('../services/email');
      const email = new EmailService();
      // Don't actually send email, just test initialization
      emailTest = { status: 'initialized' };
    } catch (error) {
      emailTest = { 
        status: 'error', 
        error: error.message 
      };
    }
    
    res.status(200).json({
      success: true,
      timestamp: utcTime,
      etTime: etTime.toISOString(),
      vercel: {
        isVercel,
        region: vercelRegion,
        environment: vercelEnv,
        note: isVercel ? 'Running on Vercel' : 'NOT running on Vercel - cron will not work'
      },
      cron: {
        schedule: '0 21 * * * (9pm UTC / 4pm ET)',
        shouldHaveRunToday: etTime.getHours() >= 16, // 4pm ET
        nextRunUTC: '21:00 UTC daily',
        nextRunET: '4:00 PM ET daily'
      },
      environment: envStatus,
      services: {
        bigCommerce: bigCommerceTest,
        email: emailTest
      },
      recommendations: getRecommendations(isVercel, envStatus, bigCommerceTest, emailTest),
      manualTest: {
        testEmail: '/api/test-email',
        testEmailWithOrders: '/api/test-email?orders=true',
        manualCron: '/api/cron/daily-orders',
        cronStatus: '/api/cron/status'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

function getRecommendations(isVercel, envStatus, bigCommerceTest, emailTest) {
  const recommendations = [];
  
  if (!isVercel) {
    recommendations.push('❌ NOT RUNNING ON VERCEL - Cron jobs only work on Vercel');
  }
  
  if (!envStatus.SENDGRID_API_KEY) {
    recommendations.push('❌ Missing SENDGRID_API_KEY environment variable');
  }
  
  if (!envStatus.BIGCOMMERCE_STORE_HASH) {
    recommendations.push('❌ Missing BIGCOMMERCE_STORE_HASH environment variable');
  }
  
  if (!envStatus.BIGCOMMERCE_ACCESS_TOKEN) {
    recommendations.push('❌ Missing BIGCOMMERCE_ACCESS_TOKEN environment variable');
  }
  
  if (bigCommerceTest.status === 'error') {
    recommendations.push(`❌ BigCommerce API error: ${bigCommerceTest.error}`);
  }
  
  if (emailTest.status === 'error') {
    recommendations.push(`❌ Email service error: ${emailTest.error}`);
  }
  
  if (bigCommerceTest.status === 'success' && bigCommerceTest.ordersCount === 0) {
    recommendations.push('⚠️ No orders found for today - email would not be sent');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed - cron should be working');
    recommendations.push('💡 If cron still not working, you may need Vercel Pro for cron jobs');
  }
  
  return recommendations;
}
