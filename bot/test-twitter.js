// Test script for Twitter API connection
const twitterService = require('./twitterService');

async function test() {
  console.log('🧪 Testing Twitter API Connection\n');
  console.log('━'.repeat(60) + '\n');

  try {
    // Initialize Twitter service
    console.log('Initializing Twitter service...');
    twitterService.init();
    console.log('✅ Twitter service initialized\n');

    // Test message generation
    console.log('Testing message generation:\n');
    
    console.log('Poll text examples:');
    for (let i = 0; i < 3; i++) {
      const pollText = twitterService.generatePollText();
      console.log(`  ${i + 1}. ${pollText}\n`);
    }

    console.log('Result text examples:');
    const scenarios = [
      { direction: 'long', percent: 2.5 },
      { direction: 'short', percent: -3.2 },
      { direction: 'sideways', percent: 0.3 },
    ];

    scenarios.forEach((scenario, i) => {
      const resultText = twitterService.generateResultText(scenario.direction, scenario.percent);
      console.log(`  ${i + 1}. ${scenario.direction.toUpperCase()} (${scenario.percent}%):`);
      console.log(`     ${resultText}\n`);
    });

    console.log('✅ Twitter API test passed!\n');
    console.log('⚠️  Note: This test does not actually post to Twitter.');
    console.log('   To test posting, use the manual-post.js script.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
