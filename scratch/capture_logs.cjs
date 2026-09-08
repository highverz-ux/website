const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:5173/why-us.html';
  
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
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
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        });

        ws.addEventListener('message', (event) => {
          const data = event.data;
          const msg = JSON.parse(data);
          if (msg.method === 'Runtime.consoleAPICalled') {
            const args = msg.params.args.map(a => a.value || a.description).join(' ');
            console.log(`[CONSOLE ${msg.params.type.toUpperCase()}] ${args}`);
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            console.log(`[EXCEPTION] ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ''}`);
          }
        });

        setTimeout(() => {
          ws.close();
          chromeProcess.kill();
        }, 5000);

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
