// const http = require('http');
// const {readFile, readFileSync} = require("fs");

// http.createServer(function(req, res) {
//     if(req.url === "/new"){
//         readFile('./index.html', function(err, data) {
//             res.writeHead(200, {'Content-Type': 'text/html'});
//             res.write(data);
//             res.end();
//         });
//         console.log("E")
//     }
//     else if(req.url === "/" || req.url === "/index.html"){
//         readFile('./index.html', function(err, data) {
//             res.writeHead(200, {'Content-Type': 'text/html'});
//             res.write(data);
//             res.end();
//         });
//     } else if(req.url === "/styles.css"){
//         readFile('./styles.css', function(err, data) {
//             res.writeHead(200, {'Content-Type': 'text/css'});
//             res.write(data);
//             res.end();
//         });
//     } else if(req.url === "/script.js"){
//         readFile('./script.js', function(err, data) {
//             res.writeHead(200, {'Content-Type': 'application/javascript'});
//             res.write(data);
//             res.end();
//         });
//     } else {
//         res.writeHead(404, { 'Content-Type': 'text/plain' });
//         res.end('404 Not Found');
//     }
// }).listen(8080);

// console.log('Server running at http://localhost:8080/');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.get('/api/levels/:levelName', (req, res) => {
    const levelName = req.params.levelName;
    const levelPath = path.resolve(`./backend/levels/${levelName}.json`);

    if(fs.existsSync(levelPath)){
        const data = fs.readFileSync(levelPath, 'utf-8');
        res.json(JSON.parse(data));
    }
    else{
        res.status(404).json({error: "Level not found"});
    }
});

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});