const express = require('express');
const serverless = require('serverless-http');
// As dependências de scraping foram comentadas para o teste
// const chromium = require('@sparticuz/chromium');
// const puppeteer = require('puppeteer-core');
// const cheerio = require('cheerio');
// const randomUseragent = require('random-useragent');

// --- LÓGICA DO SCRAPER (VERSÃO DE TESTE) ---
// A função original foi substituída por uma função de teste que não usa puppeteer.
async function scrapeRoletaBrasileira() {
  console.log('--- EXECUTANDO SCRAPER DE TESTE ---');
  // Retorna um resultado fixo para simular um sucesso.
  const fakeResults = [
    { numero: '10', cor: 'black' },
    { numero: '25', cor: 'red' },
    { numero: '0', cor: 'green' },
  ];
  console.log(`--- SCRAPER DE TESTE FINALIZADO. ${fakeResults.length} resultados falsos encontrados. ---`);
  return Promise.resolve(fakeResults);
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();

// Endpoint principal que retorna os dados do scraper
app.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> [TESTE] Recebida requisição para /roleta-brasileira');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    console.error('!!! [TESTE] ERRO NO HANDLER DA ROTA !!!', error);
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

// Endpoint raiz para verificar se a API está no ar
app.get('/', (req, res) => {
    console.log('>>> [TESTE] Recebida requisição para /');
    res.json({ message: 'API de Scrapping de Jogos (MODO DE TESTE) está no ar!'});
});

// Exporta o handler para o ambiente serverless
module.exports.handler = serverless(app);
