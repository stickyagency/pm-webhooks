const sgMail = require('@sendgrid/mail');
const config = require('../config');

class EmailService {
  constructor() {
    sgMail.setApiKey(config.sendgrid.apiKey);
  }

  /**
   * Send daily orders email
   * @param {Array} orders - Array of orders to include in email
   * @returns {Promise<Object>} SendGrid response
   */
  async sendDailyOrdersEmail(orders) {
    try {
      // Don't send email if there are no orders
      if (!orders || orders.length === 0) {
        console.log('No orders to send - skipping email');
        return { message: 'No orders found - email not sent' };
      }

      const emailContent = this.generateOrdersEmailContent(orders);
      
      const msg = {
        to: config.sendgrid.toEmail,
        from: {
          email: config.sendgrid.fromEmail,
          name: 'Power Manufacturing Orders'
        },
        subject: `Daily Orders Summary Report - ${new Date().toLocaleDateString()}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const response = await sgMail.send(msg);
      console.log('Daily orders email sent successfully');
      return response;
    } catch (error) {
      console.error('Error sending daily orders email:', error.message);
      throw error;
    }
  }

  /**
   * Generate HTML content for orders email
   * @param {Array} orders - Array of orders
   * @returns {Object} HTML and text content
   */
  generateOrdersEmailContent(orders) {
    if (orders.length === 0) {
      return {
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <tr>
              <td>
                <h2 style="color: #333; margin: 0; font-family: Arial, sans-serif;">Power Manufacturing - Daily Orders Report</h2>
                <p style="color: #333; margin: 15px 0; font-family: Arial, sans-serif;">No orders found for today.</p>
                <p style="color: #333; margin: 0; font-family: Arial, sans-serif;">Date: ${new Date().toLocaleDateString()}</p>
              </td>
            </tr>
          </table>
        `,
        text: `Power Manufacturing - Daily Orders Report\n\nNo orders found for today.\nDate: ${new Date().toLocaleDateString()}`
      };
    }

    // Separate urgent orders from others
    const urgentOrders = orders.filter(order => {
      const shippingMethod = this.getShippingMethod(order).toLowerCase();
      return shippingMethod.includes('next day air') || shippingMethod.includes('2nd day air');
    });

    const otherOrders = orders.filter(order => {
      const shippingMethod = this.getShippingMethod(order).toLowerCase();
      return !shippingMethod.includes('next day air') && !shippingMethod.includes('2nd day air');
    });

    // Group other orders by shipping method
    const ordersByShipping = {};
    otherOrders.forEach(order => {
      const shippingMethod = this.getShippingMethod(order);
      if (!ordersByShipping[shippingMethod]) {
        ordersByShipping[shippingMethod] = [];
      }
      ordersByShipping[shippingMethod].push(order);
    });

    // Generate urgent orders section
    let urgentOrdersHtml = '';
    if (urgentOrders.length > 0) {
      urgentOrdersHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
          <tr>
            <td>
              <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #fff3cd; border: 2px solid #ffc107;">
                <tr>
                  <td>
                    <h3 style="color: #333; margin: 0; font-size: 20px; font-family: Arial, sans-serif;">
                      🚨 URGENT - 1 Day or 2 Day Shipping
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    ${urgentOrders.map(order => this.formatSimpleOrder(order)).join('<br>')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    } else {
      urgentOrdersHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
          <tr>
            <td>
              <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
                <tr>
                  <td>
                    <h3 style="color: #333; margin: 0; font-size: 20px; font-family: Arial, sans-serif;">
                      🚨 URGENT - 1 Day or 2 Day Shipping
                    </h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    <p style="color: #333; margin: 0; font-family: Arial, sans-serif;">No urgent shipping items</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }

    // Generate other orders sections
    let otherOrdersHtml = '';
    if (Object.keys(ordersByShipping).length > 0) {
      otherOrdersHtml = Object.entries(ordersByShipping).map(([shippingMethod, methodOrders]) => `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h4 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">
                      ${shippingMethod}
                    </h4>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 0 0;">
              ${methodOrders.map(order => this.formatSimpleOrder(order)).join('<br>')}
            </td>
          </tr>
        </table>
      `).join('');
    }
    
    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <h2 style="color: #333; margin: 0; font-family: Arial, sans-serif;">
                    Power Manufacturing - Daily Orders Report
                  </h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 0;">
                  <p style="color: #333; margin: 0; font-family: Arial, sans-serif;">
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                    <strong>Total Orders:</strong> ${orders.length}<br>
                    <strong>Urgent Orders:</strong> ${urgentOrders.length}
                  </p>
                </td>
              </tr>
            </table>
            
            ${urgentOrdersHtml}
            ${otherOrdersHtml}
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 40px 0 0 0;">
              <tr>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #999; font-family: Arial, sans-serif;">
                    This is an automated report from Power Manufacturing's order management system.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const text = this.generateTextContent(orders);

    return { html, text };
  }

  /**
   * Format simple order (Name - Order ID)
   * @param {Object} order - Order object
   * @returns {string} HTML string
   */
  formatSimpleOrder(order) {
    const billingAddress = order.billing_address || {};
    const customerName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'N/A';
    
    return `${customerName} - Order #${order.id}`;
  }

  /**
   * Format urgent order as HTML with order link
   * @param {Object} order - Order object
   * @returns {string} HTML string
   */
  formatUrgentOrderHtml(order) {
    const orderDate = new Date(order.date_created).toLocaleString();
    const total = parseFloat(order.total_inc_tax || 0).toFixed(2);
    const shippingMethod = this.getShippingMethod(order);
    
    // Safe access to billing address
    const billingAddress = order.billing_address || {};
    const billingName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'N/A';
    const billingEmail = billingAddress.email || 'N/A';
    const billingPhone = billingAddress.phone || 'N/A';
    
    // Create order link (you'll need to replace with your actual BigCommerce admin URL)
    const orderLink = `https://store-${process.env.BIGCOMMERCE_STORE_HASH}.mybigcommerce.com/admin/orders/${order.id}`;
    
    return `
      <div style="background-color: #fff; border: 1px solid #ffc107; border-radius: 5px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="color: #856404; margin: 0; font-size: 18px;">
            <a href="${orderLink}" style="color: #856404; text-decoration: none;">
              Order #${order.id} - ${billingName}
            </a>
          </h4>
          <span style="background-color: #ffc107; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${shippingMethod}
          </span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
          <div>
            <strong>Customer:</strong> ${billingName}<br>
            <strong>Email:</strong> ${billingEmail}<br>
            <strong>Phone:</strong> ${billingPhone}
          </div>
          <div>
            <strong>Order Date:</strong> ${orderDate}<br>
            <strong>Total:</strong> $${total}<br>
            <strong>Status:</strong> ${order.status || 'Unknown'}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 10px;">
          <a href="${orderLink}" style="background-color: #856404; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Order in BigCommerce
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Format individual order as HTML
   * @param {Object} order - Order object
   * @returns {string} HTML string
   */
  formatOrderHtml(order) {
    const orderDate = new Date(order.date_created).toLocaleString();
    const total = parseFloat(order.total_inc_tax || 0).toFixed(2);
    
    // Safe access to billing address
    const billingAddress = order.billing_address || {};
    const billingName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'N/A';
    const billingEmail = billingAddress.email || 'N/A';
    const billingPhone = billingAddress.phone || 'N/A';
    
    // Safe access to shipping address
    const shippingAddress = order.shipping_address || {};
    const shippingName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || 'N/A';
    const shippingAddress1 = shippingAddress.address_1 || '';
    const shippingAddress2 = shippingAddress.address_2 || '';
    const shippingCity = shippingAddress.city || '';
    const shippingState = shippingAddress.state || '';
    const shippingZip = shippingAddress.zip || '';
    
    return `
      <div style="border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 5px;">
        <h3 style="color: #007bff; margin-top: 0;">
          Order #${order.id} - ${order.status || 'Unknown'}
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <strong>Customer:</strong> ${billingName}<br>
            <strong>Email:</strong> ${billingEmail}<br>
            <strong>Phone:</strong> ${billingPhone}
          </div>
          <div>
            <strong>Order Date:</strong> ${orderDate}<br>
            <strong>Total:</strong> $${total}<br>
            <strong>Payment Method:</strong> ${order.payment_method || 'N/A'}
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Shipping Address:</strong><br>
          ${shippingName}<br>
          ${shippingAddress1}<br>
          ${shippingAddress2 ? shippingAddress2 + '<br>' : ''}
          ${shippingCity ? `${shippingCity}, ${shippingState} ${shippingZip}` : 'N/A'}
        </div>
        
        <div>
          <strong>Shipping Method:</strong> ${this.getShippingMethod(order)}<br>
          <strong>Shipping Cost:</strong> $${parseFloat(order.shipping_cost_inc_tax || 0).toFixed(2)}<br>
          ${order.staff_notes ? `<strong>Staff Notes:</strong> ${order.staff_notes}<br>` : ''}
          ${order.customer_message ? `<strong>Customer Message:</strong> ${order.customer_message}<br>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get shipping method from order
   * @param {Object} order - Order object
   * @returns {string} Shipping method description
   */
  getShippingMethod(order) {
    // Check if we have the shipping method directly
    if (order.shipping_method) {
      return order.shipping_method;
    }
    
    // Check shipping addresses
    if (order.shipping_addresses && order.shipping_addresses.length > 0) {
      return order.shipping_addresses[0].shipping_method || 'N/A';
    }
    
    // Check consignments
    if (order.consignments && order.consignments.length > 0) {
      const consignment = order.consignments[0];
      if (consignment.shipping_method) {
        return consignment.shipping_method;
      }
    }
    
    // Check shipping methods array
    if (order.shipping_methods && order.shipping_methods.length > 0) {
      return order.shipping_methods[0].method || 'N/A';
    }
    
    return 'N/A';
  }

  /**
   * Generate plain text content for orders email
   * @param {Array} orders - Array of orders
   * @returns {string} Text content
   */
  generateTextContent(orders) {
    if (orders.length === 0) {
      return `Power Manufacturing - Daily Orders Report\n\nNo orders found for today.\nDate: ${new Date().toLocaleDateString()}`;
    }

    // Separate urgent orders from others
    const urgentOrders = orders.filter(order => {
      const shippingMethod = this.getShippingMethod(order).toLowerCase();
      return shippingMethod.includes('next day air') || shippingMethod.includes('2nd day air');
    });

    const otherOrders = orders.filter(order => {
      const shippingMethod = this.getShippingMethod(order).toLowerCase();
      return !shippingMethod.includes('next day air') && !shippingMethod.includes('2nd day air');
    });

    // Group other orders by shipping method
    const ordersByShipping = {};
    otherOrders.forEach(order => {
      const shippingMethod = this.getShippingMethod(order);
      if (!ordersByShipping[shippingMethod]) {
        ordersByShipping[shippingMethod] = [];
      }
      ordersByShipping[shippingMethod].push(order);
    });

    let text = `Power Manufacturing - Daily Orders Report\n\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Total Orders: ${orders.length}\n\n`;

    // Urgent orders section
    text += `🚨 URGENT - 1 Day or 2 Day Shipping\n`;
    if (urgentOrders.length > 0) {
      urgentOrders.forEach(order => {
        const billingAddress = order.billing_address || {};
        const customerName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'N/A';
        text += `  ${customerName} - Order #${order.id}\n`;
      });
    } else {
      text += `  No urgent shipping items\n`;
    }
    text += `\n\n`;

