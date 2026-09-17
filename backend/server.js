const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ======================================================
// CONFIGURAÇÕES DOS MODELOS
// ======================================================

const OPENROUTER_MODEL = "qwen/qwen3-coder:free";
const GROQ_MODEL = "openai/gpt-oss-120b";


// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {
    res.json({
        mensagem: "Backend dos Desafios de Programação funcionando!"
    });
});


// ======================================================
// EXECUTAR CÓDIGO C
// ======================================================

app.post("/executar", async (req, res) => {

    const codigo = req.body.codigo;

    if (!codigo) {
        return res.status(400).json({
            erro: "Nenhum código foi enviado."
        });
    }

    try {

        const resposta = await fetch(
            "https://api.onecompiler.com/v1/run",
            {
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
            }
        );

        const resultado = await resposta.json();

        res.json(resultado);

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao executar o código.",
            detalhes: erro.message
        });

    }
});


// ======================================================
// TESTAR CONEXÃO COM OPENROUTER
// ======================================================

app.get("/testar-ia", async (req, res) => {

    try {

        const resposta = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                },

                body: JSON.stringify({
                    model: OPENROUTER_MODEL,

                    messages: [
                        {
                            role: "user",
                            content: "Responda apenas: A conexão com a IA funcionou!"
                        }
                    ]
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {

            return res.status(resposta.status).json({
                erro: "Erro na API OpenRouter.",
                detalhes: resultado
            });

        }

        const texto =
            resultado.choices?.[0]?.message?.content;

        res.json({
            sucesso: true,
            resposta: texto,
            modelo: OPENROUTER_MODEL,
            respostaCompleta: resultado
        });

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao conectar com a IA.",
            detalhes: erro.message
        });

    }
});


// ======================================================
// GERAR DESAFIO COM OPENROUTER
// ======================================================

app.post("/gerar-desafio", async (req, res) => {

    const dificuldade = req.body.dificuldade;
    const conteudos = req.body.conteudos;

    if (
        !dificuldade ||
        !conteudos ||
        conteudos.length === 0
    ) {

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
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                },

                body: JSON.stringify({

                    model: OPENROUTER_MODEL,

                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]

                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {

            return res.status(resposta.status).json({
                erro: "Erro na API OpenRouter.",
                detalhes: resultado
            });

        }

        const desafio =
            resultado.choices?.[0]?.message?.content;

        res.json({
            sucesso: true,
            desafio: desafio,
            modelo: OPENROUTER_MODEL
        });

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao gerar desafio.",
            detalhes: erro.message
        });

    }
});


// ======================================================
// ANALISAR CÓDIGO COM GROQ
// ======================================================

app.post("/analisar-codigo", async (req, res) => {

    const desafio = req.body.desafio;
    const codigo = req.body.codigo;

    if (!desafio || !codigo) {

        return res.status(400).json({
            erro: "Desafio e código são obrigatórios."
        });

    }

    const prompt = `
Você é um avaliador rigoroso de soluções de programação em C.

Sua tarefa é analisar o código enviado pelo usuário e verificar se ele realmente resolve o desafio proposto.

DESAFIO:

${desafio}

CÓDIGO DO USUÁRIO:

${codigo}

ANALISE:

1. Verifique cada requisito do desafio individualmente.
2. Verifique se a lógica do programa realmente resolve o problema.
3. Verifique se o comportamento do programa corresponde à entrada e à saída especificadas.
4. Verifique se existem erros lógicos.
5. Verifique se existe algum requisito que não foi atendido.
6. Não aprove um código apenas porque ele parece correto.
7. Se houver uma falha relevante, o desafio deve ser reprovado.
8. Considere também erros que fariam o programa produzir resultados incorretos.
9. Não exija uma implementação específica se diferentes implementações forem válidas.
10. Não penalize diferenças apenas de estilo.
11. Não forneça uma solução completa para o usuário.
12. Explique de forma objetiva os problemas encontrados.

IMPORTANTE:

A aprovação deve ocorrer somente quando o código realmente atender aos requisitos do desafio.

Retorne SOMENTE um JSON válido, sem markdown e sem texto antes ou depois.

Use EXATAMENTE esta estrutura:

{
    "aprovado": true,
    "requisitos": [
        {
            "descricao": "Descrição do requisito",
            "atendido": true,
            "justificativa": "Explicação objetiva"
        }
    ],
    "problemas": [
        "Problema encontrado"
    ],
    "resumo": "Resumo final da análise"
}

O campo "aprovado" deve ser true somente se todos os requisitos relevantes forem atendidos.

O campo "problemas" deve ser uma lista vazia quando não houver problemas.

No campo "requisitos", analise todos os requisitos encontrados no desafio.
`;

    try {

        const resposta = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({

                    model: GROQ_MODEL,

                    messages: [
                        {
                            role: "system",
                            content: "Você é um avaliador rigoroso de código C."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0

                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {

            return res.status(resposta.status).json({
                erro: "Erro na API Groq.",
                detalhes: resultado
            });

        }

        const texto =
            resultado.choices?.[0]?.message?.content;

        if (!texto) {

            return res.status(500).json({
                erro: "A IA não retornou uma análise."
            });

        }

        let analise;

        try {

            analise = JSON.parse(texto);

        } catch (erroJSON) {

            return res.status(500).json({
                erro: "A IA retornou uma resposta que não pôde ser interpretada como JSON.",
                respostaIA: texto
            });

        }

        res.json({
            sucesso: true,
            analise: analise,
            modelo: GROQ_MODEL
        });

    } catch (erro) {

        res.status(500).json({
            erro: "Erro ao analisar o código.",
            detalhes: erro.message
        });

    }
});


// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor iniciado na porta ${PORT}`
    );

});
