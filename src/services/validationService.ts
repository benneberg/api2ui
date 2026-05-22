import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const jdCardSchema = {
  type: "object",
  properties: {
    version: { type: "string" },
    intent: {
      type: "object",
      properties: {
        goal: { type: "string" },
        selectedCapabilities: { type: "array", items: { type: "string" } }
      },
      required: ["goal", "selectedCapabilities"]
    },
    capabilities: {
      type: "object",
      properties: {
        mode: { enum: ["READ_ONLY", "WRITE_ALLOWED"] },
        requiredEndpoints: { type: "array", items: { type: "string" } }
      },
      required: ["mode", "requiredEndpoints"]
    },
    execution: {
      type: "object",
      properties: {
        nodes: { type: "array" },
        edges: { type: "array" }
      },
      required: ["nodes", "edges"]
    },
    ui: {
      type: "object",
      properties: {
        layout: { type: "array" },
        componentRegistryVersion: { type: "string" }
      },
      required: ["layout", "componentRegistryVersion"]
    },
    metadata: {
      type: "object",
      properties: {
        specUrl: { type: "string" },
        createdAt: { type: "string", format: "date-time" }
      },
      required: ["specUrl", "createdAt"]
    }
  },
  required: ["version", "intent", "capabilities", "execution", "ui", "metadata"]
};

const validate = ajv.compile(jdCardSchema);

export function validateJdCard(data: any) {
  const valid = validate(data);
  return {
    valid,
    errors: validate.errors
  };
}
