const BigCommerceService = require('../../services/bigcommerce');
const EmailService = require('../../services/email');

/**
 * External cron endpoint for cron-job.org
 * This endpoint is designed to be called by external cron services
 * GET /api/cron/external - triggers daily orders email
 */
module.exports = async (req, res) => {
  const startTime = new Date();
  const etTime = new Date(startTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  console.log(`[EXTERNAL-CRON] Starting daily orders job at ${startTime.toISOString()} (${etTime.toLocaleString()})`);
  
  try {
    // Validate environment variables
    const requiredEnvVars = ['SENDGRID_API_KEY', 'BIGCOMMERCE_STORE_HASH', 'BIGCOMMERCE_ACCESS_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    const bigCommerceService = new BigCommerceService();
    const emailService = new EmailService();
    
    console.log('[EXTERNAL-CRON] Fetching orders from BigCommerce...');
    const orders = await bigCommerceService.getAllOrdersWithShipping();
    
    console.log(`[EXTERNAL-CRON] Found ${orders.length} orders for today`);
    
    // Send email with orders (even if no orders, the email service handles this)
    console.log('[EXTERNAL-CRON] Sending daily orders email...');
    await emailService.sendDailyOrdersEmail(orders);
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log(`[EXTERNAL-CRON] Daily orders job completed successfully in ${duration}ms`);
    
    // Return success response for cron-job.org
    res.status(200).json({
      success: true,
      message: 'Daily orders email sent successfully',
      ordersCount: orders.length,
      duration: `${duration}ms`,
      timestamp: endTime.toISOString(),
      etTime: etTime.toISOString(),
      service: 'cron-job.org'
    });
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.error(`[EXTERNAL-CRON] Error in daily orders job after ${duration}ms:`, error);
    console.error('[EXTERNAL-CRON] Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: endTime.toISOString()
    });
    
    // Return error response for cron-job.org
    res.status(500).json({
      success: false,
      message: 'Failed to process daily orders',
      error: error.message,
      duration: `${duration}ms`,
      timestamp: endTime.toISOString(),
      etTime: etTime.toISOString(),
      service: 'cron-job.org'
    });
  }
};
