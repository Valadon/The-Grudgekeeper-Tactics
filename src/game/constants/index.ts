import { DwarfClass, EnemyClass } from '../types'

export const GRID_SIZE = 8
export const CELL_SIZE = 64
export const ACTIONS_PER_TURN = 3

export const DWARF_STATS: Record<DwarfClass, {
  hp: number
  ac: number
  speed: number
  attackBonus: number
  damage: number
  weaponRange?: number
  abilityName: string
  abilityDescription: string
  abilityCost: number
}> = {
  ironclad: {
    hp: 8,
    ac: 14,
    speed: 4,
    attackBonus: 3,
    damage: 2,
    abilityName: 'Shield Wall',
    abilityDescription: 'Grant adjacent ally +2 AC for 1 round',
    abilityCost: 2
  },
  delver: {
    hp: 6,
    ac: 12,
    speed: 6,
    attackBonus: 4,
    damage: 1,
    weaponRange: 6,
    abilityName: 'Ore Scanner',
    abilityDescription: 'See through walls in 3x3 area',
    abilityCost: 1
  },
  brewmaster: {
    hp: 7,
    ac: 13,
    speed: 5,
    attackBonus: 2,
    damage: 1,
    weaponRange: 4,
    abilityName: 'Combat Brew',
    abilityDescription: 'Heal adjacent ally 2 HP',
    abilityCost: 2
  },
  engineer: {
    hp: 6,
    ac: 11,
    speed: 5,
    attackBonus: 3,
    damage: 1,
    weaponRange: 8,
    abilityName: 'Deploy Turret',
    abilityDescription: 'Place turret with HP 3, AC 10, Attack +2, Damage 1',
    abilityCost: 3
  }
}

export const ENEMY_STATS: Record<EnemyClass, {
  hp: number
  ac: number
  speed: number
  attackBonus: number
  damage: number
  weaponRange?: number
  aiType: 'ranged' | 'melee' | 'hunter'
}> = {
  goblinScavenger: {
    hp: 2,
    ac: 11,
    speed: 5,
    attackBonus: 1,
    damage: 1,
    weaponRange: 4,
    aiType: 'ranged'
  },
  goblinGrunt: {
    hp: 3,
    ac: 12,
    speed: 4,
    attackBonus: 2,
    damage: 1,
    aiType: 'melee'
  },
  voidWarg: {
    hp: 6,
    ac: 13,
    speed: 7,
    attackBonus: 3,
    damage: 2,
    aiType: 'hunter'
  }
}

export const STORAGE_BAY_LAYOUT = [
  '########',
  '#...#..#',
  '#.C.#.G#',
  '#......#',
  'D...W..#',
  '#......#',
  '#.C.#.g#',
  '########'
]

export const UNIT_COLORS = {
  ironclad: '#3B82F6',
  delver: '#10B981',
  brewmaster: '#F97316',
  engineer: '#F59E0B',
  goblinScavenger: '#EF4444',
  goblinGrunt: '#DC2626',
  voidWarg: '#991B1B'
}

export const UNIT_INITIALS = {
  ironclad: 'I',
  delver: 'D',
  brewmaster: 'B',
  engineer: 'E',
  goblinScavenger: 'g',
  goblinGrunt: 'G',
  voidWarg: 'W'
}