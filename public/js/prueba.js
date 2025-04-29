map.on('click', function (e) {
    const url = getFeatureInfoUrl(map, wmsLayer, e.latlng, 'text/html');

    fetch(url)
        .then(response => response.text()) // esperamos HTML, no JSON
        .then(html => {
            L.popup()
                .setLatLng(e.latlng)
                .setContent(html) // mostramos el HTML directamente
                .openOn(map);
        })
        .catch(err => {
            console.error("Error al obtener GetFeatureInfo:", err);
        });
});

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


















































/*inicializo una constante para ver */
let wfsLayer;

function cargarWFS(cqlFilter = "") {
    if (wfsLayer) {
        map.removeLayer(wfsLayer);
    }



    const url = `http://localhost:8080/geoserver/Accidentes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Accidentes:Accidentes_2018_2024&outputFormat=application/json${cqlFilter ? `&CQL_FILTER=${encodeURIComponent(cqlFilter)}` : ''}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
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
        });
}


document.getElementById('tipoAccidente').addEventListener('change', (event) => {
    const tipoSelecionado = event.target.value;

    map.removeLayer(wmsLayer);

    let cqlFilter = "";
    if(tipoSelecionado !== "Todos"){
        cqlFilter = `circunstan = '${tipoSelecionado}'`;
    }

    wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/Accidentes/wms', {
        layers: 'Accidentes:Accidentes_2018_2024',
        format: 'image/png',
        transparent: true,
        CQL_FILTER: cqlFilter,
        version: '1.1.0',
        attribution: 'GeoServer WMS'
    }).addTo(map);

    cargarWFS(cqlFilter); // Aquí cargas la capa interactiva
});
