import { Position, Cell, Unit, CoverInfo, CoverType } from '../types'
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
 * @deprecated Use getCover instead
 * Calculates cover type between attacker and target 
 * @returns Cover type and penalty value
 */
export const getCoverInfo = (from: Position, to: Position, grid: Cell[][]): {type: 'none' | 'half' | 'full', penalty: number} => {
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

// =============================================================================
// NEW PATHFINDER 2E COVER & LINE OF SIGHT SYSTEM
// =============================================================================

/**
 * Gets the four corners of a grid position for LoS checking
 * Returns fractional positions slightly inside the square to avoid edge cases
 */
export const getCorners = (position: Position): Position[] => {
  const offset = 0.01  // Slight inset to avoid exact edge cases
  return [
    { x: position.x + offset, y: position.y + offset },           // Top-left
    { x: position.x + 1 - offset, y: position.y + offset },       // Top-right
    { x: position.x + offset, y: position.y + 1 - offset },       // Bottom-left
    { x: position.x + 1 - offset, y: position.y + 1 - offset }    // Bottom-right
  ]
}

/**
 * Traces a line between two fractional positions and returns all grid cells it passes through
 * Uses DDA (Digital Differential Analyzer) for robust corner handling
 */
export const traceLineFractional = (from: Position, to: Position): Position[] => {
  const cells: Set<string> = new Set()
  
  // Use high-resolution sampling to catch corner cases
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.ceil(distance * 8)  // Very high resolution to catch corners
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = from.x + dx * t
    const y = from.y + dy * t
    
    // Convert to grid coordinates - use rounding for better corner detection
    const gridX = Math.round(x - 0.5) // Shift by 0.5 to handle corners better
    const gridY = Math.round(y - 0.5)
    
    // Validate bounds and add to set
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      cells.add(`${gridX},${gridY}`)
    }
    
    // Also check the floor-based cell to catch edge cases
    const floorX = Math.floor(x)
    const floorY = Math.floor(y)
    if (floorX >= 0 && floorX < GRID_SIZE && floorY >= 0 && floorY < GRID_SIZE) {
      cells.add(`${floorX},${floorY}`)
    }
  }
  
  // Convert back to position array
  return Array.from(cells).map(key => {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  })
}

/**
 * Checks if a line between two fractional positions is blocked by walls
 * Returns true if the line is clear (no walls in the way)
 */
export const isLineClear = (from: Position, to: Position, grid: Cell[][]): boolean => {
  const cellsInLine = traceLineFractional(from, to)
  
  for (const cell of cellsInLine) {
    // Skip start and end positions
    const isStart = Math.floor(from.x) === cell.x && Math.floor(from.y) === cell.y
    const isEnd = Math.floor(to.x) === cell.x && Math.floor(to.y) === cell.y
    
    if (!isStart && !isEnd && grid[cell.y][cell.x].type === 'wall') {
      return false
    }
  }
  
  return true
}

/**
 * NEW LINE OF SIGHT: Corner-to-corner checking
 * Returns true if ANY corner of the attacker can see ANY corner of the target
 * Only walls block line of sight
 */
export const hasLineOfSight = (from: Position, to: Position, grid: Cell[][]): boolean => {
  console.log('=== hasLineOfSight called ===')
  console.log('From:', from, 'To:', to)
  
  const fromCorners = getCorners(from)
  const toCorners = getCorners(to)
  
  console.log('From corners:', fromCorners)
  console.log('To corners:', toCorners)
  
  // Check every combination of corners
  for (let i = 0; i < fromCorners.length; i++) {
    for (let j = 0; j < toCorners.length; j++) {
      const fromCorner = fromCorners[i]
      const toCorner = toCorners[j]
      const isLlear = isLineClear(fromCorner, toCorner, grid)
      
      console.log(`Corner ${i}-${j}: (${fromCorner.x.toFixed(2)}, ${fromCorner.y.toFixed(2)}) to (${toCorner.x.toFixed(2)}, ${toCorner.y.toFixed(2)}) = ${isLlear}`)
      
      if (isLlear) {
        console.log('Line of sight found via corner-to-corner')
        return true  // Found at least one clear line
      }
    }
  }
  
  console.log('No line of sight found')
  return false  // No clear lines found
}

/**
 * Gets the center point of a grid position
 */
export const getCenter = (position: Position): Position => {
  return { x: position.x + 0.5, y: position.y + 0.5 }
}

/**
 * ENHANCED COVER SYSTEM: Center-to-center checking with adjacency rules
 * - Terrain cover (crate/door) uses adjacency rules
 * - Creature cover always applies (creatures move)
 * - Take Cover action handled separately
 */
