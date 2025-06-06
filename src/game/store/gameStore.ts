import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, Unit, Position, ActionType, Cell, CellType, CombatInfo } from '../types'
import { GRID_SIZE, STORAGE_BAY_LAYOUT, ACTIONS_PER_TURN, DWARF_STATS } from '../constants'
import { nanoid } from 'nanoid'
import { calculateDistance, getLineOfSight, getMovementRange, getCoverPenalty, getAdjacentPositions } from '../utils/gridUtils'
import { createUnit } from '../utils/unitUtils'

interface GameStore extends GameState {
  initializeGame: () => void
  selectUnit: (unitId: string) => void
  selectAction: (action: ActionType) => void
  moveUnit: (unitId: string, position: Position) => void
  attackUnit: (attackerId: string, targetId: string) => void
  useAbility: (userId: string, targetId?: string, targetPos?: Position) => void
  endTurn: () => void
  hoverCell: (position: Position | null) => void
  restartGame: () => void
  clearLastCombat: () => void
  processEnemyTurn: () => void
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
    lastCombat: undefined,
    revealedCells: [],
    
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
          
          // If first unit is an enemy, process AI
          if (firstUnit.type === 'enemy') {
            setTimeout(() => get().processEnemyTurn(), 500)
          }
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
        
        if (action === 'move') {
          // Calculate valid movement positions
          state.validMoves = getMovementRange(
            currentUnit.position,
            currentUnit.speed,
            state.grid,
            state.units
          )
        } else if (action === 'strike') {
          // Calculate valid targets
          let enemies: Unit[] = []
          if (currentUnit.type === 'turret') {
            // Turrets target enemies
            enemies = state.units.filter(u => u.type === 'enemy' && u.hp > 0)
          } else {
            // Regular units target opposite type
            enemies = state.units.filter(u => u.type !== currentUnit.type && u.type !== 'turret' && u.hp > 0)
          }
          
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
        } else if (action === 'ability') {
          // Handle ability targeting based on class
          if (currentUnit.class === 'ironclad') {
            // Shield Wall targets adjacent allies
            const allies = state.units.filter(u => 
              u.type === currentUnit.type && 
              u.id !== currentUnit.id && 
              u.hp > 0
            )
            state.validTargets = allies
              .filter(ally => calculateDistance(currentUnit.position, ally.position) === 1)
              .map(ally => ally.id)
          } else if (currentUnit.class === 'delver') {
            // Ore Scanner targets any position within range 4
            state.validMoves = []
            for (let y = 0; y < GRID_SIZE; y++) {
              for (let x = 0; x < GRID_SIZE; x++) {
                const distance = calculateDistance(currentUnit.position, { x, y })
                if (distance <= 4) {
                  state.validMoves.push({ x, y })
                }
              }
            }
          } else if (currentUnit.class === 'brewmaster') {
            // Combat Brew targets adjacent wounded allies
            const allies = state.units.filter(u => 
              u.type === currentUnit.type && 
              u.id !== currentUnit.id && 
              u.hp > 0 &&
              u.hp < u.maxHp // Only wounded allies
            )
            state.validTargets = allies
              .filter(ally => calculateDistance(currentUnit.position, ally.position) === 1)
              .map(ally => ally.id)
          } else if (currentUnit.class === 'engineer') {
            // Deploy Turret targets empty adjacent squares
            state.validMoves = []
            const adjacent = getAdjacentPositions(currentUnit.position)
            for (const pos of adjacent) {
              const cell = state.grid[pos.y][pos.x]
              const occupied = state.units.some(u => 
                u.position.x === pos.x && 
                u.position.y === pos.y && 
                u.hp > 0
              )
              if (cell.type !== 'wall' && !occupied) {
                state.validMoves.push(pos)
              }
            }
          }
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
        
        // Calculate cover penalty
        const coverPenalty = getCoverPenalty(attacker.position, target.position, state.grid)
        
        // Calculate effective AC (including status effects)
        let effectiveAC = target.ac
        const shieldWall = target.statusEffects.find(e => e.type === 'shieldWall')
        if (shieldWall) {
          effectiveAC += shieldWall.value
        }
        
        // Roll to hit
        const roll = Math.floor(Math.random() * 20) + 1
        const total = roll + attacker.attackBonus - coverPenalty
        const hit = total >= effectiveAC
        const critical = roll === 20 || total >= effectiveAC + 10
        
        // Store combat info for display
        const combatInfo = {
          attackerId,
          targetId,
          roll,
          bonus: attacker.attackBonus,
          coverPenalty,
          total,
          targetAC: effectiveAC,
          hit,
          critical,
          damage: 0
        }
        
        if (hit) {
          const damage = critical ? attacker.damage * 2 : attacker.damage
          target.hp = Math.max(0, target.hp - damage)
          combatInfo.damage = damage
        }
        
        // Store last combat for display
        state.lastCombat = combatInfo
        
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
    
    useAbility: (userId: string, targetId?: string, targetPos?: Position) => {
      set((state) => {
        const user = state.units.find(u => u.id === userId)
        if (!user) return
        
        const abilityCost = DWARF_STATS[user.class as DwarfClass]?.abilityCost || 0
        if (user.actionsRemaining < abilityCost) return
        
        // Handle abilities based on class
        if (user.class === 'ironclad' && targetId) {
          // Shield Wall - grant +2 AC to adjacent ally
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          // Add shield wall status effect
          target.statusEffects.push({
            type: 'shieldWall',
            value: 2,
            duration: 1
          })
          
          user.actionsRemaining -= abilityCost
        } else if (user.class === 'delver' && targetPos) {
          // Ore Scanner - reveal 3x3 area
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const x = targetPos.x + dx
              const y = targetPos.y + dy
              
              if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                // Check if already revealed
                const alreadyRevealed = state.revealedCells.some(
                  cell => cell.x === x && cell.y === y
                )
                if (!alreadyRevealed) {
                  state.revealedCells.push({ x, y })
                }
              }
            }
          }
          
          user.actionsRemaining -= abilityCost
        } else if (user.class === 'brewmaster' && targetId) {
          // Combat Brew - heal adjacent ally 2 HP
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          target.hp = Math.min(target.maxHp, target.hp + 2)
          user.actionsRemaining -= abilityCost
        } else if (user.class === 'engineer' && targetPos) {
          // Deploy Turret - create turret unit
          const turret = createUnit('turret', 'engineerTurret', targetPos)
          turret.ownerId = user.id
          state.units.push(turret)
          
          // Add turret to turn order after the engineer
          const engineerIndex = state.turnOrder.indexOf(user.id)
          state.turnOrder.splice(engineerIndex + 1, 0, turret.id)
          
          user.actionsRemaining -= abilityCost
        }
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
    },
    
