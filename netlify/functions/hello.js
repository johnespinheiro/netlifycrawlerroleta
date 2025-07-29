// netlify/functions/hello.js
// Uma função serverless padrão, sem Express ou outras dependências.
exports.handler = async (event, context) => {
  // Este log DEVE aparecer se a função for executada.
  console.log(">>> A FUNÇÃO 'hello' FOI EXECUTADA COM SUCESSO! <<<");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: "Olá do teste definitivo! A função foi executada." }),
  };
};
