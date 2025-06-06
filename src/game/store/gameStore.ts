import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, Unit, Position, ActionType, Cell, CellType, CombatInfo, DwarfClass, CombatLogEntry } from '../types'
import { GRID_SIZE, STORAGE_BAY_LAYOUT, ACTIONS_PER_TURN, DWARF_STATS } from '../constants'
import { nanoid } from 'nanoid'
import { calculateDistance, getLineOfSight, getMovementRange, getCoverPenalty, getAdjacentPositions } from '../utils/gridUtils'
import { createUnit, getUnitDisplayName } from '../utils/unitUtils'

/**
 * Main game store interface combining game state with action methods
 * Uses Zustand for state management with Immer for immutable updates
 */
interface GameStore extends GameState {
  // Game lifecycle actions
  initializeGame: () => void
  restartGame: () => void
  
  // Unit and action selection
  selectUnit: (unitId: string) => void
  selectAction: (action: ActionType) => void
  
  // Combat actions
  moveUnit: (unitId: string, position: Position) => void
  attackUnit: (attackerId: string, targetId: string) => void
  useAbility: (userId: string, targetId?: string, targetPos?: Position) => void
  
  // Turn management
  endTurn: () => void
  processEnemyTurn: () => void
  
  // UI interactions
  hoverCell: (position: Position | null) => void
  clearLastCombat: () => void
  
  // Combat log
  addLogEntry: (entry: Omit<CombatLogEntry, 'round'>) => void
}

/**
 * Creates the game grid from the storage bay layout
 * Converts ASCII map characters to cell types
 */
const initializeGrid = (): Cell[][] => {
  const grid: Cell[][] = []
  
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      const char = STORAGE_BAY_LAYOUT[y][x]
      let type: CellType = 'floor'
      
      // Map ASCII characters to cell types
      if (char === '#') type = 'wall'      // Solid walls (block movement and LOS)
      else if (char === 'C') type = 'crate' // Crates (provide cover, difficult terrain)
      else if (char === 'D') type = 'door'  // Doors (currently cosmetic)
      
      row.push({
        type,
        position: { x, y }
      })
    }
    grid.push(row)
  }
  
  return grid
}

/**
 * Creates initial unit setup for the game
 * Places 4 dwarf classes and enemies based on layout
 */
const initializeUnits = (): Unit[] => {
  const units: Unit[] = []
  
  // Create dwarf units at starting positions
  units.push(createUnit('dwarf', 'ironclad', { x: 1, y: 4 }))    // Tank class
  units.push(createUnit('dwarf', 'delver', { x: 2, y: 4 }))      // Scout class
  units.push(createUnit('dwarf', 'brewmaster', { x: 1, y: 5 }))  // Healer class
  units.push(createUnit('dwarf', 'engineer', { x: 2, y: 5 }))    // Support class
  
  // Create enemy units based on layout ASCII characters
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const char = STORAGE_BAY_LAYOUT[y][x]
      if (char === 'G') {
        units.push(createUnit('enemy', 'goblinGrunt', { x, y }))      // Melee enemy
      } else if (char === 'g') {
        units.push(createUnit('enemy', 'goblinScavenger', { x, y }))  // Ranged enemy
      } else if (char === 'W') {
        units.push(createUnit('enemy', 'voidWarg', { x, y }))         // Fast melee enemy
      }
    }
  }
  
  return units
}

