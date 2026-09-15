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


// TESTE DA IA
app.get("/testar-ia", async (req, res) => {

    try {

        const resposta = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: "Responda apenas: A conexão com a IA funcionou!"
                                }
                            ]
                        }
                    ]
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
            resultado.candidates?.[0]?.content?.parts?.[0]?.text;

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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
