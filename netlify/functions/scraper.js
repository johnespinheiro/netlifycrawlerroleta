const express = require('express');
const serverless = require('serverless-http');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

// --- LÓGICA DO SCRAPER (VERSÃO REAL) ---
async function scrapeRoletaBrasileira() {
  console.log('--- INICIANDO SCRAPER REAL (VERSÕES ESTÁVEIS) ---');
  let browser = null;
  try {
    const minimal_args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--headless=new'
    ];

    console.log('[LOG] 1. Lançando o browser com Puppeteer e argumentos mínimos...');
    browser = await puppeteer.launch({
      args: minimal_args,
      executablePath: await chromium.executablePath(),
    });
    console.log('[LOG] 2. Browser lançado com sucesso.');

    const page = await browser.newPage();
    console.log('[LOG] 3. Nova página criada.');
    await page.setUserAgent(randomUseragent.getRandom());

    const url = 'https://www.tipminer.com/br/historico/pragmatic/roleta-brasileira';
    console.log(`[LOG] 4. Navegando para: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('[LOG] 5. Página carregada. Aguardando pelo seletor...');

    await page.waitForSelector('.roulette-history-container', { timeout: 30000 });
    console.log('[LOG] 6. Seletor encontrado. Obtendo conteúdo da página...');

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

    console.log(`[LOG] --- SCRAPER FINALIZADO. ${results.length} resultados encontrados. ---`);
    return results;

  } catch (error) {
    console.error('!!! ERRO CRÍTICO DURANTE O SCRAPPING !!!', error);
    return [];
  } finally {
    if (browser !== null) {
      console.log('[LOG] --- FECHANDO O BROWSER ---');
      await browser.close();
    }
  }
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();
const router = express.Router();

router.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> ROTA /api/roleta-brasileira ACIONADA (LÓGICA REAL) <<<');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

app.use('/api', router);

module.exports.handler = serverless(app);
