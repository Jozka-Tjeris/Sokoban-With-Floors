import express from "express";
import cors from "cors";
import { getLegends, getLevel, saveLevel } from "./levelUtils.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.get("/api/legends.json", (req, res) => {
    try{
        res.json(getLegends());
    }
    catch (err){
        res.status(404).json({ error: err.message });
    }
});

app.get("/api/levels/:levelName", (req, res) => {
    try{
        res.json(getLevel(req.params.levelName));
    }
    catch (err){
        res.status(404).json({ error: err.message });
    }
});

app.post("/api/save-level", (req, res) => {
    try{
        const result = saveLevel(req.body);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});
