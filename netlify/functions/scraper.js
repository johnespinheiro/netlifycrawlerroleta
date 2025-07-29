const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async function(event, context) {
  console.info(">>> ROTA /api/roleta-brasileira ACIONADA <<<");
  console.info("--- INICIANDO SCRAPER ---");
  try {
    console.log("[LOG] Lançando o browser...");

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.tipminer.com/br/historico/pragmatic/roleta-brasileira", { waitUntil: "networkidle0" });

    const content = await page.content();
    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Scraper executado com sucesso!", htmlLength: content.length })
    };

  } catch (error) {
    console.error("!!! ERRO NO SCRAPER !!!", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};