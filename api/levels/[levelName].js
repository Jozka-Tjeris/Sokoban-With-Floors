import { levels } from "../../data/levelIndex.js";

export default function handler(req, res){
    if(req.method !== "GET"){
        return res.status(405).json({ error: "Method not allowed" });
    }
    const { levelName } = req.query;
    const level = levels[levelName];

    if(!level){
        return res.status(404).json({ error: "Level not found" });
    }
    res.status(200).json(level);
}
