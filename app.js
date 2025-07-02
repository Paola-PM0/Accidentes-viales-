/*SERVIDOR CON EXPRESS 
//ejemplo de proxy para probar desde el navegador


“Todo lo que esté en esta carpeta lo puedes servir tal cual al navegador”.
*/
/*
//importacion de modulos de express, path y middleware
const express = require("express");
//forma automatico de obtener la ruta raiz del proyecto
const path = require("path");
const {createProxyMiddleware} = require('http-proxy-middleware');


const app = express();

//app.use(cors());

//IOJO importante para que express sirva correctamente los archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));


app.use('/geoserver', createProxyMiddleware({
    target: 'http://localhost:8080', // Dirección de GeoServer
    changeOrigin: true, // Cambia el origen de la solicitud
    pathRewrite: {
      '^/geoserver': '/geoserver', // Esto asegura que la ruta en la URL se mantenga como '/geoserver'
    },
    //OnProxyReq: (pr, req, res)=>{ pr.setHeader('Content-Type', 'application/json')}
}));

//ruteo de documentos estaticos
app.get("/", ((req, res) => {
    //metodo del path para concatenar la ruta raiz del proyecto con la carpeta public
    res.sendFile(path.join(__dirname, 'index.html'));

    //ANTES tenia el index.html dentro de la carpeta publicn entonces la ruta se modifica a 

    //res.sendFile(path.join(__dirname,'public', 'index.html'));
}))

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
})

*/