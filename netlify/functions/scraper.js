const express = require('express');
const serverless = require('serverless-http');

// --- LÓGICA DO SCRAPER (VERSÃO DE TESTE) ---
async function scrapeRoletaBrasileira() {
  console.log('--- EXECUTANDO SCRAPER DE TESTE (SEM PUPPETEER) ---');
  // Retorna um resultado fixo para simular um sucesso.
  const fakeResults = [
    { numero: '10', cor: 'black' },
    { numero: '25', cor: 'red' },
    { numero: '0', cor: 'green' },
  ];
  return Promise.resolve(fakeResults);
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();

app.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> Recebida requisição para /api/roleta-brasileira (MODO DE TESTE)');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

module.exports.handler = serverless(app);