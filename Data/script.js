// --- Lógica dos Dropdown Menus ---
document.querySelectorAll('.dropdown').forEach(dropdown => {
    const dropbtn = dropdown.querySelector('.dropbtn');
    const dropdownContent = dropdown.querySelector('.dropdown-content');

    dropbtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que o click no botão feche o menu imediatamente
        // Fecha outros dropdowns abertos
        document.querySelectorAll('.dropdown-content').forEach(content => {
            if (content !== dropdownContent && content.style.display === 'block') {
                content.style.display = 'none';
                content.style.opacity = '0';
                content.style.transform = 'translateY(10px)';
                content.closest('.dropdown').querySelector('.arrow').style.transform = 'rotate(45deg)';
                content.closest('.dropdown').querySelector('.arrow').style.borderColor = 'var(--white)';
            }
        });

        // Alterna o dropdown clicado
        if (dropdownContent.style.display === 'block') {
            dropdownContent.style.opacity = '0';
            dropdownContent.style.transform = 'translateY(10px)';
            dropdownContent.addEventListener('transitionend', function handler() {
                dropdownContent.style.display = 'none';
                dropdownContent.removeEventListener('transitionend', handler);
            });
            dropbtn.querySelector('.arrow').style.transform = 'rotate(45deg)';
            dropbtn.querySelector('.arrow').style.borderColor = 'var(--white)';

        } else {
            dropdownContent.style.display = 'block';
            setTimeout(() => {
                dropdownContent.style.opacity = '1';
                dropdownContent.style.transform = 'translateY(0)';
            }, 10); // Pequeno delay para a transição acontecer
            dropbtn.querySelector('.arrow').style.transform = 'rotate(-135deg)';
            dropbtn.querySelector('.arrow').style.borderColor = 'var(--light-blue-green)';
        }
    });

    // Fecha o dropdown se clicar fora dele
    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target)) {
            if (dropdownContent.style.display === 'block') {
                dropdownContent.style.opacity = '0';
                dropdownContent.style.transform = 'translateY(10px)';
                dropdownContent.addEventListener('transitionend', function handler() {
                    dropdownContent.style.display = 'none';
                    dropdownContent.removeEventListener('transitionend', handler);
                });
                dropbtn.querySelector('.arrow').style.transform = 'rotate(45deg)';
                dropbtn.querySelector('.arrow').style.borderColor = 'var(--white)';
            }
        }
    });
});


// --- Configuração e Renderização do Gráfico com Chart.js ---
const ctx = document.getElementById('controlSignalChart').getContext('2d');
let controlSignalChart;

const initialData = {
    labels: Array.from({length: 60}, (_, i) => i), // Tempo em segundos
    datasets: [{
        label: 'MV',
        data: Array.from({length: 60}, () => (Math.random() * 10) + 20), // Dados simulados
        borderColor: 'rgba(0, 255, 192, 0.8)', // Cor verde azulado
        backgroundColor: 'rgba(0, 255, 192, 0.2)',
        tension: 0.3,
        fill: false,
        borderWidth: 2,
        pointRadius: 0 // Pontos invisíveis
    }, {
        label: 'Saída',
        data: Array.from({length: 60}, () => (Math.random() * 10) + 20), // Dados simulados
        borderColor: 'rgba(219, 127, 38, 0.8)', // Cor branca
        backgroundColor: 'rgba(219, 127, 38, 0.2)',
        tension: 0.3,
        fill: false,
        borderWidth: 2,
        pointRadius: 0 // Pontos invisíveis
    }]
};

function renderChart() {
    if (controlSignalChart) {
        controlSignalChart.destroy(); // Destrói o gráfico existente antes de recriar
    }

    controlSignalChart = new Chart(ctx, {
        type: 'line',
        data: initialData,
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite que o gráfico use a altura definida no CSS
            animation: {
                duration: 1000, // Animação de 1 segundo ao carregar
                easing: 'easeInOutQuart'
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Tempo (segundos)',
                        color: '#FFFFFF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)', // Grade X muito sutil
                        lineWidth: 0.5 // Linha muito fina
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sinal de Controle',
                        color: '#FFFFFF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)', // Grade Y muito sutil
                        lineWidth: 0.5 // Linha muito fina
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#FFFFFF' // Cor da legenda
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(28, 43, 71, 0.9)', // Cor de fundo do tooltip
                    titleColor: 'rgba(0, 204, 153, 0.4)',
                    bodyColor: '#FFFFFF',
                    borderColor: 'var(--light-blue-green)',
                    borderWidth: 1,
                    displayColors: true
                }
            }
        }
    });
}

renderChart(); // Renderiza o gráfico na carga inicial

