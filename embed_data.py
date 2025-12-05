import json
import os

# Read the JSON data
with open('btc_data.json', 'r') as f:
    raw_data = json.load(f)

# Format data: [time, open, high, low, close]
# Raw: [time, open, high, low, close, volume, ...]
# We need to convert strings to floats and time to seconds
formatted_data = []
for d in raw_data:
    formatted_data.append({
        'time': int(d[0] / 1000),
        'open': float(d[1]),
        'high': float(d[2]),
        'low': float(d[3]),
        'close': float(d[4])
    })

# Create the JS string
js_data_const = f"const historicalData = {json.dumps(formatted_data)};"

# Read index.html
with open('index.html', 'r') as f:
    html_content = f.read()

# We need to replace the Data Fetching and Dummy Data sections
# and update the Initialization and loadScenario

# Construct the new script part
new_script_start = """
    <script>
        // --- Configuration ---
        const REFERRAL_LINK = 'https://trader.ftmo.com/?affiliates=AbMCGTkBZWBCZJUpDrBM'; // FTMO affiliate link
        const INITIAL_BALANCE = 10000; // Virtual balance
        const LEVERAGE = 10; // 10x leverage for excitement

        // --- State ---
        let chart, candleSeries, tpLine, slLine;
        let currentScenario = null;
        let currentDirection = 'long';
        let entryPrice = 0;
        let tpPrice = 0;
        let slPrice = 0;
        let isPlaying = false;
        let animationInterval;
        let futureData = [];
        let currentIndex = 0;

        // --- Historical Data ---
"""

