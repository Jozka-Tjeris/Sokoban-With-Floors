import initCheckerFunction from './jsonChecker.js';

//declared when imported
const checkJSONFile = initCheckerFunction();

export function triggerFileImport() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';

    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try{
            const text = await file.text();
            const jsonData = JSON.parse(text);
            if (!checkJSONFile(jsonData)) {
                console.error(checkJSONFile.errors);
                alert("Level file has errors.");
                reject(new Error("Invalid file format"));
                return;
            }
            resolve(jsonData);
        } 
        catch (err) {
            alert('Invalid JSON file or parse error.');
            console.error(err);
            reject(err);
        } finally {
            document.body.removeChild(input);
        }
    };

    document.body.appendChild(input);
    input.click();
  });
}
