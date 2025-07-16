<template>
  <div id="map" ref="mapContainer"></div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet-draw';

const mapContainer = ref(null);
let map;
let wmsLayer;

const emit = defineEmits(['mapReady']);

const initMap = () => {
  map = L.map(mapContainer.value).setView([19.7036, -101.1926], 12);

  // Capa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Capa WMS inicial
  wmsLayer = L.tileLayer.wms("https://geoaccidentes.duckdns.org/geoserver/ne/wms", {
    layers: 'ne:Accidentes_2018_2024',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    attribution: 'GeoServer WMS'
  }).addTo(map);

  map.on('click', async (e) => {
    const url = getFeatureInfoUrl(map, wmsLayer, e.latlng);
    const res = await fetch(url);
    const data = await res.json();
    if (data.features.length > 0) {
      const props = data.features[0].properties;
      const contenido = `
        <strong>Hora:</strong> ${props.hora || 'Sin hora'}<br>
        <strong>Situación:</strong> ${props.circunstancias || 'Sin circunstancia'}<br>
        <strong>Domicilio:</strong> ${props.domicilio || 'Sin domicilio'}
      `;
      L.popup().setLatLng(e.latlng).setContent(contenido).openOn(map);
    } else {
      L.popup().setLatLng(e.latlng).setContent("No hay información aquí.").openOn(map);
    }
  });

  // 🔁 Muy importante: asegurar que el mapa se adapte al tamaño real del contenedor
  setTimeout(() => {
    map.invalidateSize();
    emit('mapReady', map);
  }, 300);
};

const getFeatureInfoUrl = (map, layer, latlng) => {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();
  const baseUrl = layer._url;
  const params = {
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
  return `${baseUrl}?${new URLSearchParams(params).toString()}`;
};

onMounted(async () => {
  await nextTick(); // Espera a que Vue termine de pintar
   setTimeout(() => {
    initMap();
  }, 100);
});
</script>

<style scoped>
#map {
    width: 100%;
    height: 100%;
    min-height: 400px;
    position: relative;
    border-radius: 10px;
}
</style>
