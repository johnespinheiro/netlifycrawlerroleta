const express = require('express');
const serverless = require('serverless-http');

// --- LÓGICA DA API (EXPRESS) ---
const app = express();

// Endpoint de teste
app.get('/roleta-brasileira', (req, res) => {
  console.log('>>> ROTA DE TESTE FINAL /roleta-brasileira ACIONADA <<<');
  const fakeResults = [
    { numero: '10', cor: 'black' },
    { numero: '25', cor: 'red' },
    { numero: '0', cor: 'green' },
  ];
  res.status(200).json(fakeResults);
});

// Endpoint raiz para verificar se a API está no ar
app.get('/', (req, res) => {
    console.log('>>> ROTA DE TESTE FINAL / ACIONADA <<<');
    res.json({ message: 'API de Scrapping (TESTE FINAL) está no ar!'});
});

// Exporta o handler para o ambiente serverless
module.exports.handler = serverless(app);
