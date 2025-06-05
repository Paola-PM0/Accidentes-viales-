let map;
let wfsLayer;
let chart;

// Función para cargar datos y crear el mapa  
function initMap() {
    map = L.map('map').setView([19.7036, -101.1926], 12);  
    // Añadir capa de mapa base 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    //capa de wms traida desde geoserver 
    wmsLayer = L.tileLayer.wms("https://geoaccidentes.duckdns.org/geoserver/ne/wms", {
        layers: 'ne:Accidentes_2018_2024',
        format: 'image/png',
        transparent: true,
        /*CQL_FILTER: "circunstan =  'no guardo distancia'",*/
        version: '1.1.0', 
        attribution: 'GeoServer WMS'
    }).addTo(map);

    //http://localhost:8080/geoserver/Accidentes/wms url local
    //el otro 
    //http://44.204.60.238:8080/geoserver/ne/wms

    // para filtar con CQL
    document.getElementById('tipoAccidente').addEventListener('change', (event) => {
        const tipoSelecionado = event.target.value;

        map.removeLayer(wmsLayer);

        //filtro para CQL
        let cqlFilter = "";
        
        if(tipoSelecionado !== "Todos"){
            cqlFilter = `circunstancias = '${tipoSelecionado}'`;     
        }
        wmsLayer = L.tileLayer.wms('https://geoaccidentes.duckdns.org/geoserver/ne/wms', {
            layers: 'ne:Accidentes_2018_2024',
            format: 'image/png',
            transparent: true,
            CQL_FILTER: cqlFilter,
            version: '1.1.0',
            attribution: 'GeoServer WMS'
        }).addTo(map);
        /*cargarWFS(cqlFilter);*/
        actualizarGrafica(tipoSelecionado);
    });


    //POP
    //funcion para mostrar informacion del punto 
    map.on('click', function (e) {  //donde e es la ubicacion del punto
    const url = getFeatureInfoUrl(map, wmsLayer, e.latlng, 'application/json');  //'text/html' ultimo parametro define como retorna la informacion
    fetch(url)
        .then(response => response.json()) 
        .then(data => {
            // Asegurar de que haya al menos una "feature"
            if (data.features.length > 0) {
                const props = data.features[0].properties;
        
                
                const circunstancia = props.circunstancias || "Sin circunstancia";
                const hora = props.hora || "Sin hora";
                const domicilio = props.domicilio || "Sin domicilio";
                const contenido = `<strong>Hora:</strong> ${hora}<br><strong>Situación:</strong> ${circunstancia}<br><strong>Domicilio:</strong> ${domicilio}`;
        
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(contenido)
                    .openOn(map);
            } else {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("No hay información aquí.")
                    .openOn(map);
            }
            //console.log(data.features[0].properties);
        })
    });

    //Funcion que obtiene la informacion para construir la url completa para realizar una consulta WMS GetFeatureInfo,
    function getFeatureInfoUrl(map, layer, latlng, params = {}) {
    const point = map.latLngToContainerPoint(latlng, map.getZoom());
    const size = map.getSize();

    const baseUrl = layer._url;

    const defaultParams = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: '',
        transparent: true,
        version: layer.wmsParams.version,
        format: layer.wmsParams.format,
        bbox: map.getBounds().toBBoxString(),
        height: size.y,
        width: size.x,
        layers: layer.wmsParams.layers,
        query_layers: layer.wmsParams.layers,
        info_format: 'application/json',
        x: Math.floor(point.x),
        y: Math.floor(point.y)
    };

    const finalParams = new URLSearchParams(Object.assign({}, defaultParams, params));
    return `${baseUrl}?${finalParams.toString()}`;
    }

}


//Asinconrna para que el codigo se espere xd
async function actualizarGrafica(tipoSelecionado) {

    //antes en local:  http://localhost:8080/geoserver/Accidentes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Accidentes:Accidentes_2018_2024&outputFormat=application/json
    //const url = `https://geoaccidentes.duckdns.org/geoserver/ne/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne%3AAccidentes_2018_2024&outputFormat=application%2Fjson`;
    const url = 'https://api-geoaccidentes.duckdns.org/api/datos';
                
    try {
        const response = await fetch(url); //se envia la solicitud o sea la peticion  y la guardo para despues convertira a JSON 
        const data = await response.json();  //en data guardo todo el JSON que se obtiene de la peticion, son await porque el codigo no avanzar 
        //hasta que se recibio la peticion 
        console.log("datos:",data);
        const cuentaTipos = {}; //arrego para contar los accidentes por tipo 

        data.features.forEach(feature => {
            console.log("fecture",feature);
            const tipo = feature.properties.circunstancias || "Desconocido";
            cuentaTipos[tipo] = (cuentaTipos[tipo] || 0) + 1;
        });

        let labels = [];
        let valores = [];

        if (tipoSelecionado === "Todos") {
            // Mostrar todos los tipos
            labels = Object.keys(cuentaTipos);
            valores = Object.values(cuentaTipos);
        } else {
            const seleccionados = cuentaTipos[tipoSelecionado] || 0;
            const otros = Object.values(cuentaTipos).reduce((a, b) => a + b, 0) - seleccionados;
            labels = [tipoSelecionado, "Otros"];
            valores = [seleccionados, otros];
        }

        renderizarGrafica(labels, valores);

    } catch (error) {
        console.error("Error al obtener datos para la gráfica:", error);
    }
}





function renderizarGrafica(labels, data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');

    if (chart) chart.destroy(); // Destruye la gráfica anterior si existe

    const total = data.reduce((a, b) => a + b, 0);

    // Mostrar total en el div
    document.getElementById('totalAccidentes').innerText = `Total de accidentes: ${total}`;

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Accidentes por tipo',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.parsed;
                            const porcentaje = ((valor / total) * 100).toFixed(1);
                            return `${context.label}: ${valor} (${porcentaje}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Distribución de accidentes por tipo'
                }
            }
        }
    });
}




/*
function cargarWFS(cqlFilter = "") {
    if (wfsLayer) {
        map.removeLayer(wfsLayer);
    }

    const url = `http://localhost:8080/geoserver/Accidentes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Accidentes:Accidentes_2018_2024&outputFormat=application/json${cqlFilter ? `&CQL_FILTER=${encodeURIComponent(cqlFilter)}` : ''}`;

    fetch(url) 
        .then(response => {
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos recibidos:", data);

            wfsLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    layer.on('click', function () {
                        const props = feature.properties;
                        const popupContent = `
                            <b>Día:</b> ${props.dia}<br>
                            <b>Hora:</b> ${props.hora}<br>
                            <b>Tiempo:</b> ${props.tiempo}<br>
                            <b>Circunstancia:</b> ${props.circunstan}
                        `;
                        layer.bindPopup(popupContent).openPopup();
                    });
                },
                
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, { radius: 6, color: 'red' });
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error("Error al cargar WFS:", error);
        });
}*/


/*
function renderizarGrafica(labels, data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');

    if (chart) chart.destroy(); // Destruye la gráfica anterior si existe

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Accidentes por tipo',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let valor = context.parsed;
                            let porcentaje = ((valor / total) * 100).toFixed(1);
                            return `${context.label}: ${valor} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}*/

// Inicializar el mapa al cargar la página
document.addEventListener('DOMContentLoaded', initMap);


