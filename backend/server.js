const express = require("express");

const app = express();

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
