const fetch = require('node-fetch');
const apiId = 'vk2ll5vkyn5l73d';
const apiSecret = '80diafu7oa2caik8t5j6qs1kcrecqq848703rttr7941h449bgn1';
const auth = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
console.log('Authorization header:', `Basic ${auth}`);
fetch('https://vectorizer.ai/api/v1/vectorize', {
  method: 'POST',
  headers: { 'Authorization': `Basic ${auth}` },
  body: Buffer.from([0])
}).then(res => res.text()).then(console.log);