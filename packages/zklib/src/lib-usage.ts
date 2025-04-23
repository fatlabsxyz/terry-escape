const alicia = new Worker("alicia.js", { type: 'module' });
const brenda = new Worker("brenda.js", { type: 'module' });

alicia.addEventListener('message', event => brenda.postMessage(event.data));
brenda.addEventListener('message', event => alicia.postMessage(event.data));

alicia.addEventListener('message', event => console.log('[alicia]', event.data));
brenda.addEventListener('message', event => console.log('[brenda]', event.data));

await new Promise(r => setTimeout(r, 5_000));
alicia.postMessage('genesis')
brenda.postMessage('genesis')
