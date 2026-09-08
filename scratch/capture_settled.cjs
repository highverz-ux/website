const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:5173/?no-intro';
  const outPath = process.argv[3] || 'scratch/coolvetica_desktop_settled.png';
  const width = parseInt(process.argv[4]) || 1440;
  const height = parseInt(process.argv[5]) || 900;

  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    `--window-size=${width},${height}`,
    targetUrl
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const list = JSON.parse(data);
        const page = list.find(p => p.type === 'page');
        if (!page) {
          console.log('No page found');
          chromeProcess.kill();
          return;
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);

        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({
            id: 0,
            method: 'Emulation.setDeviceMetricsOverride',
            params: {
              width: width,
              height: height,
              deviceScaleFactor: 1,
              mobile: width < 768
            }
          }));

          // Wait 2800ms for intro & GSAP settled state
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 2,
              method: 'Page.captureScreenshot',
              params: { format: 'png' }
            }));
          }, 2800);
        });

        ws.addEventListener('message', (event) => {
          const res = JSON.parse(event.data);
          if (res.id === 2) {
            const buffer = Buffer.from(res.result.data, 'base64');
            fs.writeFileSync(outPath, buffer);
            console.log('Saved ' + outPath);
            ws.close();
            chromeProcess.kill();
            process.exit(0);
          }
        });

        ws.addEventListener('error', (err) => {
          console.error('WS Error:', err);
          chromeProcess.kill();
        });
      } catch (e) {
        console.error('Error parsing list:', e);
        chromeProcess.kill();
      }
    });
  }).on('error', (e) => {
    console.error('HTTP Error:', e);
    chromeProcess.kill();
  });
}

main();
