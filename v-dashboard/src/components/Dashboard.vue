    <template>
    <header>
        <nav class="navbar">
        <div class="div-logo">
            <img :src="escudoImg" alt="logo" />
        </div>
        <div class="div-logo">
            <img :src="logoImg" alt="logo" />
        </div>
        <h1>Dashboard de Accidentes Viales</h1>
        <button @click="togglePanel">{{ mostrarPanel ? 'Ocultar Panel' : 'Mostrar Panel' }}</button>
        </nav>
    </header>

    <main>
        <section v-show="mostrarPanel" id="dashboardPanel" class="dashboard">
        <div class="card">
            <h3>Tipos de Accidentes</h3>
            <canvas id="hourlyChartbarras"></canvas>
            <canvas id="tipoAccidenteChart" width="300" height="150"></canvas>
        </div>
        <div class="card">
            <div id="sidebar">
            <label for="tipoAccidente">Selecciona el tipo de accidente:</label>
            <select id="tipoAccidente" @change="filtrarAccidentes">
                <option value="Todos">Todos</option>
                <option value="velocidad inmoderada">Velocidad inmoderada</option>
                <option value="viro indebidamente">Viro indebidamente</option>
                <option value="no guardo distancia">No guardó distancia</option>
                <option value="imprudencia">Imprudencia</option>
            </select>
            <div id="totalAccidentes" style="text-align: center; font-weight: bold; margin-bottom: 10px;"></div>
            <canvas id="hourlyChart"></canvas>
            </div>
        </div>
        <div class="card">
            <h3>10 zonas con más accidentes viales en la ciudad</h3>
            <ol id="list"></ol>
        </div>
        </section>
        <div class="map-container">
            <MapaLeaflet @mapReady="handleMapReady" />
        </div>
    </main>
    </template>

    <script setup>
    import { onMounted, ref } from 'vue';
    import Chart from 'chart.js/auto';
    import MapaLeaflet from './MapaLeaflet.vue';
    import escudoImg from '@/assets/Escudo-Morelia-BCO.png';
    import logoImg from '@/assets/logo-blanco.png';
    import '@/assets/styleHome.css';

    const mostrarPanel = ref(true);
    let chart = null;
    let chartBarra = null;
    let map = null;
    let currentWmsLayer = null;

    const togglePanel = () => {
    mostrarPanel.value = !mostrarPanel.value;
    };

    const handleMapReady = (mapInstance) => {
    map = mapInstance;
    currentWmsLayer = map._layers[Object.keys(map._layers).pop()]; // último layer WMS
    };

    const filtrarAccidentes = async (event) => {
    const tipo = event.target.value;
    if (map && currentWmsLayer) {
        map.removeLayer(currentWmsLayer);
    }

    const cql = tipo !== 'Todos' ? `circunstancias = '${tipo}'` : '';
    const newWms = L.tileLayer.wms('https://geoaccidentes.duckdns.org/geoserver/ne/wms', {
        layers: 'ne:Accidentes_2018_2024',
        format: 'image/png',
        transparent: true,
        CQL_FILTER: cql,
        version: '1.1.0',
        attribution: 'GeoServer WMS',
    }).addTo(map);

    map.invalidateSize(); 

    currentWmsLayer = newWms;
    await actualizarGrafica(tipo);
    };

    const actualizarGrafica = async (tipo) => {
    const url = tipo === "Todos"
        ? 'https://api-geoaccidentes.duckdns.org/api/datos'
        : `https://api-geoaccidentes.duckdns.org/api/datos?tipo=${encodeURIComponent(tipo)}`;

    const response = await fetch(url);
    const data = await response.json();

    let labels = [], valores = [];
    if (tipo === "Todos") {
        const cuentaTipos = {};
        data.forEach(item => cuentaTipos[item.tipo || "Desconocido"] = item.total);
        labels = Object.keys(cuentaTipos);
        valores = Object.values(cuentaTipos);
    } else {
        const total = data[0]?.total || 0;
        const all = await fetch('https://api-geoaccidentes.duckdns.org/api/datos');
        const allData = await all.json();
        const totalGlobal = allData.reduce((sum, item) => sum + item.total, 0);
        labels = [tipo, "Otros"];
        valores = [total, totalGlobal - total];
    }

    renderizarGrafica(labels, valores);
    };

    const renderizarGrafica = (labels, data) => {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    if (chart) chart.destroy();
    const total = data.reduce((a, b) => a + b, 0);
    document.getElementById('totalAccidentes').innerText = `Total de accidentes: ${total}`;
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
        labels,
        datasets: [{
            label: 'Accidentes por tipo',
            data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63']
        }]
        },
        options: {
        responsive: true,
        plugins: {
            legend: { position: 'right' },
            tooltip: {
            callbacks: {
                label: context => {
                const valor = context.parsed;
                const porcentaje = ((valor / total) * 100).toFixed(1);
                return `${context.label}: ${valor} (${porcentaje}%)`;
                }
            }
            },
            title: { display: true, text: 'Distribución de accidentes por tipo' }
        }
        }
    });
    };

    const actualizarGraficaBarras = async () => {
    const response = await fetch('https://api-geoaccidentes.duckdns.org/api/graficoBarras');
    const data = await response.json();
    const labels = data.map(i => i.tipo || 'desconocido');
    const valores = data.map(i => i.total);
    renderizarGraficaBarras(labels, valores);
    };

    const renderizarGraficaBarras = (labels, data) => {
    const ctx = document.getElementById('hourlyChartbarras').getContext('2d');
    if (chartBarra) chartBarra.destroy();
    const total = data.reduce((a, b) => a + b, 0);
    document.getElementById('totalAccidentes').innerText = `Total de accidentes: ${total}`;
    chartBarra = new Chart(ctx, {
        type: 'bar',
        data: {
        labels,
        datasets: [{
            label: 'Accidente por tipo',
            data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63']
        }]
        },
        options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Total' } },
            x: { beginAtZero: true, title: { display: true, text: 'Tipo de Accidentes' } }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Tipo de Accidentes' }
        }
        }
    });
    };

    const listaCiudades = async () => {
    const response = await fetch('https://api-geoaccidentes.duckdns.org/api/ciudad');
    const data = await response.json();
    const lista = document.getElementById('list');
    lista.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.ciudad || 'desconocido'}: ${item.total} accidentes`;
        lista.appendChild(li);
    });
    };

    onMounted(() => {
    actualizarGraficaBarras();
    listaCiudades();
    });
    </script>


