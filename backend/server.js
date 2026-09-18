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
        versao: "0.95.11",
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


/* ============================================================
   GERAR DESAFIO
   ============================================================ */

app.post("/gerar-desafio", async (req, res) => {
    try {
        const {
            tema,
            dificuldade,
            linguagem,
            conteudos
        } = req.body;

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({
                status: "erro",
                mensagem: "OPENROUTER_API_KEY não configurada."
            });
        }

        const conteudosLista = Array.isArray(conteudos)
            ? conteudos
            : [];

        const prompt = `
Você é um gerador especializado de desafios de programação em linguagem C.

Sua tarefa é criar UM único desafio de programação que seja interessante, coerente, prático e compatível com o nível de dificuldade informado.

Dificuldade:
${dificuldade}

Conteúdos obrigatórios:
${conteudosLista.join(", ")}

======================================================
REGRAS FUNDAMENTAIS
======================================================

1. TODOS os conteúdos informados são obrigatórios.

2. O desafio deve ser construído de forma que cada conteúdo tenha uma função REAL e relevante na solução.

3. NÃO inclua um conteúdo apenas de forma superficial para dizer que ele foi utilizado.

4. Os conteúdos devem estar integrados naturalmente ao problema. O desafio deve fazer sentido mesmo quando vários conteúdos são usados juntos.

5. Sempre que possível, faça com que os conteúdos se complementem. Por exemplo, se houver Struct e Ponteiros, o problema deve criar uma situação em que trabalhar com estruturas por meio de funções e ponteiros seja naturalmente útil.

6. Se houver Array e String, o problema deve exigir manipulação relevante de conjuntos de dados e textos, e não apenas uma declaração isolada.

7. Se houver Função, o problema deve possuir operações que façam sentido separar em funções.

8. Se houver If-Else, devem existir decisões ou regras de negócio que dependam de condições.

9. Se houver For, deve existir processamento repetitivo que seja realmente necessário para resolver o problema.

10. Se houver conteúdos mais avançados, como Struct, Ponteiros ou outros, o desafio deve criar uma situação que justifique seu uso.

11. Não transforme o desafio em uma lista artificial de tarefas só para encaixar os conteúdos.

12. O problema deve ter uma situação ou objetivo claro, preferencialmente semelhante a uma situação prática do mundo real, sempre que isso combinar com os conteúdos selecionados.

13. A dificuldade deve ser compatível com a quantidade e o nível dos conteúdos selecionados.

14. Quanto maior a dificuldade, mais integrada e elaborada pode ser a lógica do problema, sem exigir conteúdos que não foram selecionados.

15. O enunciado deve permitir que outra IA consiga verificar posteriormente se os requisitos foram realmente cumpridos.

16. Os requisitos devem ser CONCRETOS e VERIFICÁVEIS. Evite requisitos vagos como "use corretamente as variáveis" ou "faça um bom programa".

17. Quando um conteúdo puder ser especificado de maneira concreta sem obrigar uma única implementação válida, faça isso. Por exemplo, se Struct estiver selecionado, pode ser apropriado exigir o armazenamento de informações de cada item por meio de uma estrutura de dados.

18. Não obrigue nomes específicos de variáveis ou funções, a menos que isso seja necessário para o problema.

19. Não exija uma técnica específica quando existirem várias implementações corretas que atendam ao objetivo.

20. Não forneça código.

21. Não forneça solução.

22. Não forneça dicas de implementação.

23. Não explique como resolver.

24. Não faça introduções ou despedidas.

25. Seja direto, claro e objetivo.

======================================================
VALIDAÇÃO INTERNA ANTES DE RESPONDER
======================================================

Antes de gerar a resposta final, verifique internamente:

- Todos os conteúdos obrigatórios possuem uma função relevante no desafio?
- Existe algum conteúdo incluído apenas para cumprir a lista?
- Os requisitos permitem verificar objetivamente se a solução está correta?
- A entrada e a saída são compatíveis com os requisitos?
- O desafio é realmente adequado à dificuldade informada?
- O problema continua coerente e natural com todos os conteúdos selecionados?

Se algum conteúdo estiver artificial ou superficial, reformule o desafio antes de responder.

======================================================
FORMATO DA RESPOSTA
======================================================

Use EXATAMENTE este formato:

Título:
[Nome do desafio]

Descrição:
[Descrição clara e contextualizada do problema]

Requisitos:
[Lista objetiva e verificável do que o programa deve fazer. Os requisitos devem deixar claro onde os conteúdos obrigatórios são necessários, mas sem fornecer a solução.]

Entrada:
[Informações que o usuário deverá informar, incluindo quantidades, dados e restrições relevantes.]

Saída:
[Informações que o programa deverá exibir e como os resultados devem ser apresentados.]

Não escreva nada antes de "Título:" e nada depois da seção "Saída:".
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

        if (!conteudo) {
            return res.status(500).json({
                status: "erro",
                mensagem: "A IA não retornou conteúdo."
            });
        }

        /*
         * Processa a resposta da IA mantendo as cinco seções:
         *
         * Título:
         * Descrição:
         * Requisitos:
         * Entrada:
         * Saída:
         *
         * O parser aceita pequenas variações de Markdown,
         * como:
         *
         * **Título:**
         * ### Título:
         * Título:
         */

        const normalizarCabecalho = (texto) => {
            return texto
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .replace(/^\s*```(?:text|markdown)?\s*/i, "")
                .replace(/\s*```\s*$/i, "")
                .trim();
        };

        const textoNormalizado = normalizarCabecalho(conteudo);

        const encontrarSecao = (nomeSecao, inicioBusca = 0) => {
            const escapedNome = nomeSecao
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const regex = new RegExp(
                `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*{1,3}\\s*)?${escapedNome}\\s*:\\s*(?:\\*{1,3}\\s*)?`,
                "i"
            );

            const trecho = textoNormalizado.slice(inicioBusca);
            const match = regex.exec(trecho);

            if (!match) {
                return null;
            }

            return {
                inicio: inicioBusca + match.index,
                inicioConteudo: inicioBusca + match.index + match[0].length
            };
        };

        const secoesOrdem = [
            "Título",
            "Descrição",
            "Requisitos",
            "Entrada",
            "Saída"
        ];

        const secoes = {};

        let posicaoAtual = 0;

        for (let i = 0; i < secoesOrdem.length; i++) {
            const nome = secoesOrdem[i];

            const encontrada = encontrarSecao(
                nome,
                posicaoAtual
            );

            if (!encontrada) {
                continue;
            }

            let fim = textoNormalizado.length;

            for (let j = i + 1; j < secoesOrdem.length; j++) {
                const proxima = encontrarSecao(
                    secoesOrdem[j],
                    encontrada.inicioConteudo
                );

                if (proxima) {
                    fim = proxima.inicio;
                    break;
                }
            }

            secoes[nome.toLowerCase()] = textoNormalizado
                .slice(encontrada.inicioConteudo, fim)
                .trim();

            posicaoAtual = encontrada.inicioConteudo;
        }

        /*
         * Fallback adicional para respostas que usem os cabeçalhos
         * sem Markdown, preservando a compatibilidade com versões
         * anteriores.
         */
        if (!secoes["título"] && !secoes["descrição"]) {
            const regexFallback =
                /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*{1,3}\s*)?(Título|Titulo|Descrição|Descricao|Requisitos|Entrada|Saída|Saida)\s*:\s*(?:\*{1,3}\s*)?([\s\S]*?)(?=\n\s*(?:#{1,6}\s*)?(?:\*{1,3}\s*)?(?:Título|Titulo|Descrição|Descricao|Requisitos|Entrada|Saída|Saida)\s*:|$)/gi;

            let matchFallback;

            while ((matchFallback = regexFallback.exec(textoNormalizado)) !== null) {
                const nome = matchFallback[1]
                    .toLowerCase()
                    .trim();

                secoes[nome] = matchFallback[2].trim();
            }
        }

        const titulo =
            secoes["título"] ||
            secoes["titulo"] ||
            "Desafio de Programação";

        const descricao =
            secoes["descrição"] ||
            secoes["descricao"] ||
            "";

        const requisitosTexto =
            secoes["requisitos"] ||
            "";

        const entrada =
            secoes["entrada"] ||
            "";

        const saida =
            secoes["saída"] ||
            secoes["saida"] ||
            "";

        const requisitos = requisitosTexto
            .split(/\r?\n/)
            .map(linha =>
                linha
                    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
                    .replace(/^\s*\*{1,3}\s*/, "")
                    .trim()
            )
            .filter(Boolean);

        const desafio = {
            titulo,
            descricao,
            requisitos,
            entrada,
            saida,
            exemploEntrada: "",
            exemploSaida: "",
            restricoes: ""
        };

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
        const { codigo, desafio, requisitos, linguagem } = req.body || {};

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
${typeof desafio === "object" ? JSON.stringify(desafio, null, 2) : (desafio || "Não informado")}

REQUISITOS:
${Array.isArray(requisitos) ? requisitos.join("\n") : (requisitos || (desafio && Array.isArray(desafio.requisitos) ? desafio.requisitos.join("\n") : "Não informado"))}

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

Retorne somente um JSON válido neste formato:

{
  "aprovado": true,
  "nota": 0,
  "resumo": "Resumo da análise",
  "requisitos": [
    {
      "descricao": "Descrição do requisito",
      "atendido": true,
      "justificativa": "Explicação objetiva"
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
