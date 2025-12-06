const chartGenerator = require('./chartGenerator');
const screenshotService = require('./screenshotService');
const twitterService = require('./twitterService');
const scheduler = require('./scheduler');
const storage = require('./storage');
const config = require('./config');

class TwitterBot {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    console.log('🤖 Initializing Twitter Bot...\n');

    try {
      // Initialize all services
      await storage.init();
      await chartGenerator.init();
      await screenshotService.init();
      twitterService.init();

      this.isInitialized = true;
      console.log('\n✅ Bot initialized successfully!\n');
    } catch (error) {
      console.error('\n❌ Bot initialization failed:', error);
      throw error;
    }
  }

  async createAndPostPoll() {
    console.log('📊 Creating new poll...\n');

    try {
      // 1. Generate random chart segment
      console.log('1️⃣  Generating random chart segment...');
      const segment = chartGenerator.generateRandomSegment();
      console.log(`   📈 Selected segment: ${segment.metadata.startTime} to ${segment.metadata.endTime}`);
      console.log(`   💰 Price: $${segment.metadata.lastVisiblePrice.toFixed(2)}`);
      console.log(`   🎯 Actual outcome: ${segment.metadata.direction.toUpperCase()} (${segment.metadata.percentChange}%)\n`);

      // 2. Generate chart config for screenshot
      console.log('2️⃣  Preparing chart for screenshot...');
      const chartConfig = chartGenerator.getChartConfig(segment.visibleCandles);

      // 3. Capture screenshot
      console.log('3️⃣  Capturing screenshot...');
      const screenshot = await screenshotService.captureChart(chartConfig);
      const timestamp = Date.now();
      const filename = `chart_${timestamp}.png`;
      const filepath = await screenshotService.saveScreenshot(screenshot, filename);
      console.log(`   📸 Screenshot saved: ${filepath}\n`);

      // 4. Generate poll text
      console.log('4️⃣  Generating poll text...');
      const pollText = twitterService.generatePollText();
      const pollOptions = config.messages.poll.options;
      console.log(`   📝 Poll text: "${pollText}"\n`);

      // 5. Post to Twitter
      console.log('5️⃣  Posting to Twitter...');
      const tweet = await twitterService.postPollWithImage(
        screenshot,
        pollText,
        pollOptions
      );
      console.log(`   🐦 Tweet posted: ${tweet.data.id}\n`);

      // 6. Store poll data
      console.log('6️⃣  Storing poll data...');
      const pollData = await storage.addPoll({
        tweetId: tweet.data.id,
        chartData: segment.metadata,
        pollText,
        filename,
        filepath,
      });
      console.log(`   💾 Poll data stored\n`);

      // 7. Schedule follow-up
      console.log('7️⃣  Scheduling follow-up...');
      scheduler.scheduleFollowUp(tweet.data.id, this.postFollowUp.bind(this));
      console.log(`   ⏰ Follow-up scheduled for ${config.bot.pollDurationMinutes} minutes\n`);

      console.log('✅ Poll created and posted successfully!\n');
      console.log('━'.repeat(60) + '\n');

      return pollData;
    } catch (error) {
      console.error('❌ Failed to create and post poll:', error);
      throw error;
    }
  }

  async postFollowUp(tweetId) {
    console.log(`📢 Posting follow-up for tweet ${tweetId}...\n`);

    try {
      // 1. Get poll data
      const poll = await storage.getPollByTweetId(tweetId);
      if (!poll) {
        throw new Error(`Poll not found for tweet ${tweetId}`);
      }

      // 2. Generate result text
      const resultText = twitterService.generateResultText(
        poll.chartData.direction,
        poll.chartData.percentChange
      );

      console.log(`📝 Result text: "${resultText}"\n`);

      // 3. Post reply
      await twitterService.replyToTweet(tweetId, resultText);

      // 4. Update poll status
      await storage.updatePollStatus(tweetId, 'completed', {
        resultText,
        postedAt: new Date().toISOString(),
      });

      console.log('✅ Follow-up posted successfully!\n');
      console.log('━'.repeat(60) + '\n');
    } catch (error) {
      console.error(`❌ Failed to post follow-up for tweet ${tweetId}:`, error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      await this.init();
    }

    console.log('🚀 Starting Twitter Bot...\n');
    console.log(`📅 Schedule: Every ${config.bot.scheduleHours} hours`);
    console.log(`⏱️  Poll duration: ${config.bot.pollDurationMinutes} minutes`);
    console.log(`🔗 Referral link: ${config.referralLink}`);
    console.log(`🧪 Dry run mode: ${config.bot.dryRun ? 'ENABLED' : 'DISABLED'}\n`);
    console.log('━'.repeat(60) + '\n');

    // Post immediately on start
    console.log('📤 Posting initial poll...\n');
    await this.createAndPostPoll();

    // Schedule recurring posts
    scheduler.scheduleMainJob(async () => {
      await this.createAndPostPoll();
    });

    scheduler.start();

    console.log('✅ Bot is running! Press Ctrl+C to stop.\n');
  }

  async stop() {
    console.log('\n🛑 Stopping Twitter Bot...\n');
    
    scheduler.stopAll();
    await screenshotService.close();
    
    console.log('✅ Bot stopped successfully!\n');
    process.exit(0);
  }
}

// Main execution
const bot = new TwitterBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await bot.stop();
});

process.on('SIGTERM', async () => {
  await bot.stop();
});

// Start the bot
bot.start().catch(async (error) => {
  console.error('💥 Fatal error:', error);
  await bot.stop();
  process.exit(1);
});

module.exports = bot;
