const { Coordinate } = require('./base.js');
const puppeteer = require('puppeteer');

const webpage = 'http://escale.minedu.gob.pe/PadronWeb/info/ce?cod_mod=__CODMOD__&anexo=0';

async function perform(modularcode) {
  console.log('performing census : '+modularcode);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-setuid-sandbox"],
    'ignoreHTTPSErrors': true
    });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
  await page.setRequestInterception(true);
  const block_ressources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
  page.on('request', request => {      
    if (block_ressources.indexOf(request.resourceType) > 0)
      request.abort();
    else
      request.continue();
  });

  url = webpage;
  url = url.replaceAll('__CODMOD__', modularcode);
  await page.setDefaultNavigationTimeout(10000); 
  await page.goto(url);
    
  await page.waitForNavigation({waitUntil: 'networkidle2'});
  
  let latitude = await page.evaluate(el => el.textContent, await page.$('#nlatitud'))
  let longitude = await page.evaluate(el => el.textContent, await page.$('#nlongitud'))
  
  await browser.close();

  return {coordinate : new Coordinate(latitude, longitude)};
}

module.exports = { perform };
