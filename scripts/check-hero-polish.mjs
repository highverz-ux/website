import fs from 'node:fs/promises';
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(msg.error) : p.resolve(msg.result); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(arg => arg.value || arg.description));
});
const send = (method, params = {}) => new Promise((resolve,reject) => { pending.set(++id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); });
const evaluate = async expression => (await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result?.value;
const settle = () => evaluate('new Promise(r=>setTimeout(r,2000))');
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:5173'});
await settle();
await settle();
await fs.mkdir('/private/tmp/highverz-polish',{recursive:true});
for (const theme of ['dark','light']) {
  await evaluate(`document.documentElement.setAttribute('data-theme','${theme}')`);
  await settle();
  const shot = await send('Page.captureScreenshot',{format:'png'});
  await fs.writeFile(`/private/tmp/highverz-polish/${theme}.png`,Buffer.from(shot.data,'base64'));
}
await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1250,y:320});
await settle();
for (let index = 0; index < 4; index++) {
  await evaluate(`document.querySelectorAll('.floating-badge-item')[${index}].dispatchEvent(new PointerEvent('pointerenter'))`);
  await evaluate('new Promise(r=>setTimeout(r,350))');
  await evaluate(`document.querySelectorAll('.floating-badge-item')[${index}].dispatchEvent(new PointerEvent('pointerleave'))`);
}
await evaluate('window.scrollTo(0,400)');
await settle();
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await evaluate('window.scrollTo(0,0)');
await settle();
await evaluate('document.getElementById("hv-canvas-container").scrollIntoView({block:"center"})');
await settle();
const shot = await send('Page.captureScreenshot',{format:'png'});
await fs.writeFile('/private/tmp/highverz-polish/mobile.png',Buffer.from(shot.data,'base64'));
console.log(JSON.stringify({errors,metrics:await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:document.querySelector(".hv-webgl-canvas").getBoundingClientRect().toJSON()})')}));
await send('Browser.close');
ws.close();