// --- Lógica de Atualização de Dados (Simulada) ---
function updateChartData() {
    const newDataMV = (Math.random() * 10) + 20;
    const newDataOutput = (Math.random() * 10) + 20;

    // Adiciona o novo dado no final e remove o primeiro (simulando um stream)
    initialData.labels.push(initialData.labels[initialData.labels.length - 1] + 1);
    initialData.datasets[0].data.push(newDataMV);
    initialData.datasets[1].data.push(newDataOutput);

    // Remove o primeiro elemento para manter o número fixo de pontos no gráfico
    if (initialData.labels.length > 60) { // Mantém os últimos 60 pontos visíveis
        initialData.labels.shift();
        initialData.datasets[0].data.shift();
        initialData.datasets[1].data.shift();
    }

    // Atualiza os valores em destaque
    document.getElementById('mvValue').textContent = newDataMV.toFixed(1);
    document.getElementById('outputValue').textContent = newDataOutput.toFixed(1);
    // setPointValue permanece estático por enquanto

    controlSignalChart.update('none'); // Atualiza o gráfico sem animação
}

// Atualiza o gráfico a cada 1 segundo (simulação de tempo real)
setInterval(updateChartData, 1000);


// --- Configurações do Gráfico (Sidebar) ---
const scaleAdjustment = document.getElementById('scale-adjustment');
const scaleValueDisplay = document.getElementById('scale-value');
const mvColorInput = document.getElementById('mv-color');
const outputColorInput = document.getElementById('output-color');
const resetButton = document.querySelector('.btn-reset');

scaleAdjustment.addEventListener('input', () => {
    const scale = parseFloat(scaleAdjustment.value);
    scaleValueDisplay.textContent = `${scale.toFixed(1)}x`;

    // Ajusta o zoom do gráfico
    // O Chart.js não tem uma propriedade 'zoom' direta no objeto de escala para ajuste,
    // mas você pode ajustar os limites do eixo Y para simular isso.
    const currentMax = controlSignalChart.options.scales.y.max;
    const currentMin = controlSignalChart.options.scales.y.min;

    // Se você tiver um range fixo de dados (ex: 0-100), pode usar:
    // controlSignalChart.options.scales.y.max = 100 / scale;
    // controlSignalChart.options.scales.y.min = 0 + (100 - (100 / scale)) / 2;

    // Para dados dinâmicos, seria mais complexo e exigiria um estado para o range original
    // Por simplicidade, este exemplo apenas mostra a mudança do valor do slider.
    // Para um ajuste real de escala, você precisaria recalcular os limites do eixo Y
    // com base nos dados atuais e no fator de escala.

    controlSignalChart.update();
});

mvColorInput.addEventListener('input', () => {
    const newColor = mvColorInput.value;
    controlSignalChart.data.datasets[0].borderColor = newColor;
    controlSignalChart.data.datasets[0].backgroundColor = newColor.replace('rgb', 'rgba').replace(')', ', 0.2)'); // Mantém a transparência
    controlSignalChart.update();
});

outputColorInput.addEventListener('input', () => {
    const newColor = outputColorInput.value;
    controlSignalChart.data.datasets[1].borderColor = newColor;
    controlSignalChart.data.datasets[1].backgroundColor = newColor.replace('rgb', 'rgba').replace(')', ', 0.2)'); // Mantém a transparência
    controlSignalChart.update();
});

resetButton.addEventListener('click', () => {
    mvColorInput.value = '#00FFC0';
    outputColorInput.value = '#db7f26';
    controlSignalChart.data.datasets[0].borderColor = 'rgba(0, 255, 192, 0.8)';
    controlSignalChart.data.datasets[0].backgroundColor = 'rgba(0, 255, 192, 0.2)';
    controlSignalChart.data.datasets[1].borderColor = 'rgba(219, 127, 38, 0.8)';
    controlSignalChart.data.datasets[1].backgroundColor = 'rgba(219, 127, 38, 0.2)';
    scaleAdjustment.value = '1';
    scaleValueDisplay.textContent = '1x';
    // Resetar os limites do eixo Y, se você os estiver manipulando
    controlSignalChart.options.scales.y.min = undefined; // Volta ao padrão
    controlSignalChart.options.scales.y.max = undefined; // Volta ao padrão
    controlSignalChart.update();
});

// Inicializa os valores em destaque
document.getElementById('setPointValue').textContent = '25.0'; // Valor fixo por enquanto
document.getElementById('mvValue').textContent = initialData.datasets[0].data[initialData.datasets[0].data.length - 1].toFixed(1);
document.getElementById('outputValue').textContent = initialData.datasets[1].data[initialData.datasets[1].data.length - 1].toFixed(1);