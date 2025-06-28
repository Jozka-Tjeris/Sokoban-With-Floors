const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.get('/api/legends.json', (req, res) => {
    const levelPath = path.resolve(`./backend/legends.json`);

    if(fs.existsSync(levelPath)){
        const data = fs.readFileSync(levelPath, 'utf-8');
        res.json(JSON.parse(data));
    }
    else{
        res.status(404).json({error: "Legend not found"});
    }
});

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