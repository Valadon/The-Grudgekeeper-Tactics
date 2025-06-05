import { Position, Cell, Unit } from '../types'
import { GRID_SIZE } from '../constants'

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}

export const getLineOfSight = (from: Position, to: Position, grid: Cell[][]): boolean => {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let err = dx - dy
  
  let x = from.x
  let y = from.y
  
  while (true) {
    // Check if we've reached the target
    if (x === to.x && y === to.y) return true
    
    // Check if current position blocks LOS (except start and end)
    if ((x !== from.x || y !== from.y) && grid[y][x].type === 'wall') {
      return false
    }
    
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

export const getMovementRange = (
  start: Position,
  speed: number,
  grid: Cell[][],
  units: Unit[]
): Position[] => {
  const validMoves: Position[] = []
  const visited = new Set<string>()
  const queue: { pos: Position; distance: number }[] = [{ pos: start, distance: 0 }]
  
  while (queue.length > 0) {
    const { pos, distance } = queue.shift()!
    const key = `${pos.x},${pos.y}`
    
    if (visited.has(key)) continue
    visited.add(key)
    
    // Don't include starting position
    if (pos.x !== start.x || pos.y !== start.y) {
      validMoves.push(pos)
    }
    
    if (distance >= speed) continue
    
    // Check all adjacent cells
    const directions = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                    { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
    ]
    
    for (const dir of directions) {
      const newX = pos.x + dir.x
      const newY = pos.y + dir.y
      
      // Check bounds
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue
      
      // Check if walkable
      const cell = grid[newY][newX]
      if (cell.type === 'wall') continue
      
      // Check if occupied
      const occupied = units.some(u => u.position.x === newX && u.position.y === newY && u.hp > 0)
      if (occupied) continue
      
      // Calculate movement cost (crates are difficult terrain)
      const cost = cell.type === 'crate' ? 2 : 1
      const newDistance = distance + cost
      
      if (newDistance <= speed) {
        queue.push({ pos: { x: newX, y: newY }, distance: newDistance })
      }
    }
  }
  
  return validMoves
}

export const getAdjacentPositions = (pos: Position): Position[] => {
  const adjacent: Position[] = []
  const directions = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 },                    { x: 1, y: 0 },
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
  ]
  
  for (const dir of directions) {
    const newX = pos.x + dir.x
    const newY = pos.y + dir.y
    
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      adjacent.push({ x: newX, y: newY })
    }
  }
  
  return adjacent
}