// Test script for screenshot service
const chartGenerator = require('./chartGenerator');
const screenshotService = require('./screenshotService');

async function test() {
  console.log('🧪 Testing Screenshot Service\n');
  console.log('━'.repeat(60) + '\n');

  try {
    // Initialize services
    console.log('Initializing services...');
    await chartGenerator.init();
    await screenshotService.init();
    console.log('✅ Services initialized\n');

    // Generate a chart segment
    console.log('Generating chart segment...');
    const segment = chartGenerator.generateRandomSegment();
    console.log(`✅ Generated segment: ${segment.metadata.direction.toUpperCase()} (${segment.metadata.percentChange}%)\n`);

    // Create chart config
    const chartConfig = chartGenerator.getChartConfig(segment.visibleCandles);
    
    // Capture screenshot
    console.log('Capturing screenshot...');
    const screenshot = await screenshotService.captureChart(chartConfig);
    console.log(`✅ Screenshot captured (${screenshot.length} bytes)\n`);

    // Save screenshot
    const filename = 'test_screenshot.png';
    const filepath = await screenshotService.saveScreenshot(screenshot, filename);
    console.log(`✅ Screenshot saved to: ${filepath}\n`);

    // Cleanup
    await screenshotService.close();
    
    console.log('✅ Screenshot test passed!\n');
    console.log(`📸 Check the screenshot at: ${filepath}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await screenshotService.close();
    process.exit(1);
  }
}

test();
