require('dotenv').config();

module.exports = {
  // Twitter API Configuration
  twitter: {
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  },

  // Bot Configuration
  bot: {
    scheduleHours: parseInt(process.env.BOT_SCHEDULE_HOURS || '4'),
    pollDurationMinutes: parseInt(process.env.BOT_POLL_DURATION_MINUTES || '60'),
    dryRun: process.env.BOT_DRY_RUN === 'true',
  },

  // Referral Link
  referralLink: process.env.REFERRAL_LINK || 'https://the100candles.com',

  // Server Configuration
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  // Chart Configuration
  chart: {
    candleCount: 100,
    hiddenCandles: 1,
    width: 1200,
    height: 675,
  },

  // Puppeteer Configuration
  puppeteer: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  // Message Templates
  messages: {
    poll: {
      templates: [
        "📊 What's your move here?\n\n🟢 Long or 🔴 Short?\n\nVote now! 👇\n\n#Bitcoin #BTC #Crypto #Trading #PriceAction #Altcoins",
        "🎯 Chart challenge!\n\nWhich way is this going?\n\n📈 Long vs 📉 Short\n\nMake your call! 👇\n\n#Bitcoin #BTC #Crypto #Trading #PriceAction #Altcoins",
        "⚡ Quick decision time!\n\nBullish or Bearish?\n\n🟢 Long | 🔴 Short\n\nVote below! 👇\n\n#Bitcoin #BTC #Crypto #Trading #PriceAction #Altcoins",
        "🔥 Trading scenario!\n\nWhat would you do?\n\n📈 Go Long or 📉 Go Short?\n\nCast your vote! 👇\n\n#Bitcoin #BTC #Crypto #Trading #PriceAction #Altcoins",
        "💡 Test your skills!\n\nLong or Short?\n\nMake your prediction! 👇\n\n#Bitcoin #BTC #Crypto #Trading #PriceAction #Altcoins",
      ],
      options: ['🟢 Long', '🔴 Short'],
      aggroTags: ['#GEM', '#100x', '#BullRun', '#BearMarket'],
    },
    
    results: {
      long_win: [
        "🎉 The bulls were right!\n\n📈 Price pumped {percent}%!\n\nWant to catch moves like this in real-time? 👇\n{referral}",
        "💚 Long traders crushed it!\n\n🚀 +{percent}% move!\n\nLearn to spot these setups: 👇\n{referral}",
        "✅ Bulls dominated!\n\n📊 Chart went up {percent}%\n\nMaster these patterns: 👇\n{referral}",
      ],
      short_win: [
        "🎯 The bears called it!\n\n📉 Price dumped {percent}%!\n\nCatch falling knives (safely) here: 👇\n{referral}",
        "❤️ Short sellers nailed it!\n\n💥 -{percent}% drop!\n\nProfit from both directions: 👇\n{referral}",
        "✅ Bears were right!\n\n📊 Chart dropped {percent}%\n\nLearn to short like a pro: 👇\n{referral}",
      ],
      sideways: [
        "😴 Choppy market!\n\nPrice moved only {percent}%\n\nAvoid the chop, find the trends: 👇\n{referral}",
        "📊 Range-bound action\n\n±{percent}% movement\n\nDiscover trending markets: 👇\n{referral}",
      ],
    },
  },

  // File Paths
  paths: {
    btcData: './btc_data.json',
    pollsData: './bot/polls.json',
    screenshots: './bot/screenshots',
    chartRenderPage: './bot/chart-render.html',
  },
};
