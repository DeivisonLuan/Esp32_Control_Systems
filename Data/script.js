/*
 * script.js
 * Lógica JavaScript para a Aplicação de Monitoramento de Sinal de Controle da UFRN.
 * Este script gerencia a troca de abas, controles de alternância (toggle switches),
 * seleções de botões de rádio, simulação de descarga de capacitor,
 * renderização e atualização de dados do gráfico, e configurações de personalização do gráfico.
 *
 * Autor: Deivison Luan
 * Data: 23 de Junho de 2025
 */

// Garante que o script só seja executado quando todo o DOM (Document Object Model) estiver carregado.
document.addEventListener('DOMContentLoaded', () => {

    /* --- Lógica das Abas (1ª Ordem, 2ª Ordem) --- */
    // Seleciona todos os botões de abas na interface pela classe 'tab-button'.
    const tabButtons = document.querySelectorAll('.tab-button');
    // Seleciona todos os contêineres de conteúdo das abas pela classe 'tab-content'.
    const tabContents = document.querySelectorAll('.tab-content');

    /**
     * Ativa uma aba específica, tornando seu conteúdo visível e estilizando seu botão como ativo.
     * Remove o estado ativo e esconde as outras abas, depois ativa a aba solicitada.
     * @param {string} tabId - O ID do conteúdo da aba a ser ativada (por exemplo, 'ordem1', 'ordem2').
     */
    function activateTab(tabId) {
        // Itera sobre todos os botões de abas para remover a classe 'active'.
        tabButtons.forEach(button => button.classList.remove('active'));
        // Itera sobre todos os conteúdos das abas para adicionar a classe 'hidden-content' e escondê-los.
        tabContents.forEach(content => content.classList.add('hidden-content'));

        // Encontra o botão da aba que corresponde ao 'tabId' e adiciona a classe 'active' para estilização.
        const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Encontra o conteúdo da aba que corresponde ao 'tabId' e remove a classe 'hidden-content' para exibi-lo.
        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.remove('hidden-content');
            // Após ativar a aba, verifica o estado do capacitor e ajusta os radio buttons.
            const indicatorId = activeContent.id.includes('ordem1') ? 'statusIndicatorOrdem1' : 'statusIndicatorOrdem2';
            const statusIndicator = document.getElementById(indicatorId);
            const isDisabled = statusIndicator.classList.contains('status-red');
            setRadioButtonsState(activeContent, isDisabled);

            // Atualiza o estado visual dos rótulos do toggle (Malha Aberta/Fechada)
            const toggleInput = activeContent.querySelector('.toggle-input');
            const labelMalhaAberta = activeContent.querySelector('.toggle-mode-label#labelMalhaAberta' + (activeContent.id.includes('ordem1') ? '1' : '2'));
            const labelMalhaFechada = activeContent.querySelector('.toggle-mode-label#labelMalhaFechada' + (activeContent.id.includes('ordem1') ? '1' : '2'));
            updateToggleLabels(toggleInput, labelMalhaAberta, labelMalhaFechada);
        }
    }

    // Adiciona um "ouvinte de evento" de clique a cada botão de aba.
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab; // Obtém o ID da aba alvo do atributo 'data-tab'.
            activateTab(tabId);              // Chama a função para ativar a aba selecionada.
        });
    });

    // Ativa a primeira aba por padrão quando a página é carregada pela primeira vez.
    if (tabButtons.length > 0) {
        activateTab(tabButtons[0].dataset.tab);
    }

    /* --- Lógica do Toggle Switch (Malha Aberta/Malha Fechada) --- */
    // Seleciona todos os inputs de toggle switch na interface pela classe 'toggle-input'.
    const toggleSwitches = document.querySelectorAll('.toggle-input');

    /**
     * Atualiza as classes CSS dos rótulos do toggle para destacar a opção selecionada.
     * @param {HTMLInputElement} toggleInput - O input checkbox do toggle.
     * @param {HTMLElement} labelMalhaAberta - O elemento span do rótulo "Malha Aberta".
     * @param {HTMLElement} labelMalhaFechada - O elemento span do rótulo "Malha Fechada".
     */
    function updateToggleLabels(toggleInput, labelMalhaAberta, labelMalhaFechada) {
        if (toggleInput.checked) { // Se o toggle está selecionado (Malha Fechada)
            labelMalhaFechada.classList.add('active');
            labelMalhaAberta.classList.remove('active');
        } else { // Se o toggle não está selecionado (Malha Aberta)
            labelMalhaAberta.classList.add('active');
            labelMalhaFechada.classList.remove('active');
        }
    }

    // Adiciona um "ouvinte de evento" de 'change' (quando o estado do input muda) a cada toggle switch.
    toggleSwitches.forEach(toggle => {
        // Encontra os rótulos associados a este toggle
        const tabContent = toggle.closest('.tab-content');
        const labelMalhaAberta = tabContent.querySelector('.toggle-mode-label#labelMalhaAberta' + (tabContent.id.includes('ordem1') ? '1' : '2'));
        const labelMalhaFechada = tabContent.querySelector('.toggle-mode-label#labelMalhaFechada' + (tabContent.id.includes('ordem1') ? '1' : '2'));
        
        // Inicializa o estado visual dos rótulos ao carregar
        updateToggleLabels(toggle, labelMalhaAberta, labelMalhaFechada);

        toggle.addEventListener('change', () => {
            const status = toggle.checked ? 'Malha Fechada' : 'Malha Aberta';
            const orderType = toggle.id.includes('Ordem1') ? '1ª Ordem' : '2ª Ordem';
            console.log(`Modo de Operação para ${orderType}: ${status}`);
            
            // Atualiza o estado visual dos rótulos após a mudança
            updateToggleLabels(toggle, labelMalhaAberta, labelMalhaFechada);

            // TODO: Adicionar lógica real para mudar o comportamento do sistema.
        });
    });

    /* --- Lógica dos Botões de Rádio (Seleção da Planta) --- */
    // Seleciona todos os grupos de botões de rádio pela classe 'radio-group'.
    const radioGroups = document.querySelectorAll('.radio-group');

    /**
     * Habilita ou desabilita os botões de rádio dentro de um contêiner específico.
     * @param {HTMLElement} container - O elemento DOM que contém os botões de rádio (ex: tab-content).
     * @param {boolean} isDisabled - True para desabilitar, false para habilitar.
     */
    function setRadioButtonsState(container, isDisabled) {
        const radios = container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.disabled = isDisabled;
            // Se um rádio é desabilitado, desabilitamos também seu label para feedback visual
            const label = radio.closest('.radio-label');
            if (label) {
                if (isDisabled) {
                    label.classList.add('disabled-label');
                    label.style.cursor = 'not-allowed'; // Mudar cursor do label
                } else {
                    label.classList.remove('disabled-label');
                    label.style.cursor = 'pointer'; // Restaurar cursor do label
                }
            }
        });
    }

    // Adiciona um "ouvinte de evento" de 'change' a cada grupo de rádio para detectar a seleção.
    radioGroups.forEach(group => {
        group.addEventListener('change', (event) => {
            // Verifica se o elemento que disparou o evento é um botão de rádio.
            // E se o rádio não está desabilitado, permitindo a mudança.
            if (event.target.type === 'radio' && !event.target.disabled) {
                const selectedPlanta = event.target.value; // Obtém o valor do botão de rádio selecionado.
                // Determina a qual tipo de ordem o grupo de rádio pertence, verificando seu atributo 'name'.
                const orderType = event.target.name.includes('Ordem1') ? '1ª Ordem' : '2ª Ordem';
                console.log(`Planta selecionada para ${orderType}: ${selectedPlanta}`);
                // TODO: Aqui você pode adicionar a lógica para carregar ou alternar para dados/parâmetros
                // específicos da planta selecionada, o que afetaria a simulação ou o gráfico.
            } else if (event.target.type === 'radio' && event.target.disabled) {
                // Se o rádio estava desabilitado e houve uma tentativa de mudança, pode-se avisar o usuário.
                console.log("Não é possível mudar a planta enquanto o capacitor está descarregando.");
                // Opcional: para evitar que a seleção visual mude se o click for ignorado,
                // pode-se reverter o `checked` para o rádio que estava ativo antes.
                // Isso exigiria armazenar o `checked` anterior ou re-selecionar após o alerta.
            }
        });
    });

    /* --- Lógica do Botão 'Descarregar Capacitor' e Indicador de Status --- */
    // Seleciona todos os botões de descarga de capacitor pela classe 'btn-capacitor'.
    const capacitorButtons = document.querySelectorAll('.btn-capacitor');

    // Itera sobre cada botão de capacitor para anexar os "ouvintes de evento" e gerenciar seu indicador.
    capacitorButtons.forEach(button => {
        // Encontra o contêiner da aba pai para associar o indicador e os radio buttons.
        const tabContentContainer = button.closest('.tab-content');
        const indicatorId = tabContentContainer.id.includes('ordem1') ? 'statusIndicatorOrdem1' : 'statusIndicatorOrdem2';
        const statusIndicator = document.getElementById(indicatorId);

        // Inicializa a cor do indicador como verde quando a página é carregada.
        if (statusIndicator) {
            statusIndicator.classList.add('status-green');  // Adiciona a classe para cor verde.
            statusIndicator.classList.remove('status-red'); // Garante que a cor vermelha não esteja ativa.
            setRadioButtonsState(tabContentContainer, false); // Habilita os radios inicialmente.
        }

        // Adiciona um "ouvinte de evento" de clique ao botão de descarga do capacitor.
        button.addEventListener('click', () => {
            if (statusIndicator) {
                // Muda a cor do indicador para vermelho (simulando a descarga).
                statusIndicator.classList.remove('status-green');
                statusIndicator.classList.add('status-red');
                setRadioButtonsState(tabContentContainer, true); // Desabilita os radios.
                console.log('Capacitor descarregando...');

                // Simula o tempo de descarga usando um `setTimeout`.
                // Após o tempo definido, o indicador voltará à cor verde.
                setTimeout(() => {
                    // Após o tempo simulado, muda o indicador de volta para verde (carregado).
                    statusIndicator.classList.remove('status-red');
                    statusIndicator.classList.add('status-green');
                    setRadioButtonsState(tabContentContainer, false); // Habilita os radios novamente.
                    console.log('Capacitor carregado novamente (verde).');
                }, 3000); // O indicador permanece vermelho por 3 segundos.
            }
        });
    });

    /* --- Configuração e Renderização do Gráfico com Chart.js --- */
    // Obtém o contexto 2D do elemento canvas com o ID 'controlSignalChart' para desenhar o gráfico.
    const ctx = document.getElementById('controlSignalChart').getContext('2d');
    let controlSignalChart; // Declara uma variável para armazenar a instância do objeto Chart.js.
    let currentTime = 0; // Variável para rastrear o tempo atual para o novo card.

    // Dados simulados iniciais para o gráfico.
    const initialData = {
        labels: Array.from({length: 60}, (_, i) => i), // Rótulos para o eixo X, representando tempo em segundos (de 0 a 59).
        datasets: [{
            label: 'MV', // Rótulo para o primeiro conjunto de dados (Variável Manipulada).
            data: Array.from({length: 60}, () => (Math.random() * 10) + 20), // Dados aleatórios simulados (entre 20 e 30).
            borderColor: 'rgba(0, 255, 192, 0.8)', // Cor da linha (verde-azulado com alguma transparência).
            backgroundColor: 'rgba(0, 255, 192, 0.2)', // Cor de preenchimento abaixo da linha (mais transparente).
            tension: 0.3, // Define a curvatura da linha para torná-la mais suave (0 = reta, 1 = muito curva).
            fill: false, // Não preenche a área abaixo da linha do gráfico.
            borderWidth: 2, // Espessura da linha do gráfico.
            pointRadius: 0 // Define o raio dos pontos de dados como 0 para torná-los invisíveis.
        }, {
            label: 'Saída', // Rótulo para o segundo conjunto de dados (Saída do Sistema).
            data: Array.from({length: 60}, () => (Math.random() * 10) + 20), // Dados aleatórios simulados.
            borderColor: 'rgba(219, 127, 38, 0.8)', // Cor da linha (laranja com alguma transparência).
            backgroundColor: 'rgba(219, 127, 38, 0.2)', // Cor de preenchimento abaixo da linha (mais transparente).
            tension: 0.3,
            fill: false,
            borderWidth: 2,
            pointRadius: 0
        }]
    };

    /**
     * Renderiza o gráfico Chart.js no elemento canvas.
     * Se uma instância de gráfico já existir, ela é destruída antes de criar uma nova para evitar conflitos e vazamentos de memória.
     */
    function renderChart() {
        // Verifica se 'controlSignalChart' já possui uma instância de gráfico e, se sim, a destrói.
        if (controlSignalChart) {
            controlSignalChart.destroy();
        }

        // Cria uma nova instância do Chart.js, associando-a ao contexto do canvas e definindo suas opções.
        controlSignalChart = new Chart(ctx, {
            type: 'line', // Define o tipo de gráfico como 'line' (linha).
            data: initialData, // Passa os dados para o gráfico.
            options: {
                responsive: true, // O gráfico se redimensiona automaticamente para preencher seu contêiner.
                maintainAspectRatio: false, // Permite que o gráfico use a altura definida pelo CSS, sem manter a proporção.
                animation: {
                    duration: 1000, // Duração da animação ao carregar ou atualizar o gráfico (em milissegundos).
                    easing: 'easeInOutQuart' // Easing function para suavizar a animação.
                },
                scales: {
                    x: {
                        type: 'linear', // Define o eixo X como uma escala linear (útil para dados numéricos como tempo).
                        title: {
                            display: true, // Mostra o título do eixo X.
                            text: 'Tempo (segundos)', // Texto do título do eixo X.
                            color: '#FFFFFF', // Cor do texto do título do eixo X.
                            font: { // Configurações de fonte para o título do eixo X
                                size: 18 // Aumenta o tamanho da fonte para 18px (similar ao Modo de Operação)
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)', // Cor das linhas de grade do eixo X (sutís).
                            lineWidth: 0.5 // Espessura das linhas de grade do eixo X.
                        },
                        ticks: {
                            color: '#FFFFFF', // Cor dos rótulos dos ticks (marcadores) do eixo X.
                            font: { // Configurações de fonte para os ticks do eixo X
                                size: 16 // Aumenta o tamanho da fonte para 16px (similar ao Planta 1)
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true, // Mostra o título do eixo Y.
                            text: 'Sinal de Controle', // Texto do título do eixo Y.
                            color: '#FFFFFF', // Cor do texto do título do eixo Y.
                            font: { // Configurações de fonte para o título do eixo Y
                                size: 18 // Aumenta o tamanho da fonte para 18px (similar ao Modo de Operação)
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)', // Cor das linhas de grade do eixo Y (sutís).
                            lineWidth: 0.5 // Espessura das linhas de grade do eixo Y.
                        },
                        ticks: {
                            color: '#FFFFFF', // Cor dos rótulos dos ticks do eixo Y.
                            font: { // Configurações de fonte para os ticks do eixo Y
                                size: 16 // Aumenta o tamanho da fonte para 16px (similar ao Planta 1)
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#FFFFFF' // Cor dos rótulos da legenda do gráfico.
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(28, 43, 71, 0.9)', // Cor de fundo do tooltip (balão de informações ao passar o mouse).
                        titleColor: 'rgba(0, 204, 153, 0.4)', // Cor do título no tooltip.
                        bodyColor: '#FFFFFF', // Cor do texto do corpo no tooltip.
                        borderColor: 'var(--light-blue-green)', // Cor da borda do tooltip.
                        borderWidth: 1, // Espessura da borda do tooltip.
                        displayColors: true // Mostra pequenas caixas de cores ao lado dos itens no tooltip.
                    }
                }
            }
        });
    }

    renderChart(); // Chama a função para renderizar o gráfico quando a página é carregada inicialmente.

    /* --- Lógica de Atualização de Dados (Simulada em Tempo Real) --- */
    /**
     * Atualiza os dados do gráfico com novos valores simulados.
     * Esta função simula um fluxo contínuo de dados: adiciona um novo ponto no final do array de dados e remove o ponto mais antigo do início.
     */
    function updateChartData() {
        const newDataMV = (Math.random() * 10) + 20;    // Gera um novo dado aleatório para a Variável Manipulada (MV).
        const newDataOutput = (Math.random() * 10) + 20; // Gera um novo dado aleatório para a Saída.

        // Incrementa o tempo
        currentTime++; 

        // Adiciona um novo ponto de dado ao final dos arrays de rótulos e conjuntos de dados.
        // O rótulo de tempo é incrementado para manter a sequência.
        initialData.labels.push(initialData.labels[initialData.labels.length - 1] + 1);
        initialData.datasets[0].data.push(newDataMV);
        initialData.datasets[1].data.push(newDataOutput);

        // Remove o primeiro elemento dos arrays para manter um número fixo de pontos visíveis no gráfico,
        // criando um efeito de "rolagem" ou stream de dados.
        if (initialData.labels.length > 60) { // Mantém apenas os últimos 60 pontos visíveis no gráfico.
            initialData.labels.shift();       // Remove o rótulo de tempo mais antigo.
            initialData.datasets[0].data.shift(); // Remove o dado MV mais antigo.
            initialData.datasets[1].data.shift(); // Remove o dado de Saída mais antigo.
        }

        // Atualiza os valores exibidos nos cards de destaque na interface do usuário.
        document.getElementById('mvValue').textContent = newDataMV.toFixed(1);     // Atualiza o valor de MV, formatado para uma casa decimal.
        document.getElementById('outputValue').textContent = newDataOutput.toFixed(1); // Atualiza o valor de Saída, formatado para uma casa decimal.
        document.getElementById('timeValue').textContent = `${currentTime} s`; // Atualiza o valor do tempo
        // O valor de Set Point permanece estático nesta simulação e não é atualizado por esta função.

        controlSignalChart.update('none'); // Atualiza o gráfico. O parâmetro 'none' impede a animação para uma atualização mais rápida, ideal para dados em tempo real.
    }

    // Define um intervalo para chamar a função `updateChartData` a cada 1000 milissegundos (1 segundo).
    // Isso cria a simulação de um fluxo de dados em tempo real.
    setInterval(updateChartData, 1000);


    /* --- Configurações do Gráfico (Controles da Barra Lateral) --- */
    // Obtém referências aos elementos HTML dos controles de configuração do gráfico.
    const scaleAdjustment = document.getElementById('scale-adjustment'); // Slider para ajuste de escala.
    const scaleValueDisplay = document.getElementById('scale-value');     // Elemento para exibir o valor atual da escala.
    const mvColorInput = document.getElementById('mv-color');            // Input de tipo 'color' para a cor da linha MV.
    const outputColorInput = document.getElementById('output-color');    // Input de tipo 'color' para a cor da linha de Saída.
    const resetButton = document.querySelector('.btn-reset');            // Botão para redefinir todas as configurações do gráfico.

    // Adiciona um "ouvinte de evento" para o slider de ajuste de escala. O evento 'input' dispara a cada mudança.
    scaleAdjustment.addEventListener('input', () => {
        const scale = parseFloat(scaleAdjustment.value); // Converte o valor do slider (string) para um número de ponto flutuante.
        scaleValueDisplay.textContent = `${scale.toFixed(1)}x`; // Atualiza o texto que exibe o valor da escala, formatado para uma casa decimal.

        // Ajusta o "zoom" do gráfico manipulando os limites mínimo e máximo do eixo Y.
        // Isso simula o efeito de zoom, estendendo ou comprimindo a visualização da faixa de dados.
        // Valores de 'originalYMin' e 'originalYMax' são exemplos para definir uma base de faixa.
        const originalYMin = 15; // Valor mínimo do eixo Y base de exemplo.
        const originalYMax = 35; // Valor máximo do eixo Y base de exemplo.

        const currentCenter = (originalYMax + originalYMin) / 2; // Calcula o ponto central da faixa original do eixo Y.
        const currentRange = (originalYMax - originalYMin);     // Calcula a amplitude total da faixa original.

        // Calcula a nova amplitude da faixa do eixo Y com base no fator de escala.
        const newRange = currentRange / scale;
        
        // Define os novos limites mínimo e máximo do eixo Y. A faixa é centralizada no ponto médio original.
        controlSignalChart.options.scales.y.min = currentCenter - (newRange / 2);
        controlSignalChart.options.scales.y.max = currentCenter + (newRange / 2);

        controlSignalChart.update(); // Atualiza o gráfico para aplicar as novas configurações de escala.
    });

    // Adiciona um "ouvinte de evento" para o seletor de cor da linha MV.
    mvColorInput.addEventListener('input', () => {
        const newColor = mvColorInput.value; // Obtém a nova cor selecionada (formato hexadecimal).
        controlSignalChart.data.datasets[0].borderColor = newColor; // Aplica a nova cor à borda da linha do conjunto de dados MV.
        // Converte a cor hexadecimal para um formato RGBA para manter a transparência no preenchimento de fundo da linha.
        // (A função replace é um truque simples para adicionar 'rgba' e a opacidade; uma biblioteca de cores seria mais robusta).
        controlSignalChart.data.datasets[0].backgroundColor = newColor.replace('rgb', 'rgba').replace(')', ', 0.2)'); 
        controlSignalChart.update(); // Atualiza o gráfico para exibir a nova cor.
    });

    // Adiciona um "ouvinte de evento" para o seletor de cor da linha de Saída.
    outputColorInput.addEventListener('input', () => {
        const newColor = outputColorInput.value; // Obtém a nova cor selecionada.
        controlSignalChart.data.datasets[1].borderColor = newColor; // Aplica a nova cor à borda da linha do conjunto de dados de Saída.
        // Converte a cor para RGBA para manter a transparência no preenchimento de fundo.
        controlSignalChart.data.datasets[1].backgroundColor = newColor.replace('rgb', 'rgba').replace(')', ', 0.2)');
        controlSignalChart.update(); // Atualiza o gráfico para exibir a nova cor.
    });

    // Adiciona um "ouvinte de evento" de clique para o botão Redefinir Cores.
    resetButton.addEventListener('click', () => {
        // Redefine os seletores de cor para seus valores padrão iniciais (cores padrão da aplicação).
        mvColorInput.value = '#00FFC0';
        outputColorInput.value = '#DF7F26';

        // Aplica as cores originais (incluindo transparência padrão) aos conjuntos de dados do gráfico.
        controlSignalChart.data.datasets[0].borderColor = 'rgba(0, 255, 192, 0.8)';
        controlSignalChart.data.datasets[0].backgroundColor = 'rgba(0, 255, 192, 0.2)';
        controlSignalChart.data.datasets[1].borderColor = 'rgba(219, 127, 38, 0.8)';
        controlSignalChart.data.datasets[1].backgroundColor = 'rgba(219, 127, 38, 0.2)';

        // Redefine o slider de ajuste de escala para seu valor padrão ('1') e atualiza a exibição.
        scaleAdjustment.value = '1';
        scaleValueDisplay.textContent = '1x';
        
        // Redefine os limites do eixo Y para 'undefined'. Isso faz com que o Chart.js recalcule automaticamente
        // os limites com base nos dados, voltando ao comportamento padrão.
        controlSignalChart.options.scales.y.min = undefined; 
        controlSignalChart.options.scales.y.max = undefined; 

        controlSignalChart.update(); // Atualiza o gráfico para aplicar todas as redefinições.
    });

    /* --- Lógica de Aplicação de Parâmetros (Set Point, PID) --- */
    // Seleciona todos os botões de "Aplicar Parâmetros"
    const applyParamsButtons = document.querySelectorAll('.btn-apply-params');

    applyParamsButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Determina a aba ativa para pegar os inputs corretos
            const activeTabId = button.closest('.tab-content').id;
            const orderPrefix = activeTabId.includes('ordem1') ? 'Ordem1' : 'Ordem2';

            const setPointInput = document.getElementById(`setPointInput${orderPrefix}`);
            const pConstantInput = document.getElementById(`pConstant${orderPrefix}`);
            const iConstantInput = document.getElementById(`iConstant${orderPrefix}`);
            const dConstantInput = document.getElementById(`dConstant${orderPrefix}`);

            const newSetPoint = parseFloat(setPointInput.value);
            const pValue = parseFloat(pConstantInput.value);
            const iValue = parseFloat(iConstantInput.value);
            const dValue = parseFloat(dConstantInput.value);

            // Atualiza o valor do Set Point no display principal
            document.getElementById('setPointValue').textContent = newSetPoint.toFixed(1);

            console.log(`Parâmetros Aplicados para ${orderPrefix}:`);
            console.log(`Set Point: ${newSetPoint}`);
            console.log(`P: ${pValue}`);
            console.log(`I: ${iValue}`);
            console.log(`D: ${dValue}`);

            // TODO: Aqui você integraria esses valores na sua lógica de simulação/controle.
            // Por exemplo, passá-los para um modelo de controle PID que afeta a geração de dados.
        });
    });


    // Inicializa os valores exibidos nos cards de destaque (Set Point, MV, Saída, Tempo) quando a página é carregada.
    document.getElementById('setPointValue').textContent = '25.0'; // Define o valor inicial do Set Point (fixo por enquanto).
    // Define os valores iniciais de MV e Saída com base no último ponto de dado dos conjuntos de dados iniciais, formatado.
    document.getElementById('mvValue').textContent = initialData.datasets[0].data[initialData.datasets[0].data.length - 1].toFixed(1);
    document.getElementById('outputValue').textContent = initialData.datasets[1].data[initialData.datasets[1].data.length - 1].toFixed(1);
    document.getElementById('timeValue').textContent = `${currentTime} s`; // Inicializa o valor do tempo.
});