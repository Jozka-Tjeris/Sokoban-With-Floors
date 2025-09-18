import legends from "../data/legends.json";

export default function handler(req, res){
    if(req.method !== "GET"){
        return res.status(405).json({ error: "Method not allowed" });
    }

    try{
        res.status(200).json(legends);
    }
    catch (err){
        res.status(404).json({ error: err.message });
    }
}
