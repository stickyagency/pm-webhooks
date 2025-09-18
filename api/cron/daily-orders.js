const BigCommerceService = require('../../services/bigcommerce');
const EmailService = require('../../services/email');

/**
 * Daily orders cron job - runs at 4pm ET (9pm UTC)
 * Fetches orders with 1-2 day delivery and sends email notification
 */
module.exports = async (req, res) => {
  try {
    console.log('Starting daily orders cron job...');
    
    const bigCommerceService = new BigCommerceService();
    const emailService = new EmailService();
    
    // Fetch all orders with shipping information
    const orders = await bigCommerceService.getAllOrdersWithShipping();
    
    console.log(`Found ${orders.length} total orders`);
    
    // Only send email if there are orders
    if (orders.length === 0) {
      console.log('No orders found for today - skipping email');
      res.status(200).json({
        success: true,
        message: 'No orders found for today - email not sent',
        ordersCount: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Send email notification with all orders grouped by shipping method
    await emailService.sendDailyOrdersEmail(orders);
    
    res.status(200).json({
      success: true,
      message: 'Daily orders email sent successfully',
      ordersCount: orders.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in daily orders cron job:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process daily orders',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
