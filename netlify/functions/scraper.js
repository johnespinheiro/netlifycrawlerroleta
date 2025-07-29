const express = require('express');
const serverless = require('serverless-http');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

async function scrapeRoletaBrasileira() {
  console.log('--- INICIANDO SCRAPER ---');
  let browser = null;

  try {
    console.log('[LOG] Lançando o browser...');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(randomUseragent.getRandom());

    const url = 'https://www.tipminer.com/br/historico/pragmatic/roleta-brasileira';
    console.log(`[LOG] Acessando: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('.roulette-history-container', { timeout: 30000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const results = [];
    $('.roulette-single-history-item').each((index, element) => {
      const item = $(element);
      const numero = item.text().trim();
      let cor = 'desconhecida';

      if (item.hasClass('roulette-single-history-item--red')) cor = 'red';
      else if (item.hasClass('roulette-single-history-item--black')) cor = 'black';
      else if (item.hasClass('roulette-single-history-item--green')) cor = 'green';

      if (numero) results.push({ numero, cor });
    });

    console.log(`[LOG] ${results.length} resultados encontrados.`);
    return results;

  } catch (error) {
    console.error('!!! ERRO NO SCRAPER !!!', error);
    return [];
  } finally {
    if (browser !== null) {
      console.log('[LOG] Fechando o browser...');
      await browser.close();
    }
  }
}

// --- Express + Serverless Wrapper ---
const app = express();
const router = express.Router();

router.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> ROTA /api/roleta-brasileira ACIONADA <<<');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados', error: error.message });
  }
});

app.use('/api', router);
module.exports.handler = serverless(app);
