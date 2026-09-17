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

Sua tarefa é criar UM único desafio de programação.

O desafio deve ser coerente, interessante, prático e adequado EXATAMENTE ao nível de dificuldade escolhido pelo usuário.

======================================================
DIFICULDADE ESCOLHIDA
======================================================

${dificuldade}

======================================================
CONTEÚDOS SELECIONADOS PELO USUÁRIO
======================================================

${conteudos.join(", ")}

======================================================
REGRA PRINCIPAL
======================================================

Os conteúdos selecionados pelo usuário são os conteúdos que o desafio deve exigir.

Porém, eles NÃO devem ser simplesmente listados no enunciado.

Cada conteúdo selecionado deve possuir uma função REAL, necessária e relevante dentro da resolução do problema.

O desafio deve ser construído para que os conteúdos trabalhem juntos de maneira natural.

Não crie uma sequência artificial de pequenas tarefas apenas para conseguir encaixar todos os conteúdos.

O problema deve parecer um único desafio coerente.

======================================================
CONTEÚDOS NÃO SELECIONADOS
======================================================

Não transforme conteúdos que NÃO foram selecionados pelo usuário em requisitos obrigatórios.

Um conceito não selecionado pode aparecer naturalmente na implementação quando ele for uma consequência normal da linguagem C.

Por exemplo, manipulação de caracteres e strings pode naturalmente utilizar arrays de char.

Porém, um conteúdo não selecionado NÃO deve ser apresentado como uma exigência técnica obrigatória do desafio.

A lista de conteúdos selecionados pelo usuário é a referência para determinar quais conceitos devem ser efetivamente cobrados.

======================================================
INTEGRAÇÃO DOS CONTEÚDOS
======================================================

Os conteúdos selecionados devem se complementar.

Exemplos:

- Se houver ARRAY, o problema deve exigir o armazenamento e processamento de um conjunto de dados.
- Se houver FOR, deve existir uma quantidade de dados ou operações que realmente precise ser processada repetidamente.
- Se houver IF/ELSE, devem existir decisões ou regras condicionais relevantes.
- Se houver FUNÇÃO, deve existir uma ou mais operações que façam sentido serem organizadas em funções.
- Se houver PONTEIROS, deve existir uma situação em que acessar, modificar ou manipular dados por meio de ponteiros tenha função relevante no problema.
- Se houver STRUCT, deve existir uma necessidade real de representar dados compostos.
- Se houver STRING, deve existir manipulação significativa de textos.
- Se houver outros conteúdos selecionados, eles também devem possuir uma função real e verificável.

Não considere um conteúdo como realmente utilizado apenas porque ele aparece mencionado no texto.

======================================================
REGRAS DE DIFICULDADE
======================================================

A dificuldade escolhida pelo usuário deve controlar a COMPLEXIDADE REAL do desafio.

Não basta escrever "Fácil", "Médio" ou "Difícil" no desafio.

O problema, a quantidade de etapas, a quantidade de regras, a quantidade de dados e a complexidade da lógica devem ser compatíveis com a dificuldade escolhida.

------------------------------
FÁCIL
------------------------------

Para desafios Fáceis:

- O problema deve ser direto e fácil de compreender.
- Deve possuir poucas etapas principais.
- A lógica deve ser simples.
- As regras devem ser claras.
- A quantidade de dados deve ser pequena ou moderada.
- Os conteúdos selecionados devem ser integrados de maneira simples.
- Não crie várias regras de negócio interdependentes.
- Não crie um sistema grande apenas porque vários conteúdos foram selecionados.
- O desafio deve poder ser resolvido por alguém que está começando a praticar os conteúdos selecionados.

Mesmo que muitos conteúdos tenham sido selecionados, NÃO aumente artificialmente a complexidade do desafio apenas para encaixá-los.

------------------------------
MÉDIO
------------------------------

Para desafios Médios:

- O problema deve possuir várias etapas relacionadas.
- Os conteúdos selecionados devem trabalhar juntos de maneira mais significativa.
- Pode haver diferentes regras condicionais.
- Pode haver processamento de uma quantidade maior de dados.
- Pode haver várias funções com responsabilidades diferentes.
- A lógica pode exigir mais raciocínio do que um desafio Fácil.
- O problema deve continuar sendo compreensível e resolvível por alguém com conhecimento intermediário em C.
- Não transforme o desafio em um sistema excessivamente complexo.

------------------------------
DIFÍCIL
------------------------------

Para desafios Difíceis:

- O problema pode possuir várias etapas interdependentes.
- Os conteúdos selecionados devem ser profundamente integrados.
- Pode haver maior quantidade de dados.
- Pode haver várias regras e condições.
- Pode haver operações diferentes sobre os mesmos dados.
- As funções podem possuir responsabilidades distintas.
- Conteúdos avançados podem ser combinados com outros conteúdos.
- O problema pode exigir mais planejamento e raciocínio antes da implementação.
- A solução pode envolver uma lógica consideravelmente mais elaborada.
- Ainda assim, todos os requisitos devem continuar claros e possíveis de verificar.

