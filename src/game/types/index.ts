export type Position = {
  x: number
  y: number
}

export type UnitType = 'dwarf' | 'enemy' | 'turret'
export type DwarfClass = 'ironclad' | 'delver' | 'brewmaster' | 'engineer'
export type EnemyClass = 'goblinScavenger' | 'goblinGrunt' | 'voidWarg'
export type TurretClass = 'engineerTurret'

export type StatusEffect = {
  type: 'shieldWall' | 'aimed' | 'defending'
  value: number
  duration: number // rounds remaining
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
  damage: number
  rangeWeapon?: number
  actionsRemaining: number
  isActive: boolean
  statusEffects: StatusEffect[]
  ownerId?: string // For turrets to track their creator
}

export type CellType = 'floor' | 'wall' | 'crate' | 'door'

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
  total: number
  targetAC: number
  hit: boolean
  critical: boolean
  damage: number
}

export type CombatLogEntry = {
  round: number
  type: 'attack' | 'damage' | 'move' | 'ability' | 'heal' | 'system'
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

export type ActionType = 'move' | 'strike' | 'aim' | 'defend' | 'ability' | 'interact'

export type DiceRollResult = {
  roll: number
  bonus: number
  total: number
  target: number
  success: boolean
  critical: boolean
  criticalFail: boolean
}