import { DwarfClass, EnemyClass } from '../types'

export const GRID_SIZE = 8
export const CELL_SIZE = 64
export const ACTIONS_PER_TURN = 3

// Multiple Attack Penalty (MAP) system
export const MAP_PENALTIES = [0, -5, -10] // Indexed by strike number (0-based)

export const DWARF_STATS: Record<DwarfClass, {
  hp: number
  ac: number
  speed: number
  attackBonus: number
  damage: string // Now uses dice notation (e.g., "1d8", "1d6+1")
  weaponRange?: number
  ammoCapacity?: number // Max ammo for ranged weapons
  weaponType: 'melee' | 'ranged'
  damageType: string
  special?: string[] // Special weapon properties
  abilityName: string
  abilityDescription: string
  abilityCost: number
}> = {
  voidguard: {
    hp: 10,
    ac: 16,
    speed: 2,
    attackBonus: 3,
    damage: '1d8', // Plasma Hammer damage
    weaponType: 'melee',
    damageType: 'plasma',
    special: ['shield'],
    abilityName: 'Shield Wall',
    abilityDescription: 'While shield raised, adjacent allies get +1 AC',
    abilityCost: 1
  },
  asteroidMiner: {
    hp: 6,
    ac: 14,
    speed: 4,
    attackBonus: 4,
    damage: '1d6', // Mining Laser damage
    weaponRange: 3,
    ammoCapacity: 3,
    weaponType: 'ranged',
    damageType: 'laser',
    special: ['precise'],
    abilityName: 'Ore Sense',
    abilityDescription: 'Reveal 3x3 area through walls',
    abilityCost: 1
  },
  brewmasterEngineer: {
    hp: 8,
    ac: 15,
    speed: 3,
    attackBonus: 2,
    damage: '1d4+1', // Chem-Launcher damage + 1 splash to adjacent
    weaponRange: 4,
    ammoCapacity: 4,
    weaponType: 'ranged',
    damageType: 'chemical',
    special: ['splash'],
    abilityName: 'Combat Brew',
    abilityDescription: 'Adjacent ally heals 1d6 or gains +2 damage next turn',
    abilityCost: 2
  },
  starRanger: {
    hp: 7,
    ac: 14,
    speed: 3,
    attackBonus: 3,
    damage: '1d6+1', // Mag-Rifle damage
    weaponRange: 4,
    ammoCapacity: 6,
    weaponType: 'ranged',
    damageType: 'kinetic',
    special: ['precise'],
    abilityName: 'Overwatch',
    abilityDescription: 'Reaction shot when enemy enters cone',
    abilityCost: 2
  }
}

export const ENEMY_STATS: Record<EnemyClass, {
  hp: number
  ac: number
  speed: number
  attackBonus: number
  damage: string // Now uses dice notation
  weaponRange?: number
  ammoCapacity?: number
  weaponType: 'melee' | 'ranged'
  damageType: string
  special?: string[] // Special weapon properties
  aiType: 'ranged' | 'melee' | 'hunter'
}> = {
  goblinScavenger: {
    hp: 3,
    ac: 12,
    speed: 3,
    attackBonus: 1,
    damage: '1d4', // Scrap Pistol damage
    weaponRange: 3,
    ammoCapacity: 4,
    weaponType: 'ranged',
    damageType: 'kinetic',
    aiType: 'ranged'
  },
  voidHound: {
    hp: 5,
    ac: 14,
    speed: 5,
    attackBonus: 2,
    damage: '1d6', // Energy Bite damage
    weaponType: 'melee',
    damageType: 'energy',
    aiType: 'hunter'
  },
  corruptedMiningDrone: {
    hp: 8,
    ac: 11,
    speed: 2,
    attackBonus: 2,
    damage: '1d8', // Mining Beam damage (line attack)
    weaponRange: 4,
    ammoCapacity: 3,
    weaponType: 'ranged',
    damageType: 'energy',
    special: ['line'], // Line attack hits all units in line
    aiType: 'ranged'
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

export const TURRET_STATS = {
  engineerTurret: {
    hp: 3,
    ac: 10,
    speed: 0,
    attackBonus: 2,
    damage: '1d4', // Turret damage
    weaponRange: 4,
    ammoCapacity: 8,
    weaponType: 'ranged' as const,
    damageType: 'kinetic'
  }
}

export const UNIT_COLORS = {
  voidguard: '#3B82F6',
  asteroidMiner: '#10B981',
  brewmasterEngineer: '#F97316',
  starRanger: '#F59E0B',
  goblinScavenger: '#EF4444',
  voidHound: '#DC2626',
  corruptedMiningDrone: '#991B1B',
  engineerTurret: '#8B5CF6'
}

export const UNIT_INITIALS = {
  voidguard: 'V',
  asteroidMiner: 'A',
  brewmasterEngineer: 'B',
  starRanger: 'S',
  goblinScavenger: 'g',
  voidHound: 'H',
  corruptedMiningDrone: 'D',
  engineerTurret: 'T'
}