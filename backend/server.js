async function verificarCodigo() {
    if (analiseConclusaoEmAndamento || !desafioAtual) return;

    const codigo = editorCodigo.value.trim();

    const terminal = document.getElementById("terminalSaida");
    const statusTexto = document.getElementById("statusTexto");
    const statusDot = document.getElementById("statusDot");

    if (!codigo) {
        terminal.innerHTML = `
            <div class="verificacao-requisito requisito-nao-atendido">
                ✗ Nenhum código informado
            </div>
        `;

        statusTexto.textContent = "Erro";
        statusDot.className = "status-dot";

        bloquearConclusaoDesafio();
        return;
    }

    analiseConclusaoEmAndamento = true;

    btnVerificarCodigo.disabled = true;
    btnVerificarCodigo.textContent = "⏳ VERIFICANDO...";

    bloquearConclusaoDesafio();

    statusTexto.textContent = "Verificando...";
    statusDot.className = "status-dot compilando";

    terminal.innerHTML = "";

    const titulo = document.createElement("div");
    titulo.className = "verificacao-linha";
    titulo.textContent = "> Verificação básica";
    terminal.appendChild(titulo);

    try {
        const resultado = verificarRequisitosBasicos(codigo);

        const requisitos = resultado.requisitos || [];

        if (requisitos.length === 0) {
            const aviso = document.createElement("div");
            aviso.className = "verificacao-linha";
            aviso.textContent = "> Nenhum requisito específico encontrado para verificação básica.";
            terminal.appendChild(aviso);
        } else {
            const tituloRequisitos = document.createElement("div");
            tituloRequisitos.className = "verificacao-linha";
            tituloRequisitos.textContent = "> Verificação dos requisitos";
            terminal.appendChild(tituloRequisitos);

            requisitos.forEach(item => {
                const linha = document.createElement("div");

                linha.className =
                    "verificacao-requisito " +
                    (item.atendido
                        ? "requisito-atendido"
                        : "requisito-nao-atendido");

                linha.textContent =
                    (item.atendido ? "✓ " : "✗ ") +
                    item.descricao;

                terminal.appendChild(linha);
            });
        }

        const separador = document.createElement("div");
        separador.className = "verificacao-linha";
        separador.textContent = "";
        terminal.appendChild(separador);

        if (resultado.passou) {
            const sucesso = document.createElement("div");
            sucesso.className = "verificacao-requisito requisito-atendido";
            sucesso.textContent = "✓ Verificação básica aprovada.";
            terminal.appendChild(sucesso);

            const explicacao = document.createElement("div");
            explicacao.className = "verificacao-linha";
            explicacao.textContent =
                "> Todos os requisitos básicos identificáveis foram atendidos.";
            terminal.appendChild(explicacao);

            statusTexto.textContent = "Verificado";
            statusDot.className = "status-dot";

            liberarConclusaoDesafio();

        } else {
            const falha = document.createElement("div");
            falha.className = "verificacao-requisito requisito-nao-atendido";
            falha.textContent = "✗ Verificação básica reprovada.";
            terminal.appendChild(falha);

            const explicacao = document.createElement("div");
            explicacao.className = "verificacao-linha";
            explicacao.textContent =
                "> Corrija os requisitos indicados e verifique novamente.";
            terminal.appendChild(explicacao);

            statusTexto.textContent = "Reprovado";
            statusDot.className = "status-dot";

            bloquearConclusaoDesafio();
        }

    } catch (erro) {
        console.error("Erro na verificação básica:", erro);

        terminal.innerHTML = "";

        const linhaErro = document.createElement("div");
        linhaErro.className =
            "verificacao-requisito requisito-nao-atendido";

        linhaErro.textContent =
            "✗ Erro na verificação básica: " + erro.message;

        terminal.appendChild(linhaErro);

        statusTexto.textContent = "Erro";
        statusDot.className = "status-dot";

        bloquearConclusaoDesafio();

    } finally {
        analiseConclusaoEmAndamento = false;

        btnVerificarCodigo.disabled = false;
        btnVerificarCodigo.textContent = "✓ VERIFICAR CÓDIGO";
    }
}
