const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  console.log(">>> ROTA /api/roleta-brasileira ACIONADA <<<");

  try {
    console.log("--- INICIANDO SCRAPER ---");
    console.log("[LOG] Lançando o browser...");

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://www.tipminer.com/br/historico/pragmatic/roleta-brasileira", {
      waitUntil: "networkidle2",
      timeout: 0
    });

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const resultados = [];

    $('tbody tr').each((index, element) => {
      const hora = $(element).find('td:nth-child(1)').text().trim();
      const resultado = $(element).find('td:nth-child(2)').text().trim();
      if (hora && resultado) {
        resultados.push({ hora, resultado });
      }
    });

    console.log(`[LOG] ${resultados.length} resultados coletados.`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: resultados.length,
        data: resultados
      })
    };

  } catch (err) {
    console.error("!!! ERRO NO SCRAPER !!!", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};