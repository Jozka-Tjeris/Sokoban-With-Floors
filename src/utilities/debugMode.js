const debugMode = true;

export function debugLog(...args){
  if(debugMode){
    console.log(...args);
  }
}