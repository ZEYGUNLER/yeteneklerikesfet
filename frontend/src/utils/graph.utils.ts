export interface GraphNode {
  id: string;
  type: 'start' | 'safe' | 'risky' | 'key' | 'gate' | 'treasure' | 'deadend';
  connections: string[];
}

export function calculateOptimalPathLength(nodes: GraphNode[], startId: string): number | null {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Find target node (treasure)
  const targetNode = nodes.find(n => n.type === 'treasure');
  if (!targetNode) return null; // No treasure? Cannot solve.

  // State interface for BFS
  interface BFSState {
    id: string;
    hasKey: boolean;
    pathLength: number;
  }

  const queue: BFSState[] = [];
  const visited = new Set<string>();

  // Initialize
  queue.push({ id: startId, hasKey: false, pathLength: 0 });
  visited.add(`${startId}_false`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodeMap.get(current.id);

    if (!currentNode) continue;

    // Did we reach the treasure?
    if (currentNode.type === 'treasure') {
      return current.pathLength;
    }

    for (const neighborId of currentNode.connections) {
      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      // Rule 1: Cannot step on traps or dead ends for OPTIMAL path.
      if (neighborNode.type === 'risky' || neighborNode.type === 'deadend') {
        continue;
      }

      let nextHasKey = current.hasKey;

      // Rule 2: If it's a key, we collect it.
      if (neighborNode.type === 'key') {
        nextHasKey = true;
      }

      // Rule 3: If it's a gate, we MUST have the key.
      if (neighborNode.type === 'gate' && !nextHasKey) {
        continue; // Blocked
      }

      const stateKey = `${neighborId}_${nextHasKey}`;

      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push({
          id: neighborId,
          hasKey: nextHasKey,
          pathLength: current.pathLength + 1,
        });
      }
    }
  }

  // Unreachable
  return null;
}