    // Other orders by shipping method
    Object.entries(ordersByShipping).forEach(([shippingMethod, methodOrders]) => {
      text += `${shippingMethod}\n`;
      methodOrders.forEach(order => {
        const billingAddress = order.billing_address || {};
        const customerName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'N/A';
        text += `  ${customerName} - Order #${order.id}\n`;
      });
      text += `\n`;
    });

    return text;
  }

  /**
   * Send test email
   * @param {string} to - Recipient email
   * @returns {Promise<Object>} SendGrid response
   */
  async sendTestEmail(to) {
    try {
      const msg = {
        to,
        from: {
          email: config.sendgrid.fromEmail,
          name: 'Power Manufacturing Orders'
        },
        subject: 'Power Manufacturing Webhooks - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Test Email</h2>
            <p>This is a test email from Power Manufacturing's webhook system.</p>
            <p>If you're receiving this, the email configuration is working correctly!</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        `,
        text: `Test Email\n\nThis is a test email from Power Manufacturing's webhook system.\nIf you're receiving this, the email configuration is working correctly!\nTime: ${new Date().toLocaleString()}`
      };

      const response = await sgMail.send(msg);
      console.log('Test email sent successfully');
      return response;
    } catch (error) {
      console.error('Error sending test email:', error.message);
      throw error;
    }
  }
}

module.exports = EmailService;
