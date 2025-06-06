import { Unit, UnitType, DwarfClass, EnemyClass, TurretClass, Position } from '../types'
import { DWARF_STATS, ENEMY_STATS, TURRET_STATS, ACTIONS_PER_TURN } from '../constants'
import { nanoid } from 'nanoid'

/**
 * Factory function to create new unit instances
 * Pulls stats from constants based on unit type and class
 * @param type - 'dwarf', 'enemy', or 'turret'
 * @param unitClass - Specific class within the type
 * @param position - Starting grid position
 * @returns Fully initialized unit object
 */
export const createUnit = (
  type: UnitType,
  unitClass: DwarfClass | EnemyClass | TurretClass,
  position: Position
): Unit => {
  // Look up stats based on unit type and class
  const stats = type === 'dwarf' 
    ? DWARF_STATS[unitClass as DwarfClass]
    : type === 'enemy'
    ? ENEMY_STATS[unitClass as EnemyClass]
    : TURRET_STATS[unitClass as TurretClass]
  
  return {
    id: nanoid(),  // Generate unique ID
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
    actionsRemaining: 0,  // Will be set when unit's turn starts
    isActive: false,       // Will be true during unit's turn
    statusEffects: []      // Empty array for buffs/debuffs
  }
}

/**
 * Helper to check if unit is still in play
 * Units at 0 HP are considered defeated (wounded state not yet implemented)
 */
export const isUnitAlive = (unit: Unit): boolean => {
  return unit.hp > 0
}

/**
 * Gets human-readable display name for a unit
 * Used in UI components for better presentation
 */
export const getUnitDisplayName = (unit: Unit): string => {
  const classNames = {
    // Dwarf classes
    ironclad: 'Ironclad',
    delver: 'Delver',
    brewmaster: 'Brewmaster',
    engineer: 'Engineer',
    // Enemy classes
    goblinScavenger: 'Goblin Scavenger',
    goblinGrunt: 'Goblin Grunt',
    voidWarg: 'Void Warg',
    // Special units
    engineerTurret: 'Turret'
  }
  
  return classNames[unit.class] || unit.class
}