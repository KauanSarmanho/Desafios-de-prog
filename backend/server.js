const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const OPENROUTER_MODEL = "openrouter/free";
const GROQ_MODEL = "openai/gpt-oss-120b";

app.get("/", (req, res) => {
    res.json({
        status: "online",
        versao: "0.95.9",
        mensagem: "Backend dos Desafios de Programação"
    });
});

app.get("/testar-ia", async (req, res) => {
    try {
        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({
                status: "erro",
                mensagem: "OPENROUTER_API_KEY não configurada."
            });
        }

        const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: "user",
                        content: "Responda apenas: IA funcionando."
                    }
                ]
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json({
                status: "erro",
                resultado
            });
        }

        res.json({
            status: "ok",
            resultado
        });
    } catch (erro) {
        console.error("Erro ao testar IA:", erro);

        res.status(500).json({
            status: "erro",
            mensagem: erro.message
        });
    }
});

app.post("/gerar-desafio", async (req, res) => {
    try {
        const {
            tema,
            dificuldade,
            linguagem
        } = req.body;

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({
                status: "erro",
                mensagem: "OPENROUTER_API_KEY não configurada."
            });
        }

        const prompt = `
Crie um desafio de programação.

Tema: ${tema || "programação"}
Dificuldade: ${dificuldade || "iniciante"}
Linguagem: ${linguagem || "C"}

Retorne somente um JSON válido no seguinte formato:

{
  "titulo": "Título do desafio",
  "descricao": "Descrição detalhada do problema",
  "entrada": "Descrição da entrada",
  "saida": "Descrição da saída",
  "exemploEntrada": "Exemplo de entrada",
  "exemploSaida": "Exemplo de saída",
  "restricoes": "Restrições do problema"
}
`;

        const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`
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
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            return res.status(resposta.status).json({
                status: "erro",
                mensagem: resultado
            });
        }

        const conteudo =
            resultado?.choices?.[0]?.message?.content || "";

        let desafio;

        try {
            desafio = JSON.parse(conteudo);
        } catch {
            const jsonMatch = conteudo.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                desafio = JSON.parse(jsonMatch[0]);
            } else {
                desafio = {
                    resposta: conteudo
                };
            }
        }

        res.json({
            status: "ok",
            desafio
        });
    } catch (erro) {
        console.error("Erro ao gerar desafio:", erro);

        res.status(500).json({
            status: "erro",
            mensagem: erro.message
        });
    }
});

app.post("/analisar-codigo", async (req, res) => {
    try {
        const {
            codigo,
            desafio,
            requisitos,
            linguagem
        } = req.body;

        if (!codigo) {
            return res.status(400).json({
                status: "erro",
                mensagem: "Código não informado."
            });
        }

        const prompt = `
Você é um avaliador de código para uma plataforma educacional.

Analise o código enviado pelo aluno levando em consideração o desafio e os requisitos.

LINGUAGEM:
${linguagem || "C"}

DESAFIO:
${desafio || "Não informado"}

REQUISITOS:
${requisitos || "Não informado"}

CÓDIGO DO ALUNO:
\`\`\`
${codigo}
\`\`\`

Avalie:
1. Se o código resolve o problema proposto.
2. Se os requisitos foram atendidos.
3. Possíveis erros lógicos.
4. Possíveis problemas de compilação ou execução.
5. Qualidade e clareza do código.
6. Uma explicação objetiva para o aluno.

Não altere o código do aluno.

Para cada requisito, informe explicitamente se ele foi atendido ou não.

Retorne somente um JSON válido neste formato:

{
  "aprovado": true,
  "nota": 0,
  "resumo": "Resumo da análise",
  "requisitos": [
    {
      "descricao": "String",
      "atendido": true,
      "justificativa": "Explicação"
    }
  ],
  "pontosPositivos": [
    "Ponto positivo"
  ],
  "problemas": [
    "Problema encontrado"
  ],
  "sugestoes": [
    "Sugestão"
  ],
  "explicacao": "Explicação detalhada"
}
`;

        let resultadoIA;

        // Primeiro tenta OpenRouter
        if (OPENROUTER_API_KEY) {
            try {
                const resposta = await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${OPENROUTER_API_KEY}`
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

                if (resposta.ok) {
                    resultadoIA =
                        resultado?.choices?.[0]?.message?.content;
                }
            } catch (erro) {
                console.error(
                    "Erro no OpenRouter:",
                    erro.message
                );
            }
        }

        // Fallback para Groq
        if (!resultadoIA && GROQ_API_KEY) {
            try {
                const resposta = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${GROQ_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: GROQ_MODEL,
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

                if (resposta.ok) {
                    resultadoIA =
                        resultado?.choices?.[0]?.message?.content;
                }
            } catch (erro) {
                console.error(
                    "Erro no Groq:",
                    erro.message
                );
            }
        }

        if (!resultadoIA) {
            return res.status(500).json({
                status: "erro",
                mensagem: "Nenhum serviço de IA respondeu."
            });
        }

        let analise;

        try {
            analise = JSON.parse(resultadoIA);
        } catch {
            const jsonMatch =
                resultadoIA.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    analise = JSON.parse(jsonMatch[0]);
                } catch {
                    analise = {
                        aprovado: false,
                        nota: 0,
                        resumo: resultadoIA,
                        requisitos: [],
                        pontosPositivos: [],
                        problemas: [],
                        sugestoes: [],
                        explicacao: resultadoIA
                    };
                }
            } else {
                analise = {
                    aprovado: false,
                    nota: 0,
                    resumo: resultadoIA,
                    requisitos: [],
                    pontosPositivos: [],
                    problemas: [],
                    sugestoes: [],
                    explicacao: resultadoIA
                };
            }
        }

        res.json({
            status: "ok",
            analise
        });
    } catch (erro) {
        console.error("Erro ao analisar código:", erro);

        res.status(500).json({
            status: "erro",
            mensagem: erro.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
