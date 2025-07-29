const express = require('express');
const serverless = require('serverless-http');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

// --- LÓGICA DO SCRAPER ---
async function scrapeRoletaBrasileira() {
  console.log('Iniciando o scraper...');
  let browser = null;
  try {
    // Adiciona fontes para o chromium funcionar corretamente no ambiente Lambda
    await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/main/NotoSansCJK-Regular.ttc');
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(randomUseragent.getRandom());
    
    const url = 'https://www.tipminer.com/br/historico/pragmatic/roleta-brasileira';
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
    
    console.log(`Scraper finalizado. ${results.length} resultados encontrados.`);
    return results;

  } catch (error) {
    console.error('Erro durante o scrapping:', error);
    // Retorna um array vazio em caso de erro para não quebrar a aplicação cliente
    return [];
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Dados de Jogos (Ao Vivo)',
      version: '1.0.0',
      description: 'API que utiliza web scraping para fornecer dados históricos de jogos em tempo real.',
    },
    servers: [{ url: `/api` }], // Assumindo que a API é servida a partir de /api
  },
  // O caminho para o arquivo que contém as anotações do Swagger
  apis: ['./netlify/functions/api.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /roleta-brasileira:
 * get:
 * summary: "Obtém os dados mais recentes da Roleta Brasileira."
 * description: "Executa o scraper em tempo real para buscar e retornar os últimos resultados do jogo."
 * responses:
 * '200':
 * description: "Uma lista de resultados da roleta."
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * type: object
 * properties:
 * numero:
 * type: string
 * example: "14"
 * cor:
 * type: string
 * example: "red"
 * '500':
 * description: "Falha durante o processo de scraping."
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: "Falha ao buscar os dados."
 */
app.get('/roleta-brasileira', async (req, res) => {
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

app.get('/', (req, res) => {
    res.json({ message: 'API de Scrapping de Jogos está no ar! Acesse /docs para ver a documentação.'});
});

// Exporta o handler para o ambiente serverless
module.exports.handler = serverless(app);