new_script_end = """
        // --- Initialization ---
        window.onload = function() {
            initChart();
            loadScenario();
            
            // Show toast hint
            setTimeout(() => {
                document.getElementById('toast').classList.add('visible');
                setTimeout(() => document.getElementById('toast').classList.remove('visible'), 3000);
            }, 1000);
        };

        function initChart() {
            const container = document.getElementById('chart-container');
            chart = LightweightCharts.createChart(container, {
                layout: {
                    background: { color: '#1e222d' },
                    textColor: '#d1d4dc',
                },
                grid: {
                    vertLines: { color: '#2B2B43' },
                    horzLines: { color: '#2B2B43' },
                },
                rightPriceScale: {
                    borderColor: '#2B2B43',
                },
                timeScale: {
                    borderColor: '#2B2B43',
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                },
            });

            candleSeries = chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // Handle resize
            window.addEventListener('resize', () => {
                chart.resize(container.clientWidth, container.clientHeight);
            });
        }

        function loadScenario() {
            if (!historicalData || historicalData.length === 0) return;

            // Create a random scenario from the historical data
            // We need at least 100 candles: 70 past, 30 future
            const totalCandles = 100;
            const maxStartIndex = historicalData.length - totalCandles;
            const startIndex = Math.floor(Math.random() * maxStartIndex);
            
            const scenarioData = historicalData.slice(startIndex, startIndex + totalCandles);
            
            // Determine date range for title
            const startDate = new Date(scenarioData[0].time * 1000).toLocaleDateString();
            const endDate = new Date(scenarioData[scenarioData.length - 1].time * 1000).toLocaleDateString();

            currentScenario = {
                title: `BTC/USDT (${startDate})`,
                description: `Historical price action from ${startDate} to ${endDate}.`,
                data: scenarioData
            };
            
            document.getElementById('scenario-title').innerText = currentScenario.title;

            // Split data 70/30
            const splitIndex = Math.floor(currentScenario.data.length * 0.7);
            const pastData = currentScenario.data.slice(0, splitIndex);
            futureData = currentScenario.data.slice(splitIndex);
            
            // Entry Price is the Close of the last visible candle
            entryPrice = pastData[pastData.length - 1].close;
            currentIndex = 0;

            candleSeries.setData(pastData);
            chart.timeScale().fitContent();

            // Reset UI
            resetControls();
            createTPSLLines();
        }

        function resetControls() {
            isPlaying = false;
            document.getElementById('btn-start').disabled = false;
            document.getElementById('btn-start').innerText = "START TRADING";
            document.getElementById('result-modal').classList.remove('visible');
            
            // Default sliders to +/- 5%
            const range = entryPrice * 0.1; // 10% range for sliders
            const tpSlider = document.getElementById('tp-slider');
            const slSlider = document.getElementById('sl-slider');
            
            // Configure slider ranges dynamically based on price
            const minPrice = entryPrice * 0.8;
            const maxPrice = entryPrice * 1.2;
            
            tpSlider.min = minPrice;
            tpSlider.max = maxPrice;
            slSlider.min = minPrice;
            slSlider.max = maxPrice;

            // Set default positions
            if (currentDirection === 'long') {
                tpSlider.value = entryPrice * 1.05;
                slSlider.value = entryPrice * 0.95;
            } else {
                tpSlider.value = entryPrice * 0.95;
                slSlider.value = entryPrice * 1.05;
            }
            
            updateTP(tpSlider.value);
            updateSL(slSlider.value);
        }

        function setDirection(dir) {
            if (isPlaying) return;
            currentDirection = dir;
            
            // Update UI buttons
            document.querySelector('.btn-direction.long').classList.toggle('active', dir === 'long');
            document.querySelector('.btn-direction.short').classList.toggle('active', dir === 'short');
            
            // Swap TP/SL values for convenience
            const tpVal = document.getElementById('tp-slider').value;
            const slVal = document.getElementById('sl-slider').value;
            
            // Simple logic: just reset to defaults to avoid confusion
            resetControls();
        }

        function createTPSLLines() {
            if (tpLine) candleSeries.removePriceLine(tpLine);
            if (slLine) candleSeries.removePriceLine(slLine);

            tpLine = candleSeries.createPriceLine({
                price: tpPrice,
                color: '#26a69a',
                lineWidth: 2,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'TP',
            });

            slLine = candleSeries.createPriceLine({
                price: slPrice,
                color: '#ef5350',
                lineWidth: 2,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'SL',
            });
        }

        function updateTP(val) {
            tpPrice = parseFloat(val);
            if (tpLine) tpLine.applyOptions({ price: tpPrice });
            updatePnL();
        }

        function updateSL(val) {
            slPrice = parseFloat(val);
            if (slLine) slLine.applyOptions({ price: slPrice });
            updatePnL();
        }

        function updatePnL() {
            // Calculate PnL for TP
            const tpDiff = currentDirection === 'long' ? (tpPrice - entryPrice) : (entryPrice - tpPrice);
            const tpPct = (tpDiff / entryPrice) * 100 * LEVERAGE;
            const tpAmt = (INITIAL_BALANCE * (tpPct / 100)).toFixed(0);
            
            const slDiff = currentDirection === 'long' ? (slPrice - entryPrice) : (entryPrice - slPrice);
            const slPct = (slDiff / entryPrice) * 100 * LEVERAGE;
            const slAmt = (INITIAL_BALANCE * (slPct / 100)).toFixed(0);

            const tpEl = document.getElementById('tp-pnl');
            const slEl = document.getElementById('sl-pnl');

            tpEl.innerText = `${tpAmt >= 0 ? '+' : ''}$${tpAmt} (${tpPct.toFixed(1)}%)`;
            tpEl.className = `pnl-preview ${tpAmt >= 0 ? 'profit' : 'loss'}`;

            slEl.innerText = `${slAmt >= 0 ? '+' : ''}$${slAmt} (${slPct.toFixed(1)}%)`;
            slEl.className = `pnl-preview ${slAmt >= 0 ? 'profit' : 'loss'}`;
        }

        // --- Game Logic ---
        function startGame() {
            if (isPlaying) return;
            isPlaying = true;
            document.getElementById('btn-start').disabled = true;
            document.getElementById('btn-start').innerText = "TRADING IN PROGRESS...";
            
            // Disable controls
            document.getElementById('tp-slider').disabled = true;
            document.getElementById('sl-slider').disabled = true;

            animationInterval = setInterval(() => {
                if (currentIndex >= futureData.length) {
                    finishGame('draw');
                    return;
                }

                const candle = futureData[currentIndex];
                candleSeries.update(candle);
                currentIndex++;

                // Check Win/Loss
                const high = candle.high;
                const low = candle.low;

                if (currentDirection === 'long') {
                    if (low <= slPrice) { finishGame('loss'); return; }
                    if (high >= tpPrice) { finishGame('win'); return; }
                } else {
                    if (high >= slPrice) { finishGame('loss'); return; }
                    if (low <= tpPrice) { finishGame('win'); return; }
                }

            }, 100); // 100ms per candle
        }

        function finishGame(result) {
            clearInterval(animationInterval);
            
            let pnl = 0;
            let pnlPct = 0;
            
            if (result === 'win') {
                // Calculate based on TP
                const diff = Math.abs(tpPrice - entryPrice);
                pnlPct = (diff / entryPrice) * 100 * LEVERAGE;
                pnl = INITIAL_BALANCE * (pnlPct / 100);
            } else if (result === 'loss') {
                // Calculate based on SL
                const diff = Math.abs(slPrice - entryPrice);
                pnlPct = -(diff / entryPrice) * 100 * LEVERAGE; // Negative
                pnl = INITIAL_BALANCE * (pnlPct / 100);
            } else {
                // Draw (end of data) - calculate based on last close
                const lastClose = futureData[futureData.length - 1].close;
                const diff = currentDirection === 'long' ? (lastClose - entryPrice) : (entryPrice - lastClose);
                pnlPct = (diff / entryPrice) * 100 * LEVERAGE;
                pnl = INITIAL_BALANCE * (pnlPct / 100);
            }

            // Update Modal
            const modal = document.getElementById('result-modal');
            const icon = document.getElementById('result-icon');
            const title = document.getElementById('result-title');
            const amount = document.getElementById('result-amount');
            const desc = document.getElementById('result-desc');
            const link = document.getElementById('referral-link');

            if (pnl >= 0) {
                icon.innerText = "🚀";
                title.innerText = "PROFIT!";
                title.style.color = "var(--accent-green)";
                amount.style.color = "var(--accent-green)";
                link.innerText = "Trade Like a Pro (Sign Up)";
            } else {
                icon.innerText = "📉";
                title.innerText = "STOPPED OUT";
                title.style.color = "var(--accent-red)";
                amount.style.color = "var(--accent-red)";
                link.innerText = "Learn Risk Management (Sign Up)";
            }

            amount.innerText = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)} (${pnlPct.toFixed(1)}%)`;
            desc.innerText = `${currentScenario.description}\\n\\nEntry: $${entryPrice.toFixed(2)}\\nExit: $${(result === 'win' ? tpPrice : (result === 'loss' ? slPrice : futureData[futureData.length-1].close)).toFixed(2)}`;
            
            link.href = REFERRAL_LINK;
            modal.classList.add('visible');
        }

        function resetGame() {
            document.getElementById('tp-slider').disabled = false;
            document.getElementById('sl-slider').disabled = false;
            loadScenario();
        }

    </script>
"""

# Find the start of the script tag
script_start_idx = html_content.find('<script>')
script_end_idx = html_content.rfind('</script>') + 9

# Combine everything
new_html = html_content[:script_start_idx] + new_script_start + js_data_const + new_script_end + html_content[script_end_idx:]

with open('index.html', 'w') as f:
    f.write(new_html)

print("Successfully updated index.html with embedded historical data.")
