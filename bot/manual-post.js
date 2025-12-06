// Manual post script - posts a single tweet for testing
const chartGenerator = require('./chartGenerator');
const screenshotService = require('./screenshotService');
const twitterService = require('./twitterService');
const storage = require('./storage');
const config = require('./config');

async function manualPost() {
  console.log('📤 Manual Post Test\n');
  console.log('━'.repeat(60) + '\n');

  try {
    // Initialize services
    console.log('Initializing services...');
    await storage.init();
    await chartGenerator.init();
    await screenshotService.init();
    twitterService.init();
    console.log('✅ Services initialized\n');

    // Generate chart
    console.log('Generating chart segment...');
    const segment = chartGenerator.generateRandomSegment();
    console.log(`✅ Segment: ${segment.metadata.direction.toUpperCase()} (${segment.metadata.percentChange}%)\n`);

    // Capture screenshot
    console.log('Capturing screenshot...');
    const chartConfig = chartGenerator.getChartConfig(segment.visibleCandles);
    const screenshot = await screenshotService.captureChart(chartConfig);
    const filename = `manual_test_${Date.now()}.png`;
    const filepath = await screenshotService.saveScreenshot(screenshot, filename);
    console.log(`✅ Screenshot saved: ${filepath}\n`);

    // Generate poll text
    const pollText = twitterService.generatePollText();
    const pollOptions = config.messages.poll.options;
    
    console.log('Poll details:');
    console.log(`  Text: "${pollText}"`);
    console.log(`  Options: ${pollOptions.join(', ')}\n`);

    // Confirm before posting
    console.log('⚠️  This will post a real tweet to Twitter!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Post to Twitter
    console.log('Posting to Twitter...');
    const tweet = await twitterService.postPollWithImage(screenshot, pollText, pollOptions);
    console.log(`✅ Tweet posted: https://twitter.com/i/web/status/${tweet.data.id}\n`);

    // Store poll data
    await storage.addPoll({
      tweetId: tweet.data.id,
      chartData: segment.metadata,
      pollText,
      filename,
      filepath,
    });
    console.log('✅ Poll data stored\n');

    // Generate and display result text (for manual follow-up)
    const resultText = twitterService.generateResultText(
      segment.metadata.direction,
      segment.metadata.percentChange
    );
    
    console.log('━'.repeat(60));
    console.log('\n📊 RESULT PREVIEW (for follow-up in 1 hour):\n');
    console.log(resultText);
    console.log('\n━'.repeat(60) + '\n');

    console.log(`✅ Manual post completed!`);
    console.log(`\n🔗 Tweet URL: https://twitter.com/i/web/status/${tweet.data.id}`);
    console.log(`⏰ Post the result text above as a reply in 1 hour\n`);

    // Cleanup
    await screenshotService.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Manual post failed:', error);
    await screenshotService.close();
    process.exit(1);
  }
}

manualPost();
