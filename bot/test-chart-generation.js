// Test script for chart generation
const chartGenerator = require('./chartGenerator');

async function test() {
  console.log('🧪 Testing Chart Generator\n');
  console.log('━'.repeat(60) + '\n');

  try {
    // Initialize
    await chartGenerator.init();
    
    // Generate 3 random segments
    console.log('Generating 3 random chart segments:\n');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`Test ${i}:`);
      const segment = chartGenerator.generateRandomSegment();
      
      console.log(`  📅 Time range: ${segment.metadata.startTime} → ${segment.metadata.endTime}`);
      console.log(`  📊 Visible candles: ${segment.visibleCandles.length}`);
      console.log(`  🙈 Hidden candles: ${segment.hiddenCandles.length}`);
      console.log(`  💰 Last visible price: $${segment.metadata.lastVisiblePrice.toFixed(2)}`);
      console.log(`  🎯 Actual outcome: ${segment.metadata.direction.toUpperCase()}`);
      console.log(`  📈 Price change: ${segment.metadata.percentChange}%`);
      console.log('');
    }
    
    console.log('✅ Chart generation test passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
