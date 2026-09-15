const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "Backend dos Desafios de Programação funcionando!"
    });
});

app.post("/executar", async (req, res) => {
    const codigo = req.body.codigo;

    if (!codigo) {
        return res.status(400).json({
            erro: "Nenhum código foi enviado."
        });
    }

    try {
        const resposta = await fetch("https://api.onecompiler.com/v1/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.ONECOMPILER_API_KEY
            },
            body: JSON.stringify({
                language: "c",
                stdin: "",
                files: [
                    {
                        name: "main.c",
                        content: codigo
                    }
                ]
            })
        });

        const resultado = await resposta.json();

        res.json(resultado);

    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao executar o código.",
            detalhes: erro.message
        });
    }
});

app.get("/testar-ia", async (req, res) => {

    try {

        const resposta = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    model: "gemini-3.6-flash",
                    input: "Responda apenas: A conexão com a IA funcionou!"
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json({
                erro: "Erro na API Gemini.",
                detalhes: resultado
            });
        }

        const texto =
            resultado.steps
                ?.filter(step => step.type === "model_output")
                ?.flatMap(step => step.content || [])
                ?.find(content => content.type === "text")
                ?.text;

        res.json({
            sucesso: true,
            resposta: texto,
            respostaCompleta: resultado
        });

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao conectar com a IA.",
            detalhes: erro.message
        });

    }
});

app.post("/gerar-desafio", async (req, res) => {

    const dificuldade = req.body.dificuldade;
    const conteudos = req.body.conteudos;

    if (!dificuldade || !conteudos || conteudos.length === 0) {
        return res.status(400).json({
            erro: "Informe a dificuldade e pelo menos um conteúdo."
        });
    }

    const prompt = `
Você é um gerador de desafios de programação em C.

Gere UM único desafio de programação.

Dificuldade: ${dificuldade}

Conteúdos obrigatórios:
${conteudos.join(", ")}

REGRAS:
- O desafio deve realmente exigir o uso de todos os conteúdos informados.
- Não forneça código.
- Não forneça solução.
- Não forneça dicas de implementação.
- Não explique como resolver.
- Não faça introduções ou despedidas.
- Seja direto e conciso.
- O desafio deve ser adequado ao nível de dificuldade informado.

Use EXATAMENTE este formato:

Título:
[Nome do desafio]

Descrição:
[Descrição curta do problema]

Requisitos:
[Lista objetiva do que o programa deve fazer]

Entrada:
[O que o usuário deverá informar]

Saída:
[O que o programa deverá exibir]
`;

    try {

        const resposta = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    model: "gemini-3.6-flash",
                    input: prompt
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json({
                erro: "Erro na API Gemini.",
                detalhes: resultado
            });
        }

        const desafio =
            resultado.steps
                ?.filter(step => step.type === "model_output")
                ?.flatMap(step => step.content || [])
                ?.find(content => content.type === "text")
                ?.text;

        res.json({
            sucesso: true,
            desafio: desafio
        });

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao gerar desafio.",
            detalhes: erro.message
        });

    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
