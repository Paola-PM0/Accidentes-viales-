let chart;

// Función para crear el gráfico de accidentes por hora
function createHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    const horas = Array.from({ length: 24 }, (_, i) => i);

    // Contar accidentes por hora y tipo
    const counts = horas.map(hora => {
        return {
            hora: hora,
            velocidadInmoderada: data.filter(d => d.properties.hora_sin_min === hora && d.properties.circustancias === "velocidad inmoderada").length,
            viroIndebidamente: data.filter(d => d.properties.hora_sin_min === hora && d.properties.circustancias === "viro indebidamente").length,
            noGuardoDistancia: data.filter(d => d.properties.hora_sin_min === hora && d.properties.circustancias === "no guardo distancia").length
        };
    });

    if (chart) {
        chart.destroy(); // Destruir el gráfico anterior si existe
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: horas,
            datasets: [
                {
                    label: 'velocidad inmoderada',
                    data: counts.map(d => d.velocidadInmoderada),
                    backgroundColor: getColorByType("velocidad inmoderada"), // Rojo
                    borderColor: getColorByType("velocidad inmoderada"),
                    borderWidth: 1
                },
                {
                    label: 'viro indebidamente',
                    data: counts.map(d => d.viroIndebidamente),
                    backgroundColor: getColorByType("viro indebidamente"), // Verde
                    borderColor: getColorByType("viro indebidamente"),
                    borderWidth: 1
                },
                {
                    label: 'no guardo distancia',
                    data: counts.map(d => d.noGuardoDistancia),
                    backgroundColor: getColorByType("no guardo distancia"), // Azul
                    borderColor: getColorByType("no guardo distancia"),
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Función para obtener el color según el tipo de accidente
function getColorByType(tipo) {
    switch (tipo) {
        case "velocidad inmoderada":
            return "#ff0000"; // Rojo
        case "viro indebidamente":
            return "#00ff00"; // Verde
        case "no guardo distancia":
            return "#0000ff"; // Azul
        default:
            return "#aaaaaa"; // Gris por defecto// Gris por defecto
    }
}

// Función para filtrar datos por tipo de accidente
function filterDataByType(data, tipo) {
    if (tipo === "Todos") {
        return data;
    }
    return data.filter(accidente => accidente.tipo_accidente === tipo);
}

// Escuchar cambios en el selector de tipo de accidente
document.getElementById('tipoAccidente').addEventListener('change', (event) => {
    const tipoSeleccionado = event.target.value;
    fetch('/datos/accidentes')
        .then(response => response.json())
        .then(data => {
            const filteredData = filterDataByType(data, tipoSeleccionado);
            createHourlyChart(filteredData); // Actualizar gráfico
            updateMap(filteredData); // Actualizar mapa
        });
});