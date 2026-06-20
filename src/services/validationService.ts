import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const jdCardSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    version: { type: "string" },
    metadata: {
      type: "object",
      properties: {
        title: { type: "string" },
        targetDomain: { type: "string" },
        compiledAt: { type: "string" }
      },
      required: ["title", "compiledAt"]
    },
    capabilitiesMode: { enum: ["READ_ONLY", "WRITE_SESSION_REQUIRED", "WRITE_ALLOWED"] },
    contracts: {
      type: "object",
      properties: {
        inboundIntent: { type: "string" },
        expectedEntity: { type: "string" }
      },
      required: ["inboundIntent", "expectedEntity"]
    },
    executionGraph: {
      type: "object",
      properties: {
        rootNode: { type: "string" },
        nodes: { type: "object" }
      },
      required: ["rootNode", "nodes"]
    },
    uiProjection: {
      type: "object",
      properties: {
        layout: { type: "string" },
        components: { type: "array" },
        componentRegistryVersion: { type: "string" }
      },
      required: ["layout", "components"]
    }
  },
  required: ["id", "version", "metadata", "capabilitiesMode", "contracts", "executionGraph", "uiProjection"]
};

const validate = ajv.compile(jdCardSchema);

export function validateWorkflowApplet(data: any) {
  const valid = validate(data);
  return {
    valid,
    errors: validate.errors
  };
}