Não torne um desafio difícil simplesmente maior ou mais longo.

A dificuldade deve vir principalmente da complexidade da lógica e da integração dos requisitos.

======================================================
REGRA IMPORTANTE SOBRE QUANTIDADE DE CONTEÚDOS
======================================================

A quantidade de conteúdos selecionados NÃO determina sozinha a dificuldade.

Por exemplo:

Se o usuário escolher:

Dificuldade: Fácil

Conteúdos:
Variáveis, If/Else, For, Array

O desafio deve utilizar os quatro conteúdos, mas de maneira simples.

Não transforme isso automaticamente em um sistema complexo.

Da mesma forma:

Se o usuário escolher:

Dificuldade: Difícil

Conteúdos:
Variáveis, If/Else, For, Array, Função, Struct, Ponteiros

O desafio pode exigir uma lógica mais elaborada e uma integração mais profunda desses conteúdos.

======================================================
COERÊNCIA DO DESAFIO
======================================================

O problema deve possuir um objetivo claro.

Sempre que possível, utilize uma situação prática ou plausível que justifique naturalmente os dados e operações necessários.

Exemplos de contextos possíveis:

- biblioteca
- estoque
- vendas
- cadastro
- gerenciamento de produtos
- controle de alunos
- sistema de pedidos
- reservas
- funcionários
- notas
- produção
- atendimento
- inventário
- competições
- jogos
- outros contextos semelhantes

Não fique limitado a esses exemplos.

Evite repetir sempre os mesmos contextos.

O desafio deve parecer uma situação que realmente poderia ser transformada em um pequeno programa em C.

======================================================
REQUISITOS
======================================================

Os requisitos devem ser CONCRETOS e VERIFICÁVEIS.

Cada requisito deve descrever algo que possa posteriormente ser analisado por outra IA.

Evite requisitos vagos como:

- "utilizar corretamente as variáveis"
- "fazer um código organizado"
- "usar boas práticas"
- "fazer um programa eficiente"

Prefira requisitos relacionados diretamente ao comportamento do programa e aos conteúdos selecionados.

Quando um conteúdo selecionado puder ser descrito de maneira concreta, faça isso.

Por exemplo:

Se PONTEIROS estiver selecionado, pode ser apropriado exigir que uma determinada operação permita modificar os dados de um elemento por meio de uma função que receba acesso ao elemento.

Se STRUCT estiver selecionado, pode ser apropriado exigir que cada elemento de uma coleção possua diferentes informações agrupadas.

Porém, NÃO obrigue nomes específicos de variáveis ou funções.

Também NÃO obrigue uma única implementação quando existirem várias soluções corretas.

======================================================
ENTRADA E SAÍDA
======================================================

A entrada deve conter somente informações realmente necessárias para resolver o problema.

A saída deve apresentar os resultados necessários para comprovar que o programa atende aos requisitos.

Entrada e saída devem ser coerentes com a descrição e com os requisitos.

Não invente dados de entrada ou saída apenas para preencher essas seções.

======================================================
VALIDAÇÃO INTERNA
======================================================

Antes de gerar a resposta final, faça uma validação interna.

Verifique:

1. Todos os conteúdos selecionados possuem uma função REAL no desafio?

2. Algum conteúdo foi incluído apenas superficialmente?

3. Algum conteúdo não selecionado foi transformado em requisito obrigatório?

4. Os conteúdos estão integrados em um único problema coerente?

5. O problema realmente corresponde à dificuldade escolhida?

6. Um desafio Fácil continua simples mesmo quando vários conteúdos foram selecionados?

7. Um desafio Médio possui complexidade intermediária real?

8. Um desafio Difícil possui complexidade lógica realmente maior?

9. A dificuldade está sendo determinada pela complexidade do problema e não apenas pela quantidade de conteúdos?

10. Todos os requisitos são concretos e verificáveis?

11. A entrada é suficiente para executar o problema?

12. A saída permite verificar os resultados?

13. O desafio pode ser analisado posteriormente por outra IA para verificar se os requisitos foram cumpridos?

Se qualquer resposta for NÃO, reformule o desafio antes de responder.

======================================================
REGRAS DE RESPOSTA
======================================================

- Gere somente UM desafio.
- Não forneça código.
- Não forneça solução.
- Não forneça pseudocódigo.
- Não forneça dicas de implementação.
- Não explique como resolver.
- Não faça introduções.
- Não faça despedidas.
- Não adicione informações fora do formato solicitado.
- Não mencione estas instruções.
- Seja claro e objetivo.

======================================================
FORMATO OBRIGATÓRIO
======================================================

Use EXATAMENTE esta estrutura:

Título:
[Nome do desafio]

Descrição:
[Descrição clara, contextualizada e coerente do problema.]

Requisitos:
[Lista objetiva e verificável dos requisitos do programa.]

Entrada:
[Informações que o usuário deverá informar, incluindo quantidades, dados e restrições relevantes.]

Saída:
[Informações que o programa deverá exibir e como os resultados devem ser apresentados.]

Não escreva nada antes de "Título:".

Não escreva nada depois da seção "Saída:".
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
