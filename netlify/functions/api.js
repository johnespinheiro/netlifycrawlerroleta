const express = require('express');
const serverless = require('serverless-http');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

// --- LÓGICA DO BANCO DE DADOS (DATABASE.JS) ---
const storagePath = process.env.NETLIFY ? path.join('/tmp', 'jogos.db') : './jogos.db';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false,
});
const RoletaResultado = sequelize.define('RoletaResultado', {
  numero: { type: DataTypes.STRING, allowNull: false },
  cor: { type: DataTypes.STRING, allowNull: false },
});
async function initializeDatabase() {
  try {
    await sequelize.sync();
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

// --- LÓGICA DO SCRAPER (SCRAPER.JS) ---
async function scrapeRoletaBrasileira() {
  console.log('Iniciando o scraper...');
  let browser = null;
  try {
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
    return [];
  } finally {
    if (browser !== null) await browser.close();
  }
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();

app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
  } catch (error) {
    return res.status(500).json({ message: "Erro crítico ao inicializar o banco de dados." });
  }
  next();
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Dados de Jogos',
      version: '1.0.0',
      description: 'API que utiliza web scraping para fornecer dados históricos de jogos.',
    },
    servers: [{ url: `/api` }],
  },
  apis: ['netlify/functions/api.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.post('/update-data', async (req, res) => {
  try {
    const results = await scrapeRoletaBrasileira();
    if (results && results.length > 0) {
      await RoletaResultado.destroy({ where: {} });
      await RoletaResultado.bulkCreate(results);
      res.status(200).json({ message: `Dados atualizados com sucesso! ${results.length} resultados salvos.` });
    } else {
      res.status(500).json({ message: 'Nenhum dado foi encontrado durante o scrapping.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Falha ao atualizar os dados.', error: error.message });
  }
});

app.get('/roleta-brasileira', async (req, res) => {
  try {
    const resultados = await RoletaResultado.findAll({ order: [['id', 'ASC']] });
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

app.get('/', (req, res) => {
    res.json({ message: 'API de Scrapping de Jogos está no ar! Acesse /api/docs para ver a documentação.'});
});

module.exports.handler = serverless(app);
