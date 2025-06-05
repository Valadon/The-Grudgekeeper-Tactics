import { Unit, UnitType, DwarfClass, EnemyClass, Position } from '../types'
import { DWARF_STATS, ENEMY_STATS, ACTIONS_PER_TURN } from '../constants'
import { nanoid } from 'nanoid'

export const createUnit = (
  type: UnitType,
  unitClass: DwarfClass | EnemyClass,
  position: Position
): Unit => {
  const stats = type === 'dwarf' 
    ? DWARF_STATS[unitClass as DwarfClass]
    : ENEMY_STATS[unitClass as EnemyClass]
  
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
    hasMoved: false,
    hasAttacked: false
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
    voidWarg: 'Void Warg'
  }
  
  return classNames[unit.class] || unit.class
}