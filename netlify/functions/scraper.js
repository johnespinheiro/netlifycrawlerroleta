const express = require('express');
const serverless = require('serverless-http');

// --- LÓGICA DO SCRAPER (VERSÃO DE TESTE) ---
// Mantemos a versão de teste por agora para garantir que o encaminhamento funciona.
async function scrapeRoletaBrasileira() {
  console.log('--- EXECUTANDO SCRAPER DE TESTE (ROUTER ROBUSTO) ---');
  const fakeResults = [
    { numero: '10', cor: 'black' },
    { numero: '25', cor: 'red' },
    { numero: '0', cor: 'green' },
  ];
  return Promise.resolve(fakeResults);
}

// --- LÓGICA DA API (EXPRESS) ---
const app = express();
// Criamos um router dedicado para os nossos endpoints de API.
const router = express.Router();

// Adicionamos a nossa rota ao router.
// O caminho é relativo ao router, então usamos apenas '/roleta-brasileira'.
router.get('/roleta-brasileira', async (req, res) => {
  console.log('>>> ROTA /api/roleta-brasileira ACIONADA COM SUCESSO! <<<');
  try {
    const resultados = await scrapeRoletaBrasileira();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Falha ao buscar os dados.', error: error.message });
  }
});

// Montamos o nosso router na aplicação principal com o prefixo '/api'.
// Isto garante que a nossa aplicação sabe como lidar com o URL completo.
app.use('/api', router);

// Exportamos o handler para o ambiente serverless.
module.exports.handler = serverless(app);
