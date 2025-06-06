import { Unit, UnitType, DwarfClass, EnemyClass, TurretClass, Position } from '../types'
import { DWARF_STATS, ENEMY_STATS, TURRET_STATS, ACTIONS_PER_TURN } from '../constants'
import { nanoid } from 'nanoid'

export const createUnit = (
  type: UnitType,
  unitClass: DwarfClass | EnemyClass | TurretClass,
  position: Position
): Unit => {
  const stats = type === 'dwarf' 
    ? DWARF_STATS[unitClass as DwarfClass]
    : type === 'enemy'
    ? ENEMY_STATS[unitClass as EnemyClass]
    : TURRET_STATS[unitClass as TurretClass]
  
  return {
    id: nanoid(),
    type,
    class: unitClass,
    position,
    hp: stats.hp,
    maxHp: stats.hp,
    ac: stats.ac,
    speed: stats.speed,
    attackBonus: stats.attackBonus,
    damage: stats.damage,
    rangeWeapon: stats.weaponRange,
    actionsRemaining: 0,
    isActive: false,
    statusEffects: []
  }
}

export const isUnitAlive = (unit: Unit): boolean => {
  return unit.hp > 0
}

export const getUnitDisplayName = (unit: Unit): string => {
  const classNames = {
    ironclad: 'Ironclad',
    delver: 'Delver',
    brewmaster: 'Brewmaster',
    engineer: 'Engineer',
    goblinScavenger: 'Goblin Scavenger',
    goblinGrunt: 'Goblin Grunt',
    voidWarg: 'Void Warg',
    engineerTurret: 'Turret'
  }
  
  return classNames[unit.class] || unit.class
}