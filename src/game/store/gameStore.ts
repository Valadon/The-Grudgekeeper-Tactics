import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { GameState, Unit, Position, ActionType, Cell, CellType, CombatInfo, DwarfClass, CombatLogEntry } from '../types'
import { GRID_SIZE, STORAGE_BAY_LAYOUT, ACTIONS_PER_TURN, DWARF_STATS, ENEMY_STATS, MAP_PENALTIES } from '../constants'
import { nanoid } from 'nanoid'
import { calculateDistance, getLineOfSight, getMovementRange, getCoverPenalty, getAdjacentPositions, getLinePositions, hasLineOfSight, getCoverWithEffects } from '../utils/gridUtils'
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
  takeCoverEnhancedAction: (unitId: string) => void
  braceAction: (unitId: string) => void
  reloadAction: (unitId: string) => void
  stepUnit: (unitId: string, position: Position) => void
  
  // Combat mechanics
  pushUnit: (unitId: string, direction: Position, distance: number) => boolean
  executeLineAttack: (attackerId: string, targetId: string) => void
  
  // Turn management
  endTurn: () => void
  processEnemyTurn: () => void
  
  // Class abilities
  shieldWallAction: (unitId: string) => void
  gravitonSlamAction: (unitId: string) => void
  precisionDrillingAction: (unitId: string) => void
  combatBrewAction: (unitId: string, targetId: string, choice: 'heal' | 'damage') => void
  
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
              return distance <= maxRange && hasLineOfSight(
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
                return distance <= maxRange && hasLineOfSight(
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
        } else if (action === 'dropProne' || action === 'raiseShield' || action === 'takeCover' || action === 'brace' || action === 'reload' || action === 'takeCoverEnhanced') {
          // Self-targeted actions
          state.validTargets = [currentUnit.id]
        } else if (action === 'shieldWall' || action === 'gravitonSlam' || action === 'precisionDrilling') {
          // Self-targeted abilities that don't require target selection
          state.validTargets = [currentUnit.id]
        } else if (action === 'combatBrew') {
          // Combat Brew targets adjacent allies
          const allies = state.units.filter(u => 
            u.type === currentUnit.type && 
            u.id !== currentUnit.id && 
            u.hp > 0
          )
          state.validTargets = allies
            .filter(ally => calculateDistance(currentUnit.position, ally.position) === 1)
            .map(ally => ally.id)
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
      
      // Get attacker stats to check for special properties
      const attackerStats = attacker.type === 'enemy' 
        ? ENEMY_STATS[attacker.class as keyof typeof ENEMY_STATS]
        : DWARF_STATS[attacker.class as keyof typeof DWARF_STATS]
      
      // Check if this is a line attack
      const isLineAttack = attackerStats.special?.includes('line') || false
      
      if (isLineAttack) {
        // Handle line attack - hits all units in line from attacker to target
        get().executeLineAttack(attackerId, targetId)
        return
      }
      
      // NEW SYSTEM: Check line of sight first
      if (!hasLineOfSight(attacker.position, target.position, get().grid)) {
        // No line of sight - cannot attack
        get().addLogEntry({
          type: 'system',
          message: `${getUnitDisplayName(attacker)} cannot see ${getUnitDisplayName(target)}`,
          details: 'No line of sight - attack blocked'
        })
        return
      }
      
      // NEW SYSTEM: Calculate cover bonus (Pathfinder 2e style)
      let coverBonus = 0
      const coverInfo = getCoverWithEffects(attacker.position, target.position, get().grid, get().units, target)
      
      // Debug creature cover specifically
      if (coverInfo.source === 'creature') {
        console.log('Creature cover detected:', coverInfo, 'between', getUnitDisplayName(attacker), 'and', getUnitDisplayName(target))
      }
      
      // Check for precision drilling - ignores cover
      const precisionDrilling = attacker.statusEffects.find(e => e.type === 'precisionDrilling')
      if (precisionDrilling) {
        coverBonus = 0
      } else {
        coverBonus = coverInfo.bonus
      }
      
      // Calculate Multiple Attack Penalty (MAP) based on strikes this turn
      const mapPenalty = MAP_PENALTIES[Math.min(attacker.strikesThisTurn, MAP_PENALTIES.length - 1)]
      
      // Apply status effects to AC (e.g., Shield Wall, Defending, Shield Raised)
      let effectiveAC = target.ac + coverBonus  // Add cover bonus to AC
      
      const shieldWall = target.statusEffects.find(e => e.type === 'shieldWall')
      if (shieldWall) {
        effectiveAC += shieldWall.value
      }
      const defending = target.statusEffects.find(e => e.type === 'defending')
      if (defending) {
        effectiveAC += defending.value
      }
      const shieldRaised = target.statusEffects.find(e => e.type === 'shieldRaised')
      if (shieldRaised) {
        effectiveAC += shieldRaised.value
      }
      // Note: takingCover is now handled in getCoverWithEffects
      
      // Apply status effects to attack bonus (e.g., Aimed)
      let attackBonus = attacker.attackBonus
      const aimed = attacker.statusEffects.find(e => e.type === 'aimed')
      if (aimed) {
        attackBonus += aimed.value
      }
      
      // Combat resolution: d20 + bonus - MAP penalty vs AC (cover is now included in AC)
      const roll = rollD20()
      const total = roll + attackBonus - Math.abs(mapPenalty)
      const hit = total >= effectiveAC
      const critical = isCriticalHit(roll, total, effectiveAC)
      
      // Roll damage if hit
      let damageResult = { rolls: [0], bonus: 0, total: 0 }
      let damageDisplay = ''
      
      if (hit) {
        damageResult = rollDamage(attacker.damage)
        
        // Apply combat brew damage bonus
        const combatBrewDamage = attacker.statusEffects.find(e => e.type === 'combatBrewDamage')
        if (combatBrewDamage) {
          damageResult.total += combatBrewDamage.value
        }
        
        // Double damage on critical hits
        if (critical) {
          damageResult.total *= 2
        }
        
        damageDisplay = formatDiceRoll(damageResult.rolls, damageResult.bonus, attacker.damage)
        if (combatBrewDamage) {
          damageDisplay += ` + ${combatBrewDamage.value} (combat brew)`
        }
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
        coverPenalty: coverBonus,  // Now represents cover bonus to AC
        mapPenalty,
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
      
      if (mapPenalty < 0) {
        attackDetails += ` - ${Math.abs(mapPenalty)} (MAP)`
      }
      
      attackDetails += ` = ${total}`
      
      // Show AC breakdown with cover
      let acBreakdown = `AC ${target.ac}`
      if (coverBonus > 0) {
        const coverTypeDisplay = coverInfo.type === 'lesser' ? 'Lesser' : 
                               coverInfo.type === 'standard' ? 'Standard' : 
                               coverInfo.type === 'greater' ? 'Greater' : ''
        acBreakdown += ` + ${coverBonus} (${coverTypeDisplay} Cover)`
      }
      
      // Add other AC bonuses to breakdown
      let otherBonuses = 0
      if (shieldWall) otherBonuses += shieldWall.value
      if (defending) otherBonuses += defending.value 
      if (shieldRaised) otherBonuses += shieldRaised.value
      
      if (otherBonuses > 0) {
        acBreakdown += ` + ${otherBonuses} (effects)`
      }
      
      attackDetails += ` vs ${acBreakdown} = ${effectiveAC}`
      
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
        
        // Increment strikes this turn for Multiple Attack Penalty (MAP)
        stateAttacker.strikesThisTurn += 1
        
        // Consume ammo for ranged attacks
        if (stateAttacker.rangeWeapon && stateAttacker.currentAmmo !== undefined) {
          stateAttacker.currentAmmo = Math.max(0, stateAttacker.currentAmmo - 1)
        }
        
        // Remove consumed status effects after use
        stateAttacker.statusEffects = stateAttacker.statusEffects.filter(e => 
          e.type !== 'aimed' && 
          e.type !== 'precisionDrilling' && 
          e.type !== 'combatBrewDamage'
        )
        
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
          nextUnit.strikesThisTurn = 0  // Reset MAP counter for new turn
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
    },
    
    /**
     * Push Unit - moves unit in specified direction for knockback effects
     * @param unitId - ID of unit to push
     * @param direction - Normalized direction vector (dx, dy)
     * @param distance - Number of tiles to push
     * @returns true if push was successful, false if blocked
     */
    pushUnit: (unitId: string, direction: Position, distance: number): boolean => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit) return false
      
      // Calculate target position
      const targetX = unit.position.x + (direction.x * distance)
      const targetY = unit.position.y + (direction.y * distance)
      
      // Validate target position is within grid bounds
      if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
        return false // Can't push off the grid
      }
      
      const targetPosition = { x: targetX, y: targetY }
      
      // Check if target cell is passable
      const grid = get().grid
      const targetCell = grid[targetY][targetX]
      if (targetCell.type === 'wall') {
        return false // Can't push into walls
      }
      
      // Check if target position is occupied by another unit
      const units = get().units
      const occupyingUnit = units.find(u => 
        u.position.x === targetX && 
        u.position.y === targetY && 
        u.hp > 0 && 
        u.id !== unitId
      )
      
      if (occupyingUnit) {
        return false // Can't push into occupied space
      }
      
      // Check if unit has "braced" status (reduces knockback)
      const braced = unit.statusEffects.find(e => e.type === 'braced')
      if (braced && distance > 1) {
        // Braced units only get pushed 1 tile maximum
        const reducedDistance = 1
        const reducedTargetX = unit.position.x + (direction.x * reducedDistance)
        const reducedTargetY = unit.position.y + (direction.y * reducedDistance)
        
        // Validate reduced position
        if (reducedTargetX < 0 || reducedTargetX >= GRID_SIZE || 
            reducedTargetY < 0 || reducedTargetY >= GRID_SIZE) {
          return false
        }
        
        const reducedTargetCell = grid[reducedTargetY][reducedTargetX]
        if (reducedTargetCell.type === 'wall') {
          return false
        }
        
        const reducedOccupyingUnit = units.find(u => 
          u.position.x === reducedTargetX && 
          u.position.y === reducedTargetY && 
          u.hp > 0 && 
          u.id !== unitId
        )
        
        if (reducedOccupyingUnit) {
          return false
        }
        
        // Perform reduced knockback
        set((state) => {
          const stateUnit = state.units.find(u => u.id === unitId)
          if (stateUnit) {
            stateUnit.position = { x: reducedTargetX, y: reducedTargetY }
          }
        })
        
        get().addLogEntry({
          type: 'ability',
          message: `${getUnitDisplayName(unit)} resists knockback`,
          details: `Braced stance reduces knockback to 1 tile`
        })
        
        return true
      }
      
      // Perform full knockback
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (stateUnit) {
          stateUnit.position = targetPosition
        }
      })
      
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} knocked back`,
        details: `Pushed ${distance} tile${distance > 1 ? 's' : ''} to (${targetPosition.x}, ${targetPosition.y})`
      })
      
      return true
    },
    
    /**
     * Execute Line Attack - hits all units in line from attacker to target
     * Used for Mining Drone beam and similar piercing attacks
     */
    executeLineAttack: (attackerId: string, targetId: string) => {
      const attacker = get().units.find(u => u.id === attackerId)
      const primaryTarget = get().units.find(u => u.id === targetId)
      
      if (!attacker || !primaryTarget || attacker.actionsRemaining <= 0) return
      
      // Calculate line positions from attacker to target
      const linePositions = getLinePositions(attacker.position, primaryTarget.position)
      
      // Find all units in the line
      const unitsInLine = get().units.filter(unit => 
        unit.hp > 0 && 
        unit.id !== attackerId &&
        linePositions.some(pos => pos.x === unit.position.x && pos.y === unit.position.y)
      )
      
      // Calculate Multiple Attack Penalty (MAP) based on strikes this turn
      const mapPenalty = MAP_PENALTIES[Math.min(attacker.strikesThisTurn, MAP_PENALTIES.length - 1)]
      
      // Get attack bonus and apply status effects
      let attackBonus = attacker.attackBonus
      const aimed = attacker.statusEffects.find(e => e.type === 'aimed')
      if (aimed) {
        attackBonus += aimed.value
      }
      
      const attackTargets: Array<{unit: Unit, hit: boolean, damage: number, roll: number, total: number}> = []
      
      // Attack each unit in the line
      unitsInLine.forEach(target => {
        // Check for cover penalty (line attacks may pierce some cover)
        const coverPenalty = getCoverPenalty(attacker.position, target.position, get().grid)
        
        // Apply status effects to target AC
        let effectiveAC = target.ac
        const shieldWall = target.statusEffects.find(e => e.type === 'shieldWall')
        if (shieldWall) {
          effectiveAC += shieldWall.value
        }
        const defending = target.statusEffects.find(e => e.type === 'defending')
        if (defending) {
          effectiveAC += defending.value
        }
        
        // Roll attack
        const roll = rollD20()
        const total = roll + attackBonus - coverPenalty - Math.abs(mapPenalty)
        const hit = total >= effectiveAC
        const critical = isCriticalHit(roll, total, effectiveAC)
        
        let damage = 0
        if (hit) {
          const damageResult = rollDamage(attacker.damage)
          damage = critical ? damageResult.total * 2 : damageResult.total
        }
        
        attackTargets.push({ unit: target, hit, damage, roll, total })
      })
      
      // Apply damage and log results
      set((state) => {
        const stateAttacker = state.units.find(u => u.id === attackerId)
        if (!stateAttacker) return
        
        // Apply damage to all hit targets
        attackTargets.forEach(({unit, hit, damage}) => {
          if (hit && damage > 0) {
            const stateTarget = state.units.find(u => u.id === unit.id)
            if (stateTarget) {
              stateTarget.hp = Math.max(0, stateTarget.hp - damage)
            }
          }
        })
        
        // Consume action and ammo
        stateAttacker.actionsRemaining -= 1
        stateAttacker.strikesThisTurn += 1
        
        if (stateAttacker.rangeWeapon && stateAttacker.currentAmmo !== undefined) {
          stateAttacker.currentAmmo = Math.max(0, stateAttacker.currentAmmo - 1)
        }
        
        // Remove consumed status effects after use
        stateAttacker.statusEffects = stateAttacker.statusEffects.filter(e => 
          e.type !== 'aimed' && 
          e.type !== 'precisionDrilling' && 
          e.type !== 'combatBrewDamage'
        )
        
        // Clear UI state
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
      
      // Log the line attack results
      const attackerName = getUnitDisplayName(attacker)
      const hitTargets = attackTargets.filter(t => t.hit)
      const totalDamage = hitTargets.reduce((sum, t) => sum + t.damage, 0)
      
      get().addLogEntry({
        type: 'damage',
        message: `${attackerName} fires a beam attack hitting ${hitTargets.length} target${hitTargets.length !== 1 ? 's' : ''}`,
        details: `Total damage: ${totalDamage} | Targets: ${hitTargets.map(t => getUnitDisplayName(t.unit)).join(', ')}`
      })
      
      // Log individual hits for detailed tracking
      attackTargets.forEach(({unit, hit, damage, roll, total}) => {
        if (hit) {
          get().addLogEntry({
            type: 'damage',
            message: `${getUnitDisplayName(unit)} takes ${damage} damage`,
            details: `d20(${roll}) + ${attackBonus}${mapPenalty < 0 ? ` - ${Math.abs(mapPenalty)} (MAP)` : ''} = ${total} vs AC ${unit.ac}`
          })
        } else {
          get().addLogEntry({
            type: 'miss',
            message: `${getUnitDisplayName(unit)} avoids the beam`,
            details: `d20(${roll}) + ${attackBonus}${mapPenalty < 0 ? ` - ${Math.abs(mapPenalty)} (MAP)` : ''} = ${total} vs AC ${unit.ac}`
          })
        }
      })
    },
    
    /**
     * Voidguard Shield Wall: Adjacent allies get +1 AC while shield is raised
     */
    shieldWallAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0 || unit.class !== 'voidguard') return
      
      // Check if shield is raised
      const hasShieldRaised = unit.statusEffects.some(e => e.type === 'shieldRaised')
      if (!hasShieldRaised) {
        // Log warning
        get().addLogEntry({
          type: 'system',
          message: 'Shield Wall requires Raise Shield to be active first',
          details: 'Use Raise Shield before activating Shield Wall'
        })
        return
      }
      
      // Find adjacent allied units
      const adjacentAllies = get().units.filter(ally => {
        if (ally.id === unitId || ally.type !== 'dwarf' || ally.hp <= 0) return false
        const distance = calculateDistance(unit.position, ally.position)
        return distance === 1
      })
      
      if (adjacentAllies.length === 0) {
        get().addLogEntry({
          type: 'system',
          message: 'No adjacent allies to benefit from Shield Wall',
          details: 'Must have allies within 1 tile'
        })
        return
      }
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply shield wall bonus to all adjacent allies
        adjacentAllies.forEach(ally => {
          const stateAlly = state.units.find(u => u.id === ally.id)
          if (stateAlly) {
            // Remove any existing shield wall effect first
            stateAlly.statusEffects = stateAlly.statusEffects.filter(e => e.type !== 'shieldWall')
            // Add new shield wall effect
            stateAlly.statusEffects.push({
              type: 'shieldWall',
              value: 1,
              duration: 1 // Lasts until next turn
            })
          }
        })
        
        stateUnit.actionsRemaining -= 1
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} activates Shield Wall`,
        details: `${adjacentAllies.length} allied dwarf${adjacentAllies.length !== 1 ? 'ves' : ''} gain +1 AC`
      })
    },
    
    /**
     * Voidguard Graviton Slam: Strike all adjacent enemies, knock back 1 tile
     */
    gravitonSlamAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining < 2 || unit.class !== 'voidguard') return
      
      // Find all adjacent enemies
      const adjacentEnemies = get().units.filter(enemy => {
        if (enemy.type === 'dwarf' || enemy.hp <= 0) return false
        const distance = calculateDistance(unit.position, enemy.position)
        return distance === 1
      })
      
      if (adjacentEnemies.length === 0) {
        get().addLogEntry({
          type: 'system',
          message: 'No adjacent enemies to strike with Graviton Slam',
          details: 'Must have enemies within 1 tile'
        })
        return
      }
      
      // Execute attacks on all adjacent enemies
      adjacentEnemies.forEach(enemy => {
        // Calculate attack roll
        const roll = rollD20()
        const total = roll + unit.attackBonus
        const hit = total >= enemy.ac
        const critical = isCriticalHit(roll, total, enemy.ac)
        
        let damage = 0
        let damageDisplay = ''
        
        if (hit) {
          const damageResult = rollDamage(unit.damage)
          damage = critical ? damageResult.total * 2 : damageResult.total
          damageDisplay = formatDiceRoll(damageResult.rolls, damageResult.bonus, unit.damage)
          if (critical) {
            damageDisplay += ` (CRIT: doubled to ${damage})`
          }
        }
        
        // Apply damage and knockback
        set((state) => {
          const stateEnemy = state.units.find(u => u.id === enemy.id)
          if (!stateEnemy) return
          
          if (hit) {
            stateEnemy.hp = Math.max(0, stateEnemy.hp - damage)
            
            // Apply knockback (push enemy away from attacker)
            const dx = stateEnemy.position.x - unit.position.x
            const dy = stateEnemy.position.y - unit.position.y
            const direction = { x: Math.sign(dx), y: Math.sign(dy) }
            get().pushUnit(stateEnemy.id, direction, 1)
          }
        })
        
        // Log individual attack
        if (hit) {
          get().addLogEntry({
            type: 'damage',
            message: `${getUnitDisplayName(enemy)} takes ${damage} damage and is knocked back`,
            details: `d20(${roll}) + ${unit.attackBonus} = ${total} vs AC ${enemy.ac} | Damage: ${damageDisplay}`
          })
        } else {
          get().addLogEntry({
            type: 'miss',
            message: `${getUnitDisplayName(enemy)} avoids the graviton slam`,
            details: `d20(${roll}) + ${unit.attackBonus} = ${total} vs AC ${enemy.ac}`
          })
        }
      })
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        stateUnit.actionsRemaining -= 2
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the main action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} performs Graviton Slam`,
        details: `Attacked ${adjacentEnemies.length} adjacent enem${adjacentEnemies.length !== 1 ? 'ies' : 'y'}`
      })
    },
    
    /**
     * Asteroid Miner Precision Drilling: Ignore cover for next Strike
     */
    precisionDrillingAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining < 2 || unit.class !== 'asteroidMiner') return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Apply precision drilling status effect
        stateUnit.statusEffects.push({
          type: 'precisionDrilling',
          value: 1,
          duration: 1 // Lasts until next turn or used
        })
        
        stateUnit.actionsRemaining -= 2
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} activates Precision Drilling`,
        details: 'Next attack ignores cover penalties'
      })
    },
    
    /**
     * Brewmaster Engineer Combat Brew: Adjacent ally heals 1d6 OR gains +2 damage
     */
    combatBrewAction: (unitId: string, targetId: string, choice: 'heal' | 'damage') => {
      const unit = get().units.find(u => u.id === unitId)
      const target = get().units.find(u => u.id === targetId)
      
      if (!unit || !target || unit.actionsRemaining < 2 || unit.class !== 'brewmasterEngineer') return
      
      // Check if target is adjacent
      const distance = calculateDistance(unit.position, target.position)
      if (distance !== 1) {
        get().addLogEntry({
          type: 'system',
          message: 'Combat Brew requires adjacent ally',
          details: 'Target must be within 1 tile'
        })
        return
      }
      
      // Check if target is an ally
      if (target.type !== 'dwarf' || target.hp <= 0) {
        get().addLogEntry({
          type: 'system',
          message: 'Combat Brew can only target living allied dwarfs',
          details: 'Select a dwarf ally to assist'
        })
        return
      }
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        const stateTarget = state.units.find(u => u.id === targetId)
        if (!stateUnit || !stateTarget) return
        
        if (choice === 'heal') {
          // Roll 1d6 for healing
          const healResult = rollDamage('1d6')
          const actualHealAmount = Math.min(healResult.total, stateTarget.maxHp - stateTarget.hp)
          stateTarget.hp = Math.min(stateTarget.maxHp, stateTarget.hp + healResult.total)
          
          const healDisplay = formatDiceRoll(healResult.rolls, healResult.bonus, '1d6')
          
          get().addLogEntry({
            type: 'heal',
            message: `${getUnitDisplayName(stateTarget)} healed for ${actualHealAmount} HP`,
            details: `Healing: ${healDisplay} | Now at ${stateTarget.hp}/${stateTarget.maxHp} HP`
          })
        } else {
          // Apply damage buff
          // Remove any existing combat brew damage effect first
          stateTarget.statusEffects = stateTarget.statusEffects.filter(e => e.type !== 'combatBrewDamage')
          stateTarget.statusEffects.push({
            type: 'combatBrewDamage',
            value: 2,
            duration: 1 // Lasts until next turn
          })
          
          get().addLogEntry({
            type: 'ability',
            message: `${getUnitDisplayName(stateTarget)} gains +2 damage bonus`,
            details: 'Bonus applies to next attack'
          })
        }
        
        stateUnit.actionsRemaining -= 2
        
        // Clear selection
        state.selectedAction = null
        state.validTargets = []
      })
      
      // Log the main action
      get().addLogEntry({
        type: 'ability',
        message: `${getUnitDisplayName(unit)} gives ${getUnitDisplayName(target)} a combat brew`,
        details: choice === 'heal' ? 'Healing variant' : 'Damage boost variant'
      })
    },
    
    /**
     * Enhanced Take Cover: Pathfinder 2e Take Cover action
     * Upgrades existing cover or provides Standard Cover if none
     */
    takeCoverEnhancedAction: (unitId: string) => {
      const unit = get().units.find(u => u.id === unitId)
      if (!unit || unit.actionsRemaining <= 0) return
      
      set((state) => {
        const stateUnit = state.units.find(u => u.id === unitId)
        if (!stateUnit) return
        
        // Remove any existing Take Cover effect first
        stateUnit.statusEffects = stateUnit.statusEffects.filter(e => e.type !== 'takingCoverEnhanced')
        
        // Apply Take Cover Enhanced status effect
        stateUnit.statusEffects.push({
          type: 'takingCoverEnhanced',
          value: 1, // Used as a flag
          duration: 1 // Lasts until next turn or until unit moves
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
        details: 'Upgrades existing cover or provides Standard Cover (+2 AC)'
      })
    }
  }))
)
