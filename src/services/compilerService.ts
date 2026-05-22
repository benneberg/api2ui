import { type Capability, type Intent, type ExecutionNode, type ExecutionEdge, type jdCard } from "../types";

export class CompilerService {
  compile(intent: Intent, capabilityGraph: Capability[], writeEnabled: boolean): jdCard {
    const nodes: ExecutionNode[] = [];
    const edges: ExecutionEdge[] = [];
    let lastNodeId: string | null = null;

    for (const capId of intent.selectedCapabilities) {
      const capability = capabilityGraph.find(c => c.id === capId);
      if (!capability) continue;

      // Safety Gate
      if (!capability.isRead && !writeEnabled) {
        console.warn(`Skipping mutation node in Read-Only mode: ${capId}`);
        continue;
      }

      const nodeId = `node_${nodes.length}`;
      nodes.push({
        id: nodeId,
        capabilityId: capability.id,
        capability,
        type: capability.isRead ? 'READ' : 'MUTATION',
        bindings: {}
      });

      if (lastNodeId) {
        edges.push({ from: lastNodeId, to: nodeId });
      }
      lastNodeId = nodeId;
    }

    return {
      version: "0.3.0",
      intent,
      capabilities: {
        mode: writeEnabled ? 'WRITE_ALLOWED' : 'READ_ONLY',
        requiredEndpoints: nodes.map(n => n.capability.path)
      },
      execution: { nodes, edges },
      ui: {
        layout: [], // To be filled by projection
        componentRegistryVersion: "1.0"
      },
      metadata: {
        specUrl: "", // Filled by UI
        createdAt: new Date().toISOString()
      }
    };
  }
}

export const compilerService = new CompilerService();
