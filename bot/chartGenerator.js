const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

class ChartGenerator {
  constructor() {
    this.btcData = null;
  }

  async init() {
    try {
      const dataPath = path.resolve(config.paths.btcData);
      const data = await fs.readFile(dataPath, 'utf8');
      const rawData = JSON.parse(data);
      
      // Convert array format to object format
      // Format: [timestamp, open, high, low, close, volume, ...]
      this.btcData = rawData.map(candle => ({
        time: Math.floor(candle[0] / 1000), // Convert ms to seconds for lightweight-charts
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
      
      console.log(`✅ Loaded ${this.btcData.length} BTC candles`);
    } catch (error) {
      console.error('❌ Failed to load BTC data:', error);
      throw error;
    }
  }

  generateRandomSegment() {
    if (!this.btcData || this.btcData.length === 0) {
      throw new Error('BTC data not loaded');
    }

    const totalCandles = config.chart.candleCount;
    const hiddenCandles = config.chart.hiddenCandles;
    const requiredCandles = totalCandles + hiddenCandles;

    // Ensure we have enough data
    if (this.btcData.length < requiredCandles) {
      throw new Error(`Not enough data. Need ${requiredCandles}, have ${this.btcData.length}`);
    }

    // Select random starting point
    const maxStartIndex = this.btcData.length - requiredCandles;
    const startIndex = Math.floor(Math.random() * maxStartIndex);
    const endIndex = startIndex + requiredCandles;

    // Extract segment
    const fullSegment = this.btcData.slice(startIndex, endIndex);
    const visibleSegment = fullSegment.slice(0, totalCandles);
    const hiddenSegment = fullSegment.slice(totalCandles);

    // Calculate statistics
    const lastVisibleCandle = visibleSegment[visibleSegment.length - 1];
    const lastHiddenCandle = hiddenSegment[hiddenSegment.length - 1];
    
    const priceChange = lastHiddenCandle.close - lastVisibleCandle.close;
    const percentChange = ((priceChange / lastVisibleCandle.close) * 100).toFixed(2);

    // Determine direction
    let direction = 'sideways';
    if (Math.abs(percentChange) > 0.5) {
      direction = percentChange > 0 ? 'long' : 'short';
    }

    return {
      visibleCandles: visibleSegment,
      hiddenCandles: hiddenSegment,
      metadata: {
        startIndex,
        endIndex,
        startTime: visibleSegment[0].time,
        endTime: lastHiddenCandle.time,
        lastVisiblePrice: lastVisibleCandle.close,
        lastHiddenPrice: lastHiddenCandle.close,
        priceChange,
        percentChange: parseFloat(percentChange),
        direction,
        timestamp: new Date().toISOString(),
      },
    };
  }

  getChartConfig(candles) {
    return {
      candles: candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
      width: config.chart.width,
      height: config.chart.height,
    };
  }
}

module.exports = new ChartGenerator();
