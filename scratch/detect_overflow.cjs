const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:5173/?no-intro';
  const outPath = process.argv[3] || 'scratch/real_mobile_nav_open.png';

  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
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
          // 1. Enable Mobile Device Emulation
          ws.send(JSON.stringify({
            id: 0,
            method: 'Emulation.setDeviceMetricsOverride',
            params: {
              width: 390,
              height: 844,
              deviceScaleFactor: 2,
              mobile: true
            }
          }));

          // 2. Click the mobile toggle after page load
          setTimeout(() => {
            const msg = {
              id: 1,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const toggle = document.getElementById('mobile-toggle');
                    if (toggle) toggle.click();
                    const overlay = document.getElementById('mobile-nav-overlay');
                    return JSON.stringify({
                      toggleFound: !!toggle,
                      overlayFound: !!overlay,
                      isOpen: overlay ? overlay.classList.contains('is-open') : false
                    });
                  })()
                `,
                returnByValue: true
              }
            };
            ws.send(JSON.stringify(msg));

            // Wait 500ms for open drawer transition to complete
            setTimeout(() => {
              ws.send(JSON.stringify({
                id: 2,
                method: 'Page.captureScreenshot',
                params: { format: 'png' }
              }));
            }, 500);
          }, 2000);
        });

        ws.addEventListener('message', (event) => {
          const res = JSON.parse(event.data);
          if (res.id === 1) {
            console.log('TOGGLE RESULT:', res.result.result.value);
          } else if (res.id === 2) {
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
