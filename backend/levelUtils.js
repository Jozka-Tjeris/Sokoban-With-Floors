import fs from "fs";
import path from "path";
import stringify from "json-stringify-pretty-compact";

const legendsPath = path.join(process.cwd(), "api", "data", "legends.json");
const levelsPath = path.join(process.cwd(), "api", "data", "levels");

export function getLegends(){
    if(fs.existsSync(legendsPath)){
        const data = fs.readFileSync(legendsPath, "utf-8");
        return JSON.parse(data);
    }
    throw new Error("Legend not found");
}

export function getLevel(levelName){
    const levelPath = path.resolve(`${levelsPath}/${levelName}.json`);
    if(fs.existsSync(levelPath)){
        const data = fs.readFileSync(levelPath, "utf-8");
        return JSON.parse(data);
    }
    throw new Error("Level not found");
}

export function saveLevel(levelData){
    if(!levelData) throw new Error("Invalid level data");
    const jsonString = stringify(levelData, { maxLength: 60 });

    fs.writeFileSync("./exported_level.json", jsonString);

    return { message: "Level saved successfully" };
}