export const getCover = (attacker: Position, target: Position, grid: Cell[][], units: Unit[]): CoverInfo => {
  const fromCenter = getCenter(attacker)
  const toCenter = getCenter(target)
  
  console.log('=== getCover called ===')
  console.log('Attacker:', attacker, 'Target:', target)
  console.log('From center:', fromCenter, 'To center:', toCenter)
  
  const cellsInLine = traceLineFractional(fromCenter, toCenter)
  console.log('Cells in line:', cellsInLine)
  
  let maxCover: CoverInfo = { type: 'none', bonus: 0, source: 'none' }
  
  // Check terrain cover with adjacency rules
  for (const cell of cellsInLine) {
    // Skip start and end positions
    const isStart = cell.x === attacker.x && cell.y === attacker.y
    const isEnd = cell.x === target.x && cell.y === target.y
    
    console.log('Checking cell:', cell, 'isStart:', isStart, 'isEnd:', isEnd)
    
    if (!isStart && !isEnd) {
      const gridCell = grid[cell.y][cell.x]
      console.log('Grid cell at', cell, ':', gridCell.type)
      
      if (gridCell.type === 'crate' || gridCell.type === 'door') {
        // Check adjacency for terrain cover
        const attackerAdjacent = calculateDistance(attacker, cell) === 1
        const targetAdjacent = calculateDistance(target, cell) === 1
        
        // Debug terrain cover detection
        console.log('Terrain cover check:', {
          cell,
          gridCellType: gridCell.type,
          attackerAdjacent,
          targetAdjacent,
          attacker,
          target
        })
        
        // Apply adjacency rules:
        if (attackerAdjacent && !targetAdjacent) {
          // Attacker shooting around cover - target gets no benefit from this cover
          console.log('Cover denied: attacker adjacent, target not adjacent')
          continue
        } else {
          // Cover applies normally:
          // - Attacker NOT adjacent (shooting through cover)
          // - Target also adjacent (both using same cover)
          // - Both adjacent to same cover (mutual protection)
          console.log('Terrain cover applies:', gridCell.type)
          if (maxCover.bonus < 2) {
            maxCover = { type: 'standard', bonus: 2, source: 'terrain' }
          }
        }
      } else if (gridCell.type === 'wall') {
        // Walls provide Greater Cover (+4 AC) when center-to-center line passes through them
        // but don't block attacks if corner-to-corner LoS exists
        console.log('Wall cover detected at:', cell)
        if (maxCover.bonus < 4) {
          maxCover = { type: 'greater', bonus: 4, source: 'terrain' }
        }
      }
    }
  }
  
  // Check creature cover (always applies - creatures move and are unpredictable)
  // Find attacker and target units to exclude them
  const attackerUnit = units.find(u => u.position.x === attacker.x && u.position.y === attacker.y)
  const targetUnit = units.find(u => u.position.x === target.x && u.position.y === target.y)
  
  for (const cell of cellsInLine) {
    // Skip start and end positions
    const isStart = cell.x === attacker.x && cell.y === attacker.y
    const isEnd = cell.x === target.x && cell.y === target.y
    
    if (!isStart && !isEnd) {
      // Check if there's a unit in this cell (excluding attacker and target)
      const unitInCell = units.find(u => 
        u.position.x === cell.x && 
        u.position.y === cell.y && 
        u.hp > 0 &&
        u.id !== attackerUnit?.id &&
        u.id !== targetUnit?.id
      )
      
      if (unitInCell) {
        // Lesser Cover from creature (always applies, no adjacency rules)
        if (maxCover.bonus < 1) {
          maxCover = { type: 'lesser', bonus: 1, source: 'creature' }
        }
      }
    }
  }
  
  return maxCover
}

/**
 * Enhanced cover calculation that includes Take Cover status effects
 * This should be used in combat calculations
 */
export const getCoverWithEffects = (attacker: Position, target: Position, grid: Cell[][], units: Unit[], targetUnit?: Unit): CoverInfo => {
  let baseCover = getCover(attacker, target, grid, units)
  
  // Check if target has Take Cover status effect
  if (targetUnit) {
    const takingCoverEnhanced = targetUnit.statusEffects.find(e => e.type === 'takingCoverEnhanced')
    if (takingCoverEnhanced) {
      // Take Cover upgrades Standard to Greater (+4 total)
      if (baseCover.type === 'standard') {
        return { type: 'greater', bonus: 4, source: 'action' }
      }
      // If only Lesser cover, Take Cover gives Standard
      else if (baseCover.type === 'lesser') {
        return { type: 'standard', bonus: 2, source: 'action' }
      }
      // If no cover, Take Cover gives Standard
      else if (baseCover.type === 'none') {
        return { type: 'standard', bonus: 2, source: 'action' }
      }
    }
  }
  
  return baseCover
}