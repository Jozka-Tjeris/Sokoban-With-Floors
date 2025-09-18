import fs from "fs";
import path from "path";

const levelsDir = path.join(process.cwd(), "api", "data", "levels");
const indexFile = path.join(process.cwd(), "api", "data", "levelIndex.js");

// Get all JSON files in the levels folder
const files = fs.readdirSync(levelsDir).filter(f => f.endsWith(".json"));

// Build import + export code
let imports = "";
let exportsMap = "export default {\n";

files.forEach((file) => {
  const name = path.basename(file, ".json"); // e.g. "level1"
  imports += `import ${name} from "./levels/${file}";\n`;
  exportsMap += `  "${name}": ${name},\n`;
});

exportsMap += "};\n";

fs.writeFileSync(indexFile, imports + "\n" + exportsMap, "utf-8");

console.log(`Generated levelIndex.js with ${files.length} levels.`);
