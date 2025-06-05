export type Position = {
  x: number
  y: number
}

export type UnitType = 'dwarf' | 'enemy'
export type DwarfClass = 'ironclad' | 'delver' | 'brewmaster' | 'engineer'
export type EnemyClass = 'goblinScavenger' | 'goblinGrunt' | 'voidWarg'

export type Unit = {
  id: string
  type: UnitType
  class: DwarfClass | EnemyClass
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
  hasMoved: boolean
  hasAttacked: boolean
}

export type CellType = 'floor' | 'wall' | 'crate' | 'door'

export type Cell = {
  type: CellType
  position: Position
  occupied?: string // unit id
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