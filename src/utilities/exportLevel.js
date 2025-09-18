import stringify from 'json-stringify-pretty-compact';

export function saveLevelFile(data, filename = "exported_level.json") {
    if(!data){
        console.error("Data export invalid");
        return;
    }
    const blob = new Blob([stringify(data, { maxLength: 60 })], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