/**
 * Main game store using Zustand with Immer middleware
 * Manages all game state and provides actions for game logic
 */
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // Initial state values
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
    combatLog: [],
    
    /**
     * Initializes a new game with grid, units, and turn order
     * Called on game start or restart
     */
    initializeGame: () => {
      set((state) => {
        // Setup game board and place units
        state.grid = initializeGrid()
        state.units = initializeUnits()
        
        // Roll initiative for turn order (d20 + speed bonus)
        const turnOrder = state.units
          .map(unit => ({
            id: unit.id,
            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor(unit.speed / 5)
          }))
          .sort((a, b) => b.initiative - a.initiative)
          .map(item => item.id)
        
        // Initialize game state
        state.turnOrder = turnOrder
        state.currentUnitId = turnOrder[0]
        state.round = 1
        state.phase = 'combat'
        state.combatLog = []
        
        // Activate first unit in turn order
        const firstUnit = state.units.find(u => u.id === turnOrder[0])
        if (firstUnit) {
          firstUnit.isActive = true
          firstUnit.actionsRemaining = ACTIONS_PER_TURN
          
          // Add initial log entry
          get().addLogEntry({
            type: 'system',
            message: `Battle begins! ${getUnitDisplayName(firstUnit)}'s turn`,
            details: `Actions: ${firstUnit.actionsRemaining}`
          })
          
          // If first unit is an enemy, process AI
          if (firstUnit.type === 'enemy') {
            setTimeout(() => get().processEnemyTurn(), 500)
          }
        }
      })
    },
    
    /**
     * Sets the currently selected unit
     */
    selectUnit: (unitId: string) => {
      set((state) => {
        state.currentUnitId = unitId
      })
    },
    
    /**
     * Handles action selection and calculates valid targets/moves
     * Updates validMoves or validTargets based on action type
     */
    selectAction: (action: ActionType) => {
      set((state) => {
        state.selectedAction = action
        state.validMoves = []
        state.validTargets = []
        
        const currentUnit = state.units.find(u => u.id === state.currentUnitId)
        if (!currentUnit || currentUnit.actionsRemaining <= 0) return
        
        if (action === 'move') {
          // Calculate valid movement positions based on speed and terrain
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
    
    /**
     * Moves a unit to a new position
     * Consumes 1 action point, 2 for difficult terrain (crates)
     */
    moveUnit: (unitId: string, position: Position) => {
      set((state) => {
        const unit = state.units.find(u => u.id === unitId)
        if (!unit || unit.actionsRemaining <= 0) return
        
        // Validate move is in allowed positions
        const isValidMove = state.validMoves.some(
          move => move.x === position.x && move.y === position.y
        )
        if (!isValidMove) return
        
        // Execute move and consume action
        unit.position = position
        unit.actionsRemaining -= 1
        
        // Clear UI state
        state.selectedAction = null
        state.validMoves = []
        
        // Log the move
        get().addLogEntry({
          type: 'move',
          message: `${getUnitDisplayName(unit)} moved to (${position.x}, ${position.y})`
        })
      })
    },
    
    /**
     * Handles combat between units
     * Rolls d20 + attack bonus vs target AC (modified by cover and status effects)
     * Critical hits on natural 20 or beating AC by 10+
     */
    attackUnit: (attackerId: string, targetId: string) => {
      set((state) => {
        const attacker = state.units.find(u => u.id === attackerId)
        const target = state.units.find(u => u.id === targetId)
        
        if (!attacker || !target || attacker.actionsRemaining <= 0) return
        
        // Check for cover between attacker and target (-2 AC for crates, -4 for walls)
        const coverPenalty = getCoverPenalty(attacker.position, target.position, state.grid)
        
        // Apply status effects to AC (e.g., Shield Wall buff)
        let effectiveAC = target.ac
        const shieldWall = target.statusEffects.find(e => e.type === 'shieldWall')
        if (shieldWall) {
          effectiveAC += shieldWall.value
        }
        
        // Combat resolution: d20 + bonus - penalty vs AC
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
        
        // Log the attack
        const attackerName = getUnitDisplayName(attacker)
        const targetName = getUnitDisplayName(target)
        let attackDetails = `d20(${roll}) + ${attacker.attackBonus}`
        if (coverPenalty > 0) {
          attackDetails += ` - ${coverPenalty} (cover)`
        }
        attackDetails += ` = ${total} vs AC ${effectiveAC}`
        
        get().addLogEntry({
          type: 'attack',
          message: `${attackerName} attacks ${targetName}`,
          details: attackDetails
        })
        
        if (hit) {
          const damageMsg = critical ? `CRITICAL HIT! ${combatInfo.damage} damage` : `Hit for ${combatInfo.damage} damage`
          get().addLogEntry({
            type: 'damage',
            message: damageMsg,
            details: target.hp > 0 ? `${targetName} now at ${target.hp}/${target.maxHp} HP` : `${targetName} defeated!`
          })
        } else {
          get().addLogEntry({
            type: 'attack',
            message: 'Miss!',
            details: roll === 1 ? 'Natural 1!' : undefined
          })
        }
        
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
    
    /**
     * Executes special abilities for each dwarf class
     * Each ability has unique targeting and effects
     */
    useAbility: (userId: string, targetId?: string, targetPos?: Position) => {
      set((state) => {
        const user = state.units.find(u => u.id === userId)
        if (!user) return
        
        // Get ability cost based on class
        const abilityCost = user.type === 'dwarf' ? DWARF_STATS[user.class as DwarfClass]?.abilityCost || 0 : 0
        if (user.actionsRemaining < abilityCost) return
        
        // Execute ability based on class type
        if (user.class === 'ironclad' && targetId) {
          // SHIELD WALL: Grants +2 AC to adjacent ally for 1 round
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          // Apply defensive buff
          target.statusEffects.push({
            type: 'shieldWall',
            value: 2,
            duration: 1
          })
          
          user.actionsRemaining -= abilityCost
          
          get().addLogEntry({
            type: 'ability',
            message: `${getUnitDisplayName(user)} used Shield Wall on ${getUnitDisplayName(target)}`,
            details: `+2 AC for 1 round`
          })
          
        } else if (user.class === 'delver' && targetPos) {
          // ORE SCANNER: Reveals 3x3 area through walls (range 4)
          // Useful for scouting enemies and planning tactics
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const x = targetPos.x + dx
              const y = targetPos.y + dy
              
              if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                // Add to revealed cells if not already visible
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
          
          get().addLogEntry({
            type: 'ability',
            message: `${getUnitDisplayName(user)} used Ore Scanner`,
            details: `Revealed 3x3 area at (${targetPos.x}, ${targetPos.y})`
          })
          
        } else if (user.class === 'brewmaster' && targetId) {
          // COMBAT BREW: Heals adjacent ally for 2 HP
          // Cannot overheal beyond max HP
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          const healAmount = Math.min(2, target.maxHp - target.hp)
          target.hp = Math.min(target.maxHp, target.hp + 2)
          user.actionsRemaining -= abilityCost
          
          get().addLogEntry({
            type: 'heal',
            message: `${getUnitDisplayName(user)} healed ${getUnitDisplayName(target)} for ${healAmount} HP`,
            details: `${getUnitDisplayName(target)} now at ${target.hp}/${target.maxHp} HP`
          })
          
        } else if (user.class === 'engineer' && targetPos) {
          // DEPLOY TURRET: Creates autonomous turret unit
          // Turret has 3 HP, 10 AC, +2 attack, 1 damage, range 4
          const turret = createUnit('turret', 'engineerTurret', targetPos)
          turret.ownerId = user.id
          state.units.push(turret)
          
          // Insert turret into turn order after engineer
          const engineerIndex = state.turnOrder.indexOf(user.id)
          state.turnOrder.splice(engineerIndex + 1, 0, turret.id)
          
          user.actionsRemaining -= abilityCost
          
          get().addLogEntry({
            type: 'ability',
            message: `${getUnitDisplayName(user)} deployed a turret`,
            details: `Turret placed at (${targetPos.x}, ${targetPos.y})`
          })
        }
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
    },
    
    /**
     * Advances to the next unit's turn
     * Handles round progression, status effect duration, and AI activation
     */
    endTurn: () => {
      set((state) => {
        const currentIndex = state.turnOrder.indexOf(state.currentUnitId!)
        const nextIndex = (currentIndex + 1) % state.turnOrder.length
        
        // Check if we've completed a full round
        if (nextIndex === 0) {
          state.round += 1
          
          // Update status effects at round end
          state.units.forEach(unit => {
            unit.statusEffects = unit.statusEffects
              .map(effect => ({ ...effect, duration: effect.duration - 1 }))
              .filter(effect => effect.duration > 0)  // Remove expired effects
          })
        }
        
        // Deactivate current unit
        const currentUnit = state.units.find(u => u.id === state.currentUnitId)
        if (currentUnit) {
          currentUnit.isActive = false
        }
        
        // Find next living unit (skip dead units)
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
        
        // Activate next unit and refresh their actions
        if (nextUnit && nextUnit.hp > 0) {
          nextUnit.isActive = true
          nextUnit.actionsRemaining = ACTIONS_PER_TURN
          state.currentUnitId = nextUnit.id
          
          get().addLogEntry({
            type: 'system',
            message: `${getUnitDisplayName(nextUnit)}'s turn begins`,
            details: `Actions: ${nextUnit.actionsRemaining}`
          })
          
          // Trigger AI for enemy units
          if (nextUnit.type === 'enemy') {
            setTimeout(() => get().processEnemyTurn(), 500)
          }
        }
        
        // Reset UI state for new turn
        state.selectedAction = null
        state.validMoves = []
        state.validTargets = []
      })
    },
    
    /**
     * Updates the hovered cell for UI feedback
     */
    hoverCell: (position: Position | null) => {
      set((state) => {
        state.hoveredCell = position
      })
    },
    
    /**
     * Resets the game to initial state
     */
    restartGame: () => {
      get().initializeGame()
    },
    
    /**
     * Clears the last combat info (used after dice roll display)
     */
    clearLastCombat: () => {
      set((state) => {
        state.lastCombat = undefined
      })
    },
    
    /**
     * Handles enemy AI behavior
     * Simple AI: Find nearest dwarf, move closer, attack if in range
     * Processes actions with delays for visual clarity
     */
    processEnemyTurn: () => {
      const state = get()
      const currentUnit = state.units.find(u => u.id === state.currentUnitId)
      
      if (!currentUnit || currentUnit.type !== 'enemy' || currentUnit.hp <= 0) {
        return
      }
      
      // Get all living dwarf units as potential targets
      const dwarves = state.units.filter(u => u.type === 'dwarf' && u.hp > 0)
      if (dwarves.length === 0) return
      
      // Find closest target using Chebyshev distance
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
      
      // Execute AI actions asynchronously with visual delays
      const processActions = async () => {
        // Priority 1: Attack if target is in range with line of sight
        const attackRange = currentUnit.rangeWeapon || 1
        if (nearestDwarf && shortestDistance <= attackRange && getLineOfSight(currentUnit.position, nearestDwarf.position, state.grid)) {
          // Attack the nearest dwarf
          get().selectAction('strike')
          await new Promise(resolve => setTimeout(resolve, 500))
          get().attackUnit(currentUnit.id, nearestDwarf.id)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Get fresh state and check if still has actions
        const freshState = get()
        const freshUnit = freshState.units.find(u => u.id === currentUnit.id)
        if (freshUnit && freshUnit.actionsRemaining > 0 && nearestDwarf && shortestDistance > attackRange) {
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
            if (nearestDwarf) {
              const distance = calculateDistance(move, nearestDwarf.position)
              if (distance < bestDistance) {
                bestDistance = distance
                bestMove = move
              }
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
    },
    
    /**
     * Adds an entry to the combat log with the current round number
     */
    addLogEntry: (entry: Omit<CombatLogEntry, 'round'>) => {
      set((state) => {
        state.combatLog = [...state.combatLog, {
          ...entry,
          round: state.round
        }]
      })
    }
  }))
)