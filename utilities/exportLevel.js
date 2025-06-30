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

export async function sendLevelData(levelData){
    try {
        const response = await fetch('/api/save-level', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(levelData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        console.log('Level saved:', result);
    } catch (err) {
        console.error('Error saving level data:', err);
    }
}