    endTurn: () => {
      set((state) => {
        const currentIndex = state.turnOrder.indexOf(state.currentUnitId!)
        const nextIndex = (currentIndex + 1) % state.turnOrder.length
        
        // If we've wrapped around, increment round
        if (nextIndex === 0) {
          state.round += 1
          
          // Decrement status effect durations at the end of each round
          state.units.forEach(unit => {
            unit.statusEffects = unit.statusEffects
              .map(effect => ({ ...effect, duration: effect.duration - 1 }))
              .filter(effect => effect.duration > 0)
          })
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
          state.currentUnitId = nextUnit.id
          
          // If it's an enemy turn, process AI after a short delay
          if (nextUnit.type === 'enemy') {
            setTimeout(() => get().processEnemyTurn(), 500)
          }
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
    },
    
    clearLastCombat: () => {
      set((state) => {
        state.lastCombat = undefined
      })
    },
    
    processEnemyTurn: () => {
      const state = get()
      const currentUnit = state.units.find(u => u.id === state.currentUnitId)
      
      if (!currentUnit || currentUnit.type !== 'enemy' || currentUnit.hp <= 0) {
        return
      }
      
      // Simple AI: Move towards nearest dwarf and attack if in range
      const dwarves = state.units.filter(u => u.type === 'dwarf' && u.hp > 0)
      if (dwarves.length === 0) return
      
      // Find nearest dwarf
      let nearestDwarf: Unit | null = null
      let shortestDistance = Infinity
      
      dwarves.forEach(dwarf => {
        const distance = calculateDistance(currentUnit.position, dwarf.position)
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestDwarf = dwarf
        }
      })
      
      if (!nearestDwarf) return
      
      // Process AI actions with delays for visibility
      const processActions = async () => {
        // Check if can attack first
        const attackRange = currentUnit.rangeWeapon || 1
        if (shortestDistance <= attackRange && getLineOfSight(currentUnit.position, nearestDwarf.position, state.grid)) {
          // Attack the nearest dwarf
          get().selectAction('strike')
          await new Promise(resolve => setTimeout(resolve, 500))
          get().attackUnit(currentUnit.id, nearestDwarf.id)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Get fresh state and check if still has actions
        const freshState = get()
        const freshUnit = freshState.units.find(u => u.id === currentUnit.id)
        if (freshUnit && freshUnit.actionsRemaining > 0 && shortestDistance > attackRange) {
          get().selectAction('move')
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get valid moves and find the one closest to target
          const validMoves = getMovementRange(
            freshUnit.position,
            freshUnit.speed,
            freshState.grid,
            freshState.units
          )
          
          let bestMove = freshUnit.position
          let bestDistance = shortestDistance
          
          validMoves.forEach(move => {
            const distance = calculateDistance(move, nearestDwarf.position)
            if (distance < bestDistance) {
              bestDistance = distance
              bestMove = move
            }
          })
          
          if (bestMove !== freshUnit.position) {
            get().moveUnit(currentUnit.id, bestMove)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        // End turn after actions
        get().endTurn()
      }
      
      // Start processing with a small delay
      setTimeout(() => processActions(), 500)
    }
  }))
)