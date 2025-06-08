export type Position = {
  x: number
  y: number
}

export type UnitType = 'dwarf' | 'enemy' | 'turret'
export type DwarfClass = 'voidguard' | 'asteroidMiner' | 'brewmasterEngineer' | 'starRanger'
export type EnemyClass = 'goblinScavenger' | 'voidHound' | 'corruptedMiningDrone'
export type TurretClass = 'engineerTurret'

export type StatusEffect = {
  type: 'shieldWall' | 'aimed' | 'defending' | 'prone' | 'shieldRaised' | 'takingCover' | 'braced' | 'precisionDrilling' | 'combatBrewDamage' | 'takingCoverEnhanced'
  value: number
  duration: number // rounds remaining
}

export type ReactionTrigger = {
  type: 'movement' | 'attack' | 'ability' | 'damage'
  condition: string // Description of when this triggers
  active: boolean // Whether this reaction is currently active
  usesRemaining: number // How many times this can trigger (0 = unlimited)
}

export type Unit = {
  id: string
  type: UnitType
  class: DwarfClass | EnemyClass | TurretClass
  position: Position
  hp: number
  maxHp: number
  ac: number
  speed: number
  attackBonus: number
  damage: string // Now uses dice notation (e.g., "1d6", "1d8+1")
  rangeWeapon?: number
  currentAmmo?: number // Current ammo count (undefined for melee weapons)
  maxAmmo?: number // Maximum ammo capacity (undefined for melee weapons)
  actionsRemaining: number
  strikesThisTurn: number // Track attacks for Multiple Attack Penalty (MAP)
  isActive: boolean
  statusEffects: StatusEffect[]
  reactions: ReactionTrigger[] // Active reaction triggers
  ownerId?: string // For turrets to track their creator
  // Animation properties
  animationPosition?: Position // Current animation position
  animationTarget?: Position // Target position for animation
  animationProgress?: number // 0-1 progress of animation
}

export type CellType = 'floor' | 'wall' | 'crate' | 'door'

export type CoverType = 'none' | 'lesser' | 'standard' | 'greater'

export type CoverInfo = {
  type: CoverType
  bonus: number  // AC bonus: 0, 1, 2, or 4
  source: 'terrain' | 'creature' | 'action' | 'none'
}

export type Cell = {
  type: CellType
  position: Position
  occupied?: string // unit id
}

export type CombatInfo = {
  attackerId: string
  targetId: string
  roll: number
  bonus: number
  coverPenalty: number
  mapPenalty: number // Multiple Attack Penalty
  total: number
  targetAC: number
  hit: boolean
  critical: boolean
  damage: number
}

export type CombatLogEntry = {
  round: number
  type: 'attack' | 'damage' | 'miss' | 'move' | 'ability' | 'heal' | 'system'
  message: string
  details?: string
}

export type GameState = {
  units: Unit[]
  grid: Cell[][]
  currentUnitId: string | null
  turnOrder: string[]
  round: number
  phase: 'placement' | 'combat' | 'victory' | 'defeat'
  selectedAction: ActionType | null
  hoveredCell: Position | null
  validMoves: Position[]
  validTargets: string[]
  lastCombat?: CombatInfo
  revealedCells: Position[] // For Ore Scanner
  combatLog: CombatLogEntry[]
}

export type ActionType = 'move' | 'strike' | 'aim' | 'defend' | 'ability' | 'interact' | 'dropProne' | 'raiseShield' | 'takeCover' | 'brace' | 'reload' | 'step' | 'stride' | 'shieldWall' | 'gravitonSlam' | 'precisionDrilling' | 'combatBrew' | 'takeCoverEnhanced'

export type DiceRollResult = {
  roll: number
  bonus: number
  total: number
  target: number
  success: boolean
  critical: boolean
  criticalFail: boolean
}