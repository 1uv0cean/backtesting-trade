# Twitter Bot for The100Candles

Automated Twitter bot that posts random historical chart segments with polls every 4 hours.

## Features

- 📊 Generates random historical BTC chart segments
- 📸 Captures high-quality chart screenshots with Puppeteer
- 🐦 Posts to Twitter with polls (Long vs Short)
- ⏰ Automatically posts follow-up with results after 1 hour
- 🔗 Includes referral link in follow-up tweets
- 📅 Runs every 4 hours (6 posts per day)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Twitter API credentials:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here

REFERRAL_LINK=https://your-referral-link.com
```

### 3. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Generate API keys and access tokens
4. Make sure your app has **Read and Write** permissions

## Usage

### Run the Bot

```bash
npm run bot
```

The bot will:
- Post immediately on start
- Schedule posts every 4 hours
- Automatically post follow-ups 1 hour after each poll

### Development Mode

Run with auto-restart on file changes:

```bash
npm run bot:dev
```

### Dry Run Mode

Test without actually posting to Twitter:

```bash
BOT_DRY_RUN=true npm run bot
```

## Testing

### Test Chart Generation

```bash
node bot/test-chart-generation.js
```

### Test Screenshot Capture

```bash
node bot/test-screenshot.js
```

This will save a test screenshot to `bot/screenshots/test_screenshot.png`.

### Test Twitter API

```bash
node bot/test-twitter.js
```

### Manual Single Post

Post one tweet manually for testing:

```bash
node bot/manual-post.js
```

⚠️ This will post a real tweet! You have 5 seconds to cancel.

## Configuration

### Customize Message Templates

Edit `bot/config.js` to customize:
- Poll text templates
- Result message templates
- Posting schedule
- Poll duration
- Chart dimensions

### Schedule Configuration

Default: Every 4 hours (6 posts per day)

To change, edit `.env`:

```env
BOT_SCHEDULE_HOURS=4
```

### Poll Duration

Default: 60 minutes

To change, edit `.env`:

```env
BOT_POLL_DURATION_MINUTES=60
```

## File Structure

```
bot/
├── index.js                 # Main bot orchestrator
├── config.js                # Configuration and message templates
├── chartGenerator.js        # Random chart segment generator
├── screenshotService.js     # Puppeteer screenshot capture
├── twitterService.js        # Twitter API integration
├── scheduler.js             # Cron job scheduler
├── storage.js               # Poll data persistence
├── chart-render.html        # Chart rendering page for screenshots
├── test-*.js                # Test scripts
├── manual-post.js           # Manual posting script
├── polls.json               # Poll data (auto-generated)
└── screenshots/             # Screenshot storage (auto-generated)
```

## Troubleshooting

### Puppeteer Issues

If Puppeteer fails to launch Chrome:

**macOS:**
```bash
# Install Chromium via Homebrew
brew install chromium
```

**Linux:**
```bash
# Install required dependencies
sudo apt-get install -y chromium-browser
```

### Twitter API Errors

- **401 Unauthorized**: Check your API credentials in `.env`
- **403 Forbidden**: Ensure your app has Read and Write permissions
- **429 Rate Limit**: You've hit Twitter's rate limit, wait before retrying

### Chart Generation Errors

- Ensure `btc_data.json` exists in the project root
- Check that the file contains valid JSON data

## Monitoring

The bot logs all activities to the console:
- ✅ Success messages
- ❌ Error messages
- 📊 Chart generation details
- 🐦 Tweet URLs
- ⏰ Scheduled job triggers

## Stopping the Bot

Press `Ctrl+C` to gracefully stop the bot. It will:
- Cancel all scheduled jobs
- Close the Puppeteer browser
- Save any pending data

## Data Storage

Poll data is stored in `bot/polls.json`:
- Tweet IDs
- Chart metadata
- Poll text
- Result data
- Timestamps

Screenshots are saved to `bot/screenshots/` (automatically cleaned up).

## License

ISC
