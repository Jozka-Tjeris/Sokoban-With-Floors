const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const stringify = require('json-stringify-pretty-compact').default;

const app = express();
const PORT = 3000;
app.use(express.json());
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

app.post('/api/save-level', (req, res) => {
    const levelData = req.body;
    if(levelData){
        const jsonString = stringify(levelData, { maxLength: 60 });
        try{
            fs.writeFileSync('./exported_level.json', jsonString);
            res.status(200).json({ message: 'Level saved successfully' });
        }
        catch(err){
            console.error('Error writing file:', err);
            res.status(500).json({ error: 'Failed to write level data to file' });
        }
    }
    else{
        res.status(400).json({error: "Level Data can't be saved; invalid or missing"});
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