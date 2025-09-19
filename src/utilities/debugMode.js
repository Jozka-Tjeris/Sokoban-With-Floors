const debugMode = false;

export function debugLog(...args){
  if(debugMode){
    console.log(...args);
  }
}