import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, Unit, Position, ActionType, Cell, CellType, CombatInfo, DwarfClass, CombatLogEntry } from '../types'
import { GRID_SIZE, STORAGE_BAY_LAYOUT, ACTIONS_PER_TURN, DWARF_STATS, ENEMY_STATS } from '../constants'
import { nanoid } from 'nanoid'
import { calculateDistance, getLineOfSight, getMovementRange, getCoverPenalty, getAdjacentPositions } from '../utils/gridUtils'
import { createUnit, getUnitDisplayName } from '../utils/unitUtils'
import { rollD20, rollDamage, formatDiceRoll, isCriticalHit } from '../utils/diceUtils'

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
  aimAction: (unitId: string) => void
  defendAction: (unitId: string) => void
  
  // New tactical actions
  dropProneAction: (unitId: string) => void
  raiseShieldAction: (unitId: string) => void
  takeCoverAction: (unitId: string) => void
  braceAction: (unitId: string) => void
  reloadAction: (unitId: string) => void
  stepUnit: (unitId: string, position: Position) => void
  
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
  units.push(createUnit('dwarf', 'voidguard', { x: 1, y: 4 }))    // Tank class
  units.push(createUnit('dwarf', 'asteroidMiner', { x: 2, y: 4 }))      // Scout class
  units.push(createUnit('dwarf', 'brewmasterEngineer', { x: 1, y: 5 }))  // Support class
  units.push(createUnit('dwarf', 'starRanger', { x: 2, y: 5 }))    // Ranged DPS class
  
  // Create enemy units based on layout ASCII characters
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const char = STORAGE_BAY_LAYOUT[y][x]
      if (char === 'G') {
        units.push(createUnit('enemy', 'goblinScavenger', { x, y }))      // Ranged enemy
      } else if (char === 'g') {
        units.push(createUnit('enemy', 'goblinScavenger', { x, y }))  // Ranged enemy
      } else if (char === 'W') {
        units.push(createUnit('enemy', 'voidHound', { x, y }))         // Fast melee enemy
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
        }
      })
      
      // After state is set, add log entry and process AI if needed
      const firstUnit = get().units.find(u => u.id === get().turnOrder[0])
      if (firstUnit) {
        // Add initial log entry
        get().addLogEntry({
          type: 'system',
          message: `Battle begins!`
        })
        
        // If first unit is an enemy, process AI
        if (firstUnit.type === 'enemy') {
          setTimeout(() => get().processEnemyTurn(), 500)
        }
      }
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
          if (currentUnit.class === 'voidguard') {
            // Shield Wall targets adjacent allies
            const allies = state.units.filter(u => 
              u.type === currentUnit.type && 
              u.id !== currentUnit.id && 
              u.hp > 0
            )
            state.validTargets = allies
              .filter(ally => calculateDistance(currentUnit.position, ally.position) === 1)
              .map(ally => ally.id)
          } else if (currentUnit.class === 'asteroidMiner') {
            // Ore Sense targets any position within range 4
            state.validMoves = []
            for (let y = 0; y < GRID_SIZE; y++) {
              for (let x = 0; x < GRID_SIZE; x++) {
                const distance = calculateDistance(currentUnit.position, { x, y })
                if (distance <= 4) {
                  state.validMoves.push({ x, y })
                }
              }
            }
          } else if (currentUnit.class === 'brewmasterEngineer') {
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
          } else if (currentUnit.class === 'starRanger') {
            // Overwatch targets cone area (for now, just target enemies in range)
            let enemies: Unit[] = []
            enemies = state.units.filter(u => u.type === 'enemy' && u.hp > 0)
            
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
        } else if (action === 'aim' || action === 'defend') {
          // Aim and Defend target the unit itself
          state.validTargets = [currentUnit.id]
        } else if (action === 'dropProne' || action === 'raiseShield' || action === 'takeCover' || action === 'brace' || action === 'reload') {
          // Self-targeted actions
          state.validTargets = [currentUnit.id]
        } else if (action === 'step') {
          // Step allows 1-tile movement (adjacent cells only)
          const adjacent = getAdjacentPositions(currentUnit.position)
          state.validMoves = adjacent.filter(pos => {
            const cell = state.grid[pos.y][pos.x]
            const occupied = state.units.some(u => 
              u.position.x === pos.x && 
              u.position.y === pos.y && 
              u.hp > 0
            )
            return cell.type !== 'wall' && !occupied
          })
        } else if (action === 'stride') {
          // Stride is full movement (same as regular move)
          state.validMoves = getMovementRange(
            currentUnit.position,
            currentUnit.speed,
            state.grid,
            state.units
          )
        }
      })
    },
    
    /**
     * Moves a unit to a new position
     * Consumes 1 action point, 2 for difficult terrain (crates)
     */
    moveUnit: (unitId: string, position: Position) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      // Validate move is in allowed positions
      const isValidMove = get().validMoves.some(
        move => move.x === position.x && move.y === position.y
      )
      if (!isValidMove) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Animation removed for now
        
        // Execute move and consume action
        stateUnit.position = position
        stateUnit.actionsRemaining -= 1
        
        // Clear UI state
        state.selectedAction = null
        state.validMoves = []
      })
      
      // Log the move after state update
      get().addLogEntry({
        type: 'move',
        message: `${getUnitDisplayName(unit)} moved to (${position.x}, ${position.y})`
      })
    },
    
    /**
     * Handles combat between units
     * Rolls d20 + attack bonus vs target AC (modified by cover and status effects)
     * Critical hits on natural 20 or beating AC by 10+
     */
    attackUnit: (attackerId: string, targetId: string) => {
      // Get data before state update
      const attacker = get().units.find(u => u.id === attackerId)
      const target = get().units.find(u => u.id === targetId)
      
      if (!attacker || !target || attacker.actionsRemaining <= 0) return
      
      // Check ammo for ranged attacks
      if (attacker.rangeWeapon && attacker.currentAmmo !== undefined && attacker.currentAmmo <= 0) {
        return // No ammo available
      }
      
      // Check for cover between attacker and target (-2 AC for crates, -4 for walls)
      const coverPenalty = getCoverPenalty(attacker.position, target.position, get().grid)
      
      // Apply status effects to AC (e.g., Shield Wall, Defending)
      let effectiveAC = target.ac
      const shieldWall = target.statusEffects.find(e => e.type === 'shieldWall')
      if (shieldWall) {
        effectiveAC += shieldWall.value
      }
      const defending = target.statusEffects.find(e => e.type === 'defending')
      if (defending) {
        effectiveAC += defending.value
      }
      
      // Apply status effects to attack bonus (e.g., Aimed)
      let attackBonus = attacker.attackBonus
      const aimed = attacker.statusEffects.find(e => e.type === 'aimed')
      if (aimed) {
        attackBonus += aimed.value
      }
      
      // Combat resolution: d20 + bonus - penalty vs AC
      const roll = rollD20()
      const total = roll + attackBonus - coverPenalty
      const hit = total >= effectiveAC
      const critical = isCriticalHit(roll, total, effectiveAC)
      
      // Roll damage if hit
      let damageResult = { rolls: [0], bonus: 0, total: 0 }
      let damageDisplay = ''
      
      if (hit) {
        damageResult = rollDamage(attacker.damage)
        // Double damage on critical hits
        if (critical) {
          damageResult.total *= 2
        }
        damageDisplay = formatDiceRoll(damageResult.rolls, damageResult.bonus, attacker.damage)
        if (critical) {
          damageDisplay += ` (CRIT: doubled to ${damageResult.total})`
        }
      }
      
      // Store combat info for display
      const combatInfo: CombatInfo = {
        attackerId,
        targetId,
        roll,
        bonus: attackBonus,
        coverPenalty,
        total,
        targetAC: effectiveAC,
        hit,
        critical,
        damage: damageResult.total
      }
      
      // Prepare log data before state update
      const attackerName = getUnitDisplayName(attacker)
      const targetName = getUnitDisplayName(target)
      let attackDetails = `d20(${roll}) + ${attacker.attackBonus}`
      
      // Show aimed bonus separately if present
      if (aimed) {
        attackDetails += ` + ${aimed.value} (aimed)`
      }
      
      if (coverPenalty > 0) {
        attackDetails += ` - ${coverPenalty} (cover)`
      }
      attackDetails += ` = ${total} vs AC ${effectiveAC}`
      
      // Update state
      set((state) => {
        const stateAttacker = state.units.find(u => u.id === attackerId)
        const stateTarget = state.units.find(u => u.id === targetId)
        
        if (!stateAttacker || !stateTarget) return
        
        // Set up attack animation (bump toward target)
        const dx = stateTarget.position.x - stateAttacker.position.x
        const dy = stateTarget.position.y - stateAttacker.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Normalize direction and scale for bump
        const bumpDistance = 0.3 // Bump 30% of a cell
        const bumpX = (dx / distance) * bumpDistance
        const bumpY = (dy / distance) * bumpDistance
        
        stateAttacker.animationPosition = { ...stateAttacker.position }
        stateAttacker.animationTarget = {
          x: stateAttacker.position.x + bumpX,
          y: stateAttacker.position.y + bumpY
        }
        stateAttacker.animationProgress = 0
        
        if (hit) {
          stateTarget.hp = Math.max(0, stateTarget.hp - combatInfo.damage)
        }
        
        // Store last combat for display
        state.lastCombat = combatInfo
        
        stateAttacker.actionsRemaining -= 1
        
        // Consume ammo for ranged attacks
        if (stateAttacker.rangeWeapon && stateAttacker.currentAmmo !== undefined) {
          stateAttacker.currentAmmo = Math.max(0, stateAttacker.currentAmmo - 1)
        }
        
        // Remove aimed status effect after use
        stateAttacker.statusEffects = stateAttacker.statusEffects.filter(e => e.type !== 'aimed')
        
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
      
      // Log the attack result after state update
      if (hit) {
        const targetAfter = get().units.find(u => u.id === targetId)
        const damageMsg = critical ? `${attackerName} CRITS ${targetName} for ${combatInfo.damage} damage!` : `${attackerName} hits ${targetName} for ${combatInfo.damage} damage`
        get().addLogEntry({
          type: 'damage',
          message: damageMsg,
          details: `${attackDetails} | Damage: ${damageDisplay}${targetAfter && targetAfter.hp <= 0 ? ' - DEFEATED!' : ''}`
        })
        
        // Handle splash damage for special weapons
        const attackerStats = attacker.type === 'dwarf' 
          ? DWARF_STATS[attacker.class as keyof typeof DWARF_STATS]
          : attacker.type === 'enemy'
          ? ENEMY_STATS[attacker.class as keyof typeof ENEMY_STATS]
          : null
          
        if (attackerStats?.special?.includes('splash')) {
          // Apply splash damage to all adjacent squares (including friendlies)
          const adjacentPositions = getAdjacentPositions(target.position)
          const currentUnits = get().units // Get current state after damage
          
          adjacentPositions.forEach(pos => {
            const adjacentUnit = currentUnits.find(u => 
              u.position.x === pos.x && u.position.y === pos.y && u.hp > 0 && u.id !== targetId
            )
            if (adjacentUnit) {
              const splashDamage = 1 // Fixed 1 damage for splash
              
              // Apply splash damage
              set((state) => {
                const stateUnit = state.units.find(u => u.id === adjacentUnit.id)
                if (stateUnit) {
                  stateUnit.hp = Math.max(0, stateUnit.hp - splashDamage)
                }
              })
              
              // Log splash damage
              const adjacentName = getUnitDisplayName(adjacentUnit)
              const unitAfterSplash = get().units.find(u => u.id === adjacentUnit.id)
              get().addLogEntry({
                type: 'damage',
                message: `${adjacentName} takes ${splashDamage} splash damage`,
                details: `Chemical splash from ${attackerName}'s attack${unitAfterSplash && unitAfterSplash.hp <= 0 ? ' - DEFEATED!' : ''}`
              })
            }
          })
        }
      } else {
        const missMsg = roll === 1 ? `${attackerName} misses ${targetName} (Natural 1!)` : `${attackerName} misses ${targetName}`
        get().addLogEntry({
          type: 'miss',
          message: missMsg,
          details: attackDetails
        })
      }
    },
    
    /**
     * Executes special abilities for each dwarf class
     * Each ability has unique targeting and effects
     */
    useAbility: (userId: string, targetId?: string, targetPos?: Position) => {
      // Get data before state update
      const user = get().units.find(u => u.id === userId)
      if (!user) return
      
      // Get ability cost based on class
      const abilityCost = user.type === 'dwarf' ? DWARF_STATS[user.class as DwarfClass]?.abilityCost || 0 : 0
      if (user.actionsRemaining < abilityCost) return
      
      // Track ability usage for logging
      let abilityUsed = false
      let logEntry: Omit<CombatLogEntry, 'round'> | null = null
      
      // Update state
      set((state) => {
        const stateUser = state.units.find(u => u.id === userId)
        if (!stateUser) return
        
        // Execute ability based on class type
        if (stateUser.class === 'voidguard' && targetId) {
          // SHIELD WALL: Grants +1 AC to adjacent ally while shield raised
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          // Apply defensive buff
          target.statusEffects.push({
            type: 'shieldWall',
            value: 1,
            duration: 1
          })
          
          stateUser.actionsRemaining -= abilityCost
          abilityUsed = true
          
          logEntry = {
            type: 'ability',
            message: `${getUnitDisplayName(stateUser)} used Shield Wall on ${getUnitDisplayName(target)}`,
            details: `+1 AC for 1 round`
          }
          
        } else if (stateUser.class === 'asteroidMiner' && targetPos) {
          // ORE SENSE: Reveals 3x3 area through walls (range 4)
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
          
          stateUser.actionsRemaining -= abilityCost
          abilityUsed = true
          
          logEntry = {
            type: 'ability',
            message: `${getUnitDisplayName(stateUser)} used Ore Sense`,
            details: `Revealed 3x3 area at (${targetPos.x}, ${targetPos.y})`
          }
          
        } else if (stateUser.class === 'brewmasterEngineer' && targetId) {
          // COMBAT BREW: Heals adjacent ally with 1d6 HP
          // Cannot overheal beyond max HP
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          // Roll 1d6 for healing
          const healResult = rollDamage('1d6')
          const actualHealAmount = Math.min(healResult.total, target.maxHp - target.hp)
          target.hp = Math.min(target.maxHp, target.hp + healResult.total)
          stateUser.actionsRemaining -= abilityCost
          abilityUsed = true
          
          const healDisplay = formatDiceRoll(healResult.rolls, healResult.bonus, '1d6')
          
          logEntry = {
            type: 'heal',
            message: `${getUnitDisplayName(stateUser)} healed ${getUnitDisplayName(target)} for ${actualHealAmount} HP`,
            details: `Healing: ${healDisplay} | ${getUnitDisplayName(target)} now at ${target.hp}/${target.maxHp} HP`
          }
          
        } else if (stateUser.class === 'starRanger' && targetId) {
          // OVERWATCH: Set up reaction shot (placeholder implementation)
          const target = state.units.find(u => u.id === targetId)
          if (!target) return
          
          // For now, just give a temporary attack bonus like aim
          stateUser.statusEffects.push({
            type: 'aimed',
            value: 2,
            duration: 1
          })
          
          stateUser.actionsRemaining -= abilityCost
          abilityUsed = true
          
          logEntry = {
            type: 'ability',
            message: `${getUnitDisplayName(stateUser)} sets up overwatch`,
            details: `+2 to next attack (placeholder for full overwatch system)`
          }
        }
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log ability usage after state update
      if (abilityUsed && logEntry) {
        get().addLogEntry(logEntry)
      }
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
        }
        
        // Reset UI state for new turn
        state.selectedAction = null
        state.validMoves = []
        state.validTargets = []
      })
      
      // Get the next unit info after state update and trigger AI if needed
      const nextUnit = get().units.find(u => u.id === get().currentUnitId)
      if (nextUnit && nextUnit.type === 'enemy') {
        setTimeout(() => get().processEnemyTurn(), 500)
      }
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
      const currentRound = get().round;
      set((state) => {
        state.combatLog = [...state.combatLog, {
          ...entry,
          round: currentRound
        }]
      })
    },
    
    /**
     * Aim action - gives +2 to next attack roll
     */
    aimAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply aimed status effect
        stateUnit.statusEffects.push({
          type: 'aimed',
          value: 2,
          duration: 1 // Lasts until next turn
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} takes aim`,
        details: '+2 to next attack'
      })
    },
    
    /**
     * Defend action - gives +2 AC until next turn
     */
    defendAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply defending status effect
        stateUnit.statusEffects.push({
          type: 'defending',
          value: 2,
          duration: 1 // Lasts until next turn
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} takes a defensive stance`,
        details: '+2 AC until next turn'
      })
    },
    
    /**
     * Drop Prone action - gives -2 to hit with ranged, +2 to hit with melee
     */
    dropProneAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply prone status effect
        stateUnit.statusEffects.push({
          type: 'prone',
          value: 1, // Used as a flag
          duration: -1 // Lasts until unit chooses to stand up or moves
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} drops prone`,
        details: '-2 to ranged attacks against, +2 to melee attacks against'
      })
    },
    
    /**
     * Raise Shield action - gives +2 AC until next turn (requires shield)
     */
    raiseShieldAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      // Check if unit has shield (for now, only Voidguard)
      if (unit.class !== 'voidguard') {
        get().addLogEntry({
          type: 'system',
          message: `${getUnitDisplayName(unit)} doesn't have a shield!`
        })
        return
      }
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply shield raised status effect
        stateUnit.statusEffects.push({
          type: 'shieldRaised',
          value: 2,
          duration: 1 // Lasts until next turn
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} raises shield`,
        details: '+2 AC until next turn'
      })
    },
    
    /**
     * Take Cover action - gives +1 AC if adjacent to cover
     */
    takeCoverAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      // Check if adjacent to cover (crates or walls)
      const adjacent = getAdjacentPositions(unit.position)
      const grid = get().grid
      const hasCover = adjacent.some(pos => {
        const cell = grid[pos.y][pos.x]
        return cell.type === 'crate' || cell.type === 'wall'
      })
      
      if (!hasCover) {
        get().addLogEntry({
          type: 'system',
          message: `${getUnitDisplayName(unit)} is not adjacent to cover!`
        })
        return
      }
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply taking cover status effect
        stateUnit.statusEffects.push({
          type: 'takingCover',
          value: 1,
          duration: 1 // Lasts until end of turn
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} takes cover`,
        details: '+1 AC until end of turn'
      })
    },
    
    /**
     * Brace action - reduces knockback/forced movement effects
     */
    braceAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply braced status effect
        stateUnit.statusEffects.push({
          type: 'braced',
          value: 1, // Used as a flag
          duration: 1 // Lasts until next turn
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} braces for impact`,
        details: 'Reduces knockback and forced movement'
      })
    },
    
    /**
     * Reload action - restores ammo to max capacity
     */
    reloadAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      // Only ranged units can reload
      if (!unit.maxAmmo || unit.currentAmmo === undefined) {
        return
      }
      
      const ammoRestored = unit.maxAmmo - (unit.currentAmmo || 0)
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Restore ammo to max capacity
        if (stateUnit.maxAmmo !== undefined) {
          stateUnit.currentAmmo = stateUnit.maxAmmo
          stateUnit.actionsRemaining -= 1
          
          // Clear selection
          state.selectedAction = null
          state.validTargets = []
        }
      })
      
      // Log the action with ammo restored info
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} reloads`,
        details: `Restored ${ammoRestored} rounds (${unit.maxAmmo}/${unit.maxAmmo})`
      })
    },
    
    /**
     * Step Unit - moves exactly 1 tile (doesn't trigger reactions)
     */
    stepUnit: (unitId: string, position: Position) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      // Validate step is only 1 tile away
      const distance = calculateDistance(unit.position, position)
      if (distance !== 1) return
      
      // Validate move is in allowed positions
      const isValidMove = get().validMoves.some(
        move => move.x === position.x && move.y === position.y
      )
      if (!isValidMove) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Execute step and consume action
        stateUnit.position = position
        stateUnit.actionsRemaining -= 1
        
        // Remove prone status when moving
        stateUnit.statusEffects = stateUnit.statusEffects.filter(e => e.type !== 'prone')
        
        // Clear UI state
        state.selectedAction = null
        state.validMoves = []
      })
      
      // Log the step
      get().addLogEntry({
        type: 'move',
        message: `${getUnitDisplayName(unit)} stepped to (${position.x}, ${position.y})`,
        details: 'Careful movement - no reactions triggered'
      })
    }
  }))
)
