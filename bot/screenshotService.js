const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config');

class ScreenshotService {
  constructor() {
    this.browser = null;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
        timeout: 30000,
      });
      console.log('✅ Puppeteer browser launched');
    } catch (error) {
      console.error('❌ Failed to launch Puppeteer:', error.message);
      throw error;
    }
  }

  async captureChart(chartConfig) {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();
    
    try {
      // Set viewport to match chart dimensions
      await page.setViewport({
        width: chartConfig.width,
        height: chartConfig.height,
        deviceScaleFactor: 2, // For high-quality screenshots
      });

      // Load the chart render page
      const renderPagePath = path.resolve(config.paths.chartRenderPage);
      await page.goto(`file://${renderPagePath}`, {
        waitUntil: 'networkidle0',
      });

      // Inject chart data and render
      await page.evaluate((chartData) => {
        window.renderChart(chartData);
      }, chartConfig);

      // Wait for chart to be ready
      await page.waitForFunction(() => window.chartReady === true, {
        timeout: 10000,
      });

      // Give the chart a moment to fully render
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      await page.close();
      
      return screenshot;
    } catch (error) {
      await page.close();
      console.error('❌ Failed to capture screenshot:', error);
      throw error;
    }
  }

  async saveScreenshot(screenshot, filename) {
    const screenshotsDir = path.resolve(config.paths.screenshots);
    
    // Ensure directory exists
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    const filepath = path.join(screenshotsDir, filename);
    await fs.writeFile(filepath, screenshot);
    
    return filepath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Puppeteer browser closed');
    }
  }
}

module.exports = new ScreenshotService();
