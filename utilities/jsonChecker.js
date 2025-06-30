import Ajv from 'ajv';

const schema = {
  type: "object",
  required: ["gridSize", "layers"],
  properties: {
    gridSize: {
      type: "object",
      required: ["height", "columns", "rows"],
      properties: {
        height: { type: "number" },
        columns: { type: "number" },
        rows: { type: "number" }
      }
    },
    layers: {
      type: "array",
      items: {
        type: "object",
        required: ["layout"],
        properties: {
          layout: {
            type: "array",
            items: { type: "string" }
          },
          targets: {
            type: "array",
            items: {
              type: "object",
              required: ["position", "directions"],
              properties: {
                position: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2
                },
                directions: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};

export default function initCheckerFunction(){
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    return validate;
}
