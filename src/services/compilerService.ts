import { type Capability, type ExecutionNode, type JDCard, type UIComponentSchema, type IntentMap } from "../types";

export class CompilerService {
  compile(intent: IntentMap, capabilityGraph: Capability[], writeEnabled: boolean): JDCard {
    const executionNodes: Record<string, ExecutionNode> = {};
    const uiComponents: UIComponentSchema[] = [];
    let prevNodeId: string | null = null;

    // 1. Synthesize Execution nodes from steps
    intent.steps.forEach((step, i) => {
      const capability = capabilityGraph.find(c => c.id === step.capabilityId);
      const nodeId = `node_${i}_${step.capabilityId}`;
      
      const node: ExecutionNode = {
        id: nodeId,
        verb: capability?.method || (step.actionType === 'READ' ? 'GET' : 'POST'),
        path: capability?.path,
        operationId: capability?.operationId,
        type: step.actionType === 'MUTATE' ? 'MUTATION' : (step.actionType === 'READ' ? 'READ' : 'TRANSFORM'),
        capability,
        parameters: step.inferredParams || {},
        onSuccess: 'END',
        onFailure: 'TRIGGER_SAGA_ROLLBACK'
      };

      // Handle chaining: if this is a mutation and we had a READ before, maybe we iterate
      if (step.actionType === 'MUTATE' && prevNodeId && executionNodes[prevNodeId].type === 'READ') {
        node.iterator = `${prevNodeId}.exports.items`;
        // Automatically bind ID to path parameter if possible
        if (capability?.path.includes('{id}')) {
          node.parameters.id = "{{iterator.item.id}}";
        }
      }

      // Add exports
      if (step.actionType === 'READ') {
        node.exports = { items: "response.body" };
      }

      executionNodes[nodeId] = node;
      if (prevNodeId) {
        executionNodes[prevNodeId].onSuccess = nodeId;
      }
      prevNodeId = nodeId;
    });

    // 2. Project UI Components
    intent.steps.forEach((step, i) => {
      const nodeId = `node_${i}_${step.capabilityId}`;
      const capability = capabilityGraph.find(c => c.id === step.capabilityId);

      if (step.actionType === 'READ') {
        uiComponents.push({
          id: `preview_${i}`,
          type: 'Data-Table',
          title: `Filtered ${intent.targetEntity || 'Resources'}`,
          bindings: {
            dataSource: `{{${nodeId}.exports.items}}`
          }
        });
      } else if (step.actionType === 'MUTATE') {
        uiComponents.push({
          id: `trigger_${i}`,
          type: 'Action-Trigger-Button',
          title: capability?.summary || 'Execute Operation',
          bindings: {},
          properties: {
            label: capability?.summary || 'Commit Change',
            requiresConfirmation: true,
            variant: 'destructive'
          },
          events: {
            onClick: 'START_GRAPH_EXECUTION'
          }
        });
      }
    });

    return {
      id: `card_${Date.now()}`,
      version: "1.0.0",
      metadata: {
        title: intent.goal || "Automated Operational Tool",
        targetDomain: intent.targetEntity,
        compiledAt: new Date().toISOString()
      },
      capabilitiesMode: writeEnabled ? 'WRITE_ALLOWED' : 'READ_ONLY',
      contracts: {
        inboundIntent: intent.goal,
        expectedEntity: intent.targetEntity || "Any"
      },
      executionGraph: {
        rootNode: Object.keys(executionNodes)[0] || 'END',
        nodes: executionNodes
      },
      uiProjection: {
        layout: intent.steps.length > 2 ? 'STEPPER' : 'vertical-stack',
        components: uiComponents,
        componentRegistryVersion: "1.0"
      }
    };
  }
}

export const compilerService = new CompilerService();
