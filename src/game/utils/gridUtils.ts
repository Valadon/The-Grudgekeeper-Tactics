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
 * Cover types for enhanced tactical combat
 */
export type CoverType = 'none' | 'half' | 'full'

/**
 * Calculates cover type between attacker and target
 * @returns Cover type and penalty value
 */
export const getCoverInfo = (from: Position, to: Position, grid: Cell[][]): {type: CoverType, penalty: number} => {
  // Check for intervening obstacles in line of fire
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let err = dx - dy
  
  let x = from.x
  let y = from.y
  let maxCoverPenalty = 0
  
  // Trace line and check for cover
  while (!(x === to.x && y === to.y)) {
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
    
    // Skip start and end positions
    if ((x !== from.x || y !== from.y) && (x !== to.x || y !== to.y)) {
      const cell = grid[y][x]
      if (cell.type === 'crate') {
        maxCoverPenalty = Math.max(maxCoverPenalty, 2) // Half cover
      } else if (cell.type === 'wall') {
        maxCoverPenalty = Math.max(maxCoverPenalty, 4) // Full cover (blocks shot)
      }
    }
  }
  
  // Check for adjacent cover to target (defender gets benefit)
  const adjacentCover = getAdjacentCoverBonus(to, from, grid)
  maxCoverPenalty = Math.max(maxCoverPenalty, adjacentCover)
  
  // Determine cover type
  if (maxCoverPenalty >= 4) {
    return { type: 'full', penalty: 4 }
  } else if (maxCoverPenalty >= 2) {
    return { type: 'half', penalty: 2 }
  } else {
    return { type: 'none', penalty: 0 }
  }
}

/**
 * Check for cover bonus from adjacent obstacles
 * Target gets cover benefit if attacker's line of fire is partially blocked
 */
const getAdjacentCoverBonus = (target: Position, attacker: Position, grid: Cell[][]): number => {
  // Calculate direction from target to attacker
  const dx = attacker.x - target.x
  const dy = attacker.y - target.y
  
  // Normalize direction (rough approximation)
  const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1
  const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1
  
  // Check positions that could provide cover
  const coverPositions = [
    { x: target.x - dirX, y: target.y },      // Side cover
    { x: target.x, y: target.y - dirY },      // Front/back cover
    { x: target.x - dirX, y: target.y - dirY } // Corner cover
  ]
  
  let maxBonus = 0
  
  for (const pos of coverPositions) {
    if (pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE) {
      const cell = grid[pos.y][pos.x]
      if (cell.type === 'crate') {
        maxBonus = Math.max(maxBonus, 1) // Partial cover bonus
      } else if (cell.type === 'wall') {
        maxBonus = Math.max(maxBonus, 2) // Better cover bonus
      }
    }
  }
  
  return maxBonus
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use getCoverInfo instead
 */
export const getCoverPenalty = (from: Position, to: Position, grid: Cell[][]): number => {
  return getCoverInfo(from, to, grid).penalty
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

/**
 * Calculates all positions in a line from attacker to target
 * Used for line attacks (like Mining Drone beam)
 * @param from - Starting position (attacker)
 * @param to - End position (target)
 * @returns Array of positions in the line, excluding the attacker's position
 */
export const getLinePositions = (from: Position, to: Position): Position[] => {
  const positions: Position[] = []
  
  // Bresenham's line algorithm to get all tiles in line
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let err = dx - dy
  
  let x = from.x
  let y = from.y
  
  // Skip the starting position (attacker's position)
  while (!(x === to.x && y === to.y)) {
    const e2 = 2 * err
    
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    
    if (e2 < dx) {
      err += dx
      y += sy
    }
    
    // Add this position to the line (including the target)
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      positions.push({ x, y })
    }
  }
  
  return positions
}