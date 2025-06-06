import { Position, Cell, Unit } from '../types'
import { GRID_SIZE } from '../constants'

/**
 * Calculates Chebyshev distance (diagonal movement allowed)
 * Used for range calculations where diagonal movement counts as 1
 * @returns Maximum of horizontal and vertical distance
 */
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}

/**
 * Checks if there's a clear line of sight between two positions
 * Uses Bresenham's line algorithm to trace path
 * Walls block line of sight, other terrain types do not
 * @returns true if path is clear, false if blocked
 */
export const getLineOfSight = (from: Position, to: Position, grid: Cell[][]): boolean => {
  // Bresenham's line algorithm setup
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1  // Step direction X
  const sy = from.y < to.y ? 1 : -1  // Step direction Y
  let err = dx - dy  // Error accumulator
  
  let x = from.x
  let y = from.y
  
  // Trace line from start to end
  while (true) {
    // Success: reached target
    if (x === to.x && y === to.y) return true
    
    // Walls block LOS (but not at start/end positions)
    if ((x !== from.x || y !== from.y) && grid[y][x].type === 'wall') {
      return false
    }
    
    // Bresenham's algorithm: determine next step
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * Calculates attack penalty from cover between attacker and target
 * Checks both line-of-fire cover and adjacent cover
 * @returns 0 (no cover), 2 (partial cover from crates), or 4 (hard cover from walls)
 */
export const getCoverPenalty = (from: Position, to: Position, grid: Cell[][]): number => {
  // Use Bresenham's algorithm to trace line of fire
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let err = dx - dy
  
  let x = from.x
  let y = from.y
  let coverPenalty = 0
  
  // Check for intervening cover along the path
  while (true) {
    if (x === to.x && y === to.y) break
    
    // Check if crates provide cover (not at start/end positions)
    if ((x !== from.x || y !== from.y) && (x !== to.x || y !== to.y)) {
      if (grid[y][x].type === 'crate') {
        coverPenalty = Math.max(coverPenalty, 2) // Crates provide -2 AC
      }
    }
    
    // Move to next point on line
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  
  // Check for adjacent cover (target hiding behind obstacles)
  const adjacent = getAdjacentPositions(to)
  for (const adj of adjacent) {
    if (adj.x >= 0 && adj.x < GRID_SIZE && adj.y >= 0 && adj.y < GRID_SIZE) {
      const adjCell = grid[adj.y][adj.x]
      if (adjCell.type === 'crate' || adjCell.type === 'wall') {
        // Calculate if obstacle is between attacker and target (within 45° cone)
        const angleToAdj = Math.atan2(adj.y - from.y, adj.x - from.x)
        const angleToTarget = Math.atan2(to.y - from.y, to.x - from.x)
        const angleDiff = Math.abs(angleToAdj - angleToTarget)
        
        if (angleDiff < Math.PI / 4) { // 45 degree cone
          // Walls provide better cover than crates
          coverPenalty = adjCell.type === 'wall' ? 4 : Math.max(coverPenalty, 2)
        }
      }
    }
  }
  
  return coverPenalty
}

/**
 * Calculates all reachable positions within movement range
 * Uses breadth-first search with movement costs
 * Crates cost 2 movement points (difficult terrain)
 * @returns Array of valid movement positions
 */
export const getMovementRange = (
  start: Position,
  speed: number,
  grid: Cell[][],
  units: Unit[]
): Position[] => {
  const validMoves: Position[] = []
  const visited = new Set<string>()
  const queue: { pos: Position; distance: number }[] = [{ pos: start, distance: 0 }]
  
  // BFS to find all reachable cells
  while (queue.length > 0) {
    const { pos, distance } = queue.shift()!
    const key = `${pos.x},${pos.y}`
    
    // Skip if already processed
    if (visited.has(key)) continue
    visited.add(key)
    
    // Add to valid moves (excluding start position)
    if (pos.x !== start.x || pos.y !== start.y) {
      validMoves.push(pos)
    }
    
    // Stop expanding if at movement limit
    if (distance >= speed) continue
    
    // Check all 8 directions (including diagonals)
    const directions = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                    { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
    ]
    
    for (const dir of directions) {
      const newX = pos.x + dir.x
      const newY = pos.y + dir.y
      
      // Validate bounds
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue
      
      // Check terrain walkability
      const cell = grid[newY][newX]
      if (cell.type === 'wall') continue  // Walls block movement
      
      // Check unit collision
      const occupied = units.some(u => u.position.x === newX && u.position.y === newY && u.hp > 0)
      if (occupied) continue
      
      // Calculate movement cost (crates are difficult terrain)
      const cost = cell.type === 'crate' ? 2 : 1
      const newDistance = distance + cost
      
      // Add to queue if within movement range
      if (newDistance <= speed) {
        queue.push({ pos: { x: newX, y: newY }, distance: newDistance })
      }
    }
  }
  
  return validMoves
}

/**
 * Gets all 8 adjacent positions (including diagonals)
 * Filters out positions outside grid bounds
 * @returns Array of valid adjacent positions
 */
export const getAdjacentPositions = (pos: Position): Position[] => {
  const adjacent: Position[] = []
  const directions = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },  // Top row
    { x: -1, y: 0 },                    { x: 1, y: 0 },   // Middle row
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }    // Bottom row
  ]
  
  for (const dir of directions) {
    const newX = pos.x + dir.x
    const newY = pos.y + dir.y
    
    // Only include positions within grid bounds
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      adjacent.push({ x: newX, y: newY })
    }
  }
  
  return adjacent
}