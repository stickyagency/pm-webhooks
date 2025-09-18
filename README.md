# Power Manufacturing Webhooks

A scalable webhook system for Power Manufacturing that handles order management and automated notifications. This system is designed to run on Vercel and can be easily extended with additional webhooks.

## Features

- **Daily Order Reports**: Automated daily emails at 4pm ET for orders with 1-2 day delivery
- **BigCommerce Integration**: Fetches orders and customer data from BigCommerce API
- **SendGrid Email Service**: Sends formatted HTML and text emails
- **Scalable Architecture**: Easy to add new webhooks and services
- **Health Monitoring**: Built-in health checks and error handling

## Project Structure

```
pm-webhooks/
├── api/
│   ├── cron/
│   │   └── daily-orders.js      # Daily cron job for order emails
│   └── webhooks/
│       └── index.js             # Main webhook router
├── config/
│   └── index.js                 # Configuration management
├── services/
│   ├── bigcommerce.js          # BigCommerce API service
│   └── email.js                # SendGrid email service
├── package.json
├── vercel.json                 # Vercel deployment config
└── README.md
```

## Setup Instructions

### 1. Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required environment variables:
- `BIGCOMMERCE_STORE_HASH`: Your BigCommerce store hash
- `BIGCOMMERCE_ACCESS_TOKEN`: BigCommerce API access token
- `SENDGRID_API_KEY`: SendGrid API key
- `SENDGRID_FROM_EMAIL`: Sender email address
- `SENDGRID_TO_EMAIL`: Recipient email address

### 2. BigCommerce Setup

1. Go to your BigCommerce store admin
2. Navigate to **Advanced Settings > API Accounts**
3. Create a new API account with the following scopes:
   - `store_v2_orders` (read)
   - `store_v2_customers` (read)
   - `store_v2_products` (read)
4. Copy the store hash and access token

### 3. SendGrid Setup

1. Create a SendGrid account
2. Generate an API key with **Mail Send** permissions
3. Verify your sender email address

### 4. Local Development

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

### 5. Deployment to Vercel

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# or use Vercel CLI:
vercel env add BIGCOMMERCE_STORE_HASH
vercel env add BIGCOMMERCE_ACCESS_TOKEN
vercel env add SENDGRID_API_KEY
vercel env add SENDGRID_FROM_EMAIL
vercel env add SENDGRID_TO_EMAIL
```

## API Endpoints

### Cron Jobs

- **`/api/cron/daily-orders`** (GET)
  - Runs automatically at 4pm ET daily
  - Fetches orders with 1-2 day delivery
  - Sends email notification

### Webhooks

- **`/api/webhooks/test-email`** (POST)
  - Send a test email
  - Body: `{ "to": "email@example.com" }`

- **`/api/webhooks/manual-orders`** (POST)
  - Manually trigger order check and email
  - No body required

- **`/api/webhooks/health`** (GET)
  - Health check endpoint
  - Tests BigCommerce connection

## How It Works

### Daily Order Processing

1. **Cron Trigger**: Vercel cron job runs at 4pm ET (9pm UTC)
2. **Order Fetching**: Queries BigCommerce for orders from last 24 hours
3. **Filtering**: Identifies orders with 1-2 day delivery based on:
   - Shipping method names containing keywords like "1 day", "2 day", "express", "overnight"
   - Order notes containing delivery keywords
4. **Email Generation**: Creates formatted HTML and text emails
5. **Delivery**: Sends email via SendGrid

### Order Detection Logic

The system identifies fast delivery orders by checking:
- Shipping method names for keywords: "1 day", "2 day", "next day", "overnight", "express", "rush", "priority", "expedited"
- Order staff notes for delivery keywords
- Case-insensitive matching

## Adding New Webhooks

To add a new webhook:

1. Create a new handler function in `/api/webhooks/index.js`
2. Add routing logic in the main handler
3. Create any necessary services in `/services/`
4. Update this README with the new endpoint

Example:
```javascript
// In /api/webhooks/index.js
else if (url.includes('/new-webhook')) {
  return await handleNewWebhook(req, res);
}

async function handleNewWebhook(req, res) {
  // Your webhook logic here
}
```

## Monitoring and Debugging

### Logs
- Check Vercel function logs in the Vercel dashboard
- All functions include console.log statements for debugging

### Health Checks
- Use `/api/webhooks/health` to verify service connectivity
- Test email functionality with `/api/webhooks/test-email`

### Manual Testing
- Use `/api/webhooks/manual-orders` to manually trigger the daily process
- Test BigCommerce connection through health check

## Troubleshooting

### Common Issues

1. **BigCommerce API Errors**
   - Verify store hash and access token
   - Check API account permissions
   - Ensure store is not in maintenance mode

2. **SendGrid Errors**
   - Verify API key has correct permissions
   - Check sender email is verified
   - Ensure recipient email is valid

3. **Cron Job Not Running**
   - Verify Vercel cron configuration in `vercel.json`
   - Check Vercel deployment logs
   - Ensure function is deployed correctly

### Environment Variables
Make sure all required environment variables are set in Vercel:
- Go to Vercel dashboard → Project → Settings → Environment Variables
- Add all variables from `env.example`

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Test individual components using the webhook endpoints
3. Verify all environment variables are correctly set

## License

MIT License - Power Manufacturing
