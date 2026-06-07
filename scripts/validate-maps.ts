import { WORLD_1_MAPS, WORLD_2_MAPS, WORLD_3_MAPS, MapDefinition, MapNode } from '../frontend/src/config/treasureMaps.config';
import { calculateOptimalPathLength } from '../frontend/src/utils/graph.utils';

function countValidPaths(map: MapDefinition): number {
  let validPathCount = 0;
  const nodeMap = new Map<string, MapNode>();
  map.nodes.forEach(n => nodeMap.set(n.id, n));

  const targetNode = map.nodes.find(n => n.type === 'treasure');
  if (!targetNode) return 0;

  function dfs(currentId: string, visited: Set<string>, hasKey: boolean) {
    if (currentId === targetNode!.id) {
      validPathCount++;
      return;
    }

    const currentNode = nodeMap.get(currentId);
    if (!currentNode) return;

    for (const neighborId of currentNode.connections) {
      if (visited.has(neighborId)) continue; // Simple path only

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      if (neighborNode.type === 'risky' || neighborNode.type === 'deadend') continue;

      let nextHasKey = hasKey;
      if (neighborNode.type === 'key') nextHasKey = true;

      if (neighborNode.type === 'gate' && !nextHasKey) continue;

      // Backtracking DFS
      visited.add(neighborId);
      dfs(neighborId, visited, nextHasKey);
      visited.delete(neighborId);
    }
  }

  const startVisited = new Set<string>();
  startVisited.add('A');
  dfs('A', startVisited, false);

  return validPathCount;
}

function validateMap(map: MapDefinition, worldIndex: number, roundIndex: number): string[] {
  const errors: string[] = [];

  // 1. Is solvable?
  const optimalPath = calculateOptimalPathLength(map.nodes, 'A');
  if (optimalPath === null) {
    errors.push('CRITICAL: Map is unsolvable. No valid path from Start to Treasure.');
  }

  // 2. Thematic names check
  const genericNames = ['Yol', 'Kavşak', 'Palmiye', 'Merkez'];
  map.nodes.forEach(node => {
    if (genericNames.includes(node.label)) {
      errors.push(`IMMERSION: Node '${node.id}' uses generic label '${node.label}'. Use thematic names.`);
    }
  });

  // 3. Complexity: Decision Points (degree > 2)
  const decisionPoints = map.nodes.filter(n => n.connections.length > 2).length;

  // 4. Valid Path Count (multiple solutions)
  const paths = countValidPaths(map);
  if (paths < 2) {
    errors.push(`COMPLEXITY: Map only has ${paths} valid paths. Must have at least 2 valid simple paths to the treasure.`);
  }

  // 5. World-Based Thresholds
  if (worldIndex === 1) {
    if (map.nodes.length < 5) errors.push('WORLD 1 RULE: Must have at least 5 nodes.');
    if (decisionPoints < 1) errors.push('WORLD 1 RULE: Must have at least 1 decision point (node with >2 connections).');
  } else if (worldIndex === 2) {
    if (map.nodes.length < 6) errors.push('WORLD 2 RULE: Must have at least 6 nodes.');
    if (decisionPoints < 2) errors.push('WORLD 2 RULE: Must have at least 2 decision points.');
    
    const hasKey = map.nodes.some(n => n.type === 'key');
    const hasGate = map.nodes.some(n => n.type === 'gate');
    if (!hasKey || !hasGate) errors.push('WORLD 2 RULE: Must contain at least one Key and one Gate.');
  } else if (worldIndex === 3) {
    if (map.nodes.length < 7) errors.push('WORLD 3 RULE: Must have at least 7 nodes.');
    if (decisionPoints < 2) errors.push('WORLD 3 RULE: Must have at least 2 decision points.');
    
    const hasTrap = map.nodes.some(n => n.type === 'risky' || n.type === 'deadend');
    if (!hasTrap) errors.push('WORLD 3 RULE: Must contain at least one risky trap or deadend.');
  }

  // 6. Key-Door progression and dead-end key check
  const hasKeyGlobally = map.nodes.some(n => n.type === 'key');
  const hasGateGlobally = map.nodes.some(n => n.type === 'gate');
  
  if (hasGateGlobally && !hasKeyGlobally) {
    errors.push('LOGIC: Map has a gate but no key to open it.');
  }

  if (hasKeyGlobally) {
    const keyNodes = map.nodes.filter(n => n.type === 'key');
    keyNodes.forEach(kn => {
      // If a key node only has 1 connection, it's a dead end. 
      if (kn.connections.length === 1) {
        errors.push(`LOGIC: Key node '${kn.id}' is a dead-end. Keys must have an exit connection (part of a loop or path).`);
      }
    });
  }

  return errors;
}

function runValidation() {
  console.log('🗺️ Starting Map Validation...\n');
  let totalErrors = 0;

  const worlds = [WORLD_1_MAPS, WORLD_2_MAPS, WORLD_3_MAPS];

  worlds.forEach((worldMaps, wIndex) => {
    worldMaps.forEach((map, rIndex) => {
      const errors = validateMap(map, wIndex + 1, rIndex + 1);
      if (errors.length > 0) {
        console.log(`❌ World ${wIndex + 1} - Round ${rIndex + 1}: ${map.name}`);
        errors.forEach(e => console.log(`   - ${e}`));
        totalErrors += errors.length;
      } else {
        console.log(`✅ World ${wIndex + 1} - Round ${rIndex + 1}: ${map.name} (Valid)`);
      }
    });
  });

  console.log('\n====================================');
  if (totalErrors === 0) {
    console.log('🎉 All maps are perfectly valid, complex, and thematic!');
    process.exit(0);
  } else {
    console.error(`🚨 Validation failed with ${totalErrors} errors. Maps need redesign.`);
    process.exit(1);
  }
}

runValidation();
