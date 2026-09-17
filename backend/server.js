const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ======================================================
// CONFIGURAÇÕES DOS MODELOS
// ======================================================

const OPENROUTER_MODEL = "openrouter/free";
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
Você é um gerador especializado de desafios de programação em linguagem C.

Sua tarefa é criar UM único desafio de programação que seja interessante, coerente, prático e compatível com o nível de dificuldade informado.

Dificuldade:
${dificuldade}

Conteúdos obrigatórios:
${conteudos.join(", ")}

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
