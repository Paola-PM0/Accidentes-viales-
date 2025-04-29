fetch('http://localhost:8080/geoserver/Accidentes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Accidentes%3AAccidentes_2018_2024&maxFeatures=50&outputFormat=application%2Fjson')
    .then(response => response.json())
    .then(data => {
        console.log("Datos recibidos:", data)
        
        createHourlyChart(data); // Mostrar todos los datos inicialmente en el gráfico
        //updateMap(data); // Mostrar todos los datos inicialmente en el mapa
    });



