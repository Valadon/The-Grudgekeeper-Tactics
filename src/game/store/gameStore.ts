import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, Unit, Position, ActionType, Cell, CellType } from '../types'
import { GRID_SIZE, STORAGE_BAY_LAYOUT, ACTIONS_PER_TURN } from '../constants'
import { nanoid } from 'nanoid'
import { calculateDistance, getLineOfSight, getMovementRange } from '../utils/gridUtils'
import { createUnit } from '../utils/unitUtils'

interface GameStore extends GameState {
  initializeGame: () => void
  selectUnit: (unitId: string) => void
  selectAction: (action: ActionType) => void
  moveUnit: (unitId: string, position: Position) => void
  attackUnit: (attackerId: string, targetId: string) => void
  endTurn: () => void
  hoverCell: (position: Position | null) => void
  restartGame: () => void
}

const initializeGrid = (): Cell[][] => {
  const grid: Cell[][] = []
  
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      const char = STORAGE_BAY_LAYOUT[y][x]
      let type: CellType = 'floor'
      
      if (char === '#') type = 'wall'
      else if (char === 'C') type = 'crate'
      else if (char === 'D') type = 'door'
      
      row.push({
        type,
        position: { x, y }
      })
    }
    grid.push(row)
  }
  
  return grid
}

const initializeUnits = (): Unit[] => {
  const units: Unit[] = []
  
  // Create dwarf units
  units.push(createUnit('dwarf', 'ironclad', { x: 1, y: 4 }))
  units.push(createUnit('dwarf', 'delver', { x: 2, y: 4 }))
  units.push(createUnit('dwarf', 'brewmaster', { x: 1, y: 5 }))
  units.push(createUnit('dwarf', 'engineer', { x: 2, y: 5 }))
  
  // Create enemy units based on layout
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const char = STORAGE_BAY_LAYOUT[y][x]
      if (char === 'G') {
        units.push(createUnit('enemy', 'goblinGrunt', { x, y }))
      } else if (char === 'g') {
        units.push(createUnit('enemy', 'goblinScavenger', { x, y }))
      } else if (char === 'W') {
        units.push(createUnit('enemy', 'voidWarg', { x, y }))
      }
    }
  }
  
  return units
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    units: [],
    grid: [],
    currentUnitId: null,
    turnOrder: [],
    round: 1,
    phase: 'combat',
    selectedAction: null,
    hoveredCell: null,
    validMoves: [],
    validTargets: [],
    
    initializeGame: () => {
      set((state) => {
        state.grid = initializeGrid()
        state.units = initializeUnits()
        
        // Calculate turn order based on initiative (d20 + speed/5)
        const turnOrder = state.units
          .map(unit => ({
            id: unit.id,
            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor(unit.speed / 5)
          }))
          .sort((a, b) => b.initiative - a.initiative)
          .map(item => item.id)
        
        state.turnOrder = turnOrder
        state.currentUnitId = turnOrder[0]
        state.round = 1
        state.phase = 'combat'
        
        // Set first unit as active
        const firstUnit = state.units.find(u => u.id === turnOrder[0])
        if (firstUnit) {
          firstUnit.isActive = true
          firstUnit.actionsRemaining = ACTIONS_PER_TURN
        }
      })
    },
    
    selectUnit: (unitId: string) => {
      set((state) => {
        state.currentUnitId = unitId
      })
    },
    
    selectAction: (action: ActionType) => {
      set((state) => {
        state.selectedAction = action
        state.validMoves = []
        state.validTargets = []
        
        const currentUnit = state.units.find(u => u.id === state.currentUnitId)
        if (!currentUnit || currentUnit.actionsRemaining <= 0) return
        
        if (action === 'move' && !currentUnit.hasMoved) {
          // Calculate valid movement positions
          state.validMoves = getMovementRange(
            currentUnit.position,
            currentUnit.speed,
            state.grid,
            state.units
          )
        } else if (action === 'strike') {
          // Calculate valid targets
          const enemies = state.units.filter(u => u.type !== currentUnit.type && u.hp > 0)
          state.validTargets = enemies
            .filter(enemy => {
              const distance = calculateDistance(currentUnit.position, enemy.position)
              const maxRange = currentUnit.rangeWeapon || 1
              return distance <= maxRange && getLineOfSight(
                currentUnit.position,
                enemy.position,
                state.grid
              )
            })
            .map(enemy => enemy.id)
        }
      })
    },
    
    moveUnit: (unitId: string, position: Position) => {
      set((state) => {
        const unit = state.units.find(u => u.id === unitId)
        if (!unit || unit.actionsRemaining <= 0) return
        
        // Check if move is valid
        const isValidMove = state.validMoves.some(
          move => move.x === position.x && move.y === position.y
        )
        if (!isValidMove) return
        
        // Move unit
        unit.position = position
        unit.hasMoved = true
        unit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validMoves = []
      })
    },
    
    attackUnit: (attackerId: string, targetId: string) => {
      set((state) => {
        const attacker = state.units.find(u => u.id === attackerId)
        const target = state.units.find(u => u.id === targetId)
        
        if (!attacker || !target || attacker.actionsRemaining <= 0) return
        
        // Roll to hit
        const roll = Math.floor(Math.random() * 20) + 1
        const total = roll + attacker.attackBonus
        const hit = total >= target.ac
        const critical = roll === 20 || total >= target.ac + 10
        
        if (hit) {
          const damage = critical ? attacker.damage * 2 : attacker.damage
          target.hp = Math.max(0, target.hp - damage)
        }
        
        attacker.hasAttacked = true
        attacker.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
        
        // Check for victory/defeat
        const dwarves = state.units.filter(u => u.type === 'dwarf')
        const enemies = state.units.filter(u => u.type === 'enemy')
        
        if (enemies.every(e => e.hp <= 0)) {
          state.phase = 'victory'
        } else if (dwarves.every(d => d.hp <= 0)) {
          state.phase = 'defeat'
        }
      })
    },
    
    endTurn: () => {
      set((state) => {
        const currentIndex = state.turnOrder.indexOf(state.currentUnitId!)
        const nextIndex = (currentIndex + 1) % state.turnOrder.length
        
        // If we've wrapped around, increment round
        if (nextIndex === 0) {
          state.round += 1
        }
        
        // Deactivate current unit
        const currentUnit = state.units.find(u => u.id === state.currentUnitId)
        if (currentUnit) {
          currentUnit.isActive = false
        }
        
        // Find next alive unit
        let attempts = 0
        let nextUnitId = state.turnOrder[nextIndex]
        let nextUnit = state.units.find(u => u.id === nextUnitId)
        
        while (nextUnit && nextUnit.hp <= 0 && attempts < state.turnOrder.length) {
          const index = state.turnOrder.indexOf(nextUnitId)
          const next = (index + 1) % state.turnOrder.length
          nextUnitId = state.turnOrder[next]
          nextUnit = state.units.find(u => u.id === nextUnitId)
          attempts++
        }
        
        // Activate next unit
        if (nextUnit && nextUnit.hp > 0) {
          nextUnit.isActive = true
          nextUnit.actionsRemaining = ACTIONS_PER_TURN
          nextUnit.hasMoved = false
          nextUnit.hasAttacked = false
          state.currentUnitId = nextUnit.id
        }
        
        // Clear selections
        state.selectedAction = null
        state.validMoves = []
        state.validTargets = []
      })
    },
    
    hoverCell: (position: Position | null) => {
      set((state) => {
        state.hoveredCell = position
      })
    },
    
    restartGame: () => {
      get().initializeGame()
    }
  }))
)