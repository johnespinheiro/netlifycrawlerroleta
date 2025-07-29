const express = require('express');
const serverless = require('serverless-http');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

// --- LÓGICA DO SCRAPER ---
async function scrapeRoletaBrasileira() {
  console.log('--- INICIANDO SCRAPER ---');
  let browser = null;
  try {
    // A linha abaixo foi removida pois o link estava quebrado (erro 404)
    // await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/main/NotoSansCJK-Regular.ttc');
    
    console.log('[LOG] 1. Lançando o browser com Puppeteer...');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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
    console.log('[LOG] 7. Conteúdo obtido. Processando com Cheerio...');
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
    // Log do erro completo para depuração
    console.error('!!! ERRO CRÍTICO DURANTE O SCRAPPING !!!', error);
    // Retorna um array vazio em caso de erro para não quebrar a aplicação cliente
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

// Endpoint principal que retorna os dados do scraper
app.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> Recebida requisição para /roleta-brasileira');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    console.error('!!! ERRO NO HANDLER DA ROTA !!!', error);
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

// Endpoint raiz para verificar se a API está no ar
// O caminho correto para acessar será: https://seu-site.netlify.app/.netlify/functions/api
app.get('/', (req, res) => {
    console.log('>>> Recebida requisição para /');
    res.json({ message: 'API de Scrapping de Jogos está no ar!'});
});

// Exporta o handler para o ambiente serverless
module.exports.handler = serverless(app);
