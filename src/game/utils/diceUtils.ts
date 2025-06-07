/**
 * Dice rolling utilities for combat and damage resolution
 * Implements proper dice mechanics for the tactical combat system
 */

/**
 * Rolls one or more dice and returns an array of results
 * @param sides - Number of sides on each die (4, 6, 8, 10, 12, 20)
 * @param count - Number of dice to roll (default: 1)
 * @returns Array of individual die results
 */
export const rollDice = (sides: number, count: number = 1): number[] => {
  const results: number[] = []
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1
    results.push(roll)
  }
  
  return results
}

/**
 * Rolls damage based on dice notation string (e.g., "1d6", "2d8", "1d4+1")
 * @param diceString - Dice notation (e.g., "1d6", "2d8+3", "1d4+1")
 * @returns Object containing individual rolls, bonus, and total damage
 */
export const rollDamage = (diceString: string): { rolls: number[], bonus: number, total: number } => {
  // Parse dice string (e.g., "1d6+2" or "2d8" or "1d4+1")
  const diceRegex = /^(\d+)d(\d+)(?:\+(\d+))?$/i
  const match = diceString.match(diceRegex)
  
  if (!match) {
    console.error(`Invalid dice string: ${diceString}`)
    return { rolls: [1], bonus: 0, total: 1 }
  }
  
  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const bonus = match[3] ? parseInt(match[3]) : 0
  
  const rolls = rollDice(sides, count)
  const rollTotal = rolls.reduce((sum, roll) => sum + roll, 0)
  const total = rollTotal + bonus
  
  return {
    rolls,
    bonus,
    total
  }
}

/**
 * Formats a dice roll result for display in combat log
 * @param rolls - Array of individual die results
 * @param bonus - Any bonus added to the roll
 * @param diceString - Original dice notation for display
 * @returns Formatted string (e.g., "1d6: [4] + 1 = 5")
 */
export const formatDiceRoll = (rolls: number[], bonus: number, diceString: string): string => {
  const rollsDisplay = `[${rolls.join(', ')}]`
  
  if (bonus > 0) {
    const rollSum = rolls.reduce((sum, roll) => sum + roll, 0)
    return `${diceString}: ${rollsDisplay} + ${bonus} = ${rollSum + bonus}`
  } else {
    const total = rolls.reduce((sum, roll) => sum + roll, 0)
    return `${diceString}: ${rollsDisplay} = ${total}`
  }
}

/**
 * Rolls a single d20 for attack rolls, saves, etc.
 * @returns Number between 1 and 20
 */
export const rollD20 = (): number => {
  return rollDice(20)[0]
}

/**
 * Checks if a roll is a natural 20 (critical success)
 * @param roll - The d20 roll result
 * @returns True if roll is exactly 20
 */
export const isNatural20 = (roll: number): boolean => {
  return roll === 20
}

/**
 * Checks if a roll is a natural 1 (critical failure)
 * @param roll - The d20 roll result
 * @returns True if roll is exactly 1
 */
export const isNatural1 = (roll: number): boolean => {
  return roll === 1
}

/**
 * Determines if an attack is a critical hit
 * @param roll - The d20 attack roll
 * @param total - Total attack result (roll + bonus)
 * @param targetAC - Target's armor class
 * @returns True if critical hit (natural 20 or beat AC by 10+)
 */
export const isCriticalHit = (roll: number, total: number, targetAC: number): boolean => {
  return isNatural20(roll) || total >= targetAC + 10
}

/**
 * Rolls splash damage for area effects (like Chem-Launcher)
 * @returns Splash damage amount (always 1 for now, as per design doc)
 */
export const rollSplashDamage = (): number => {
  // Per design document: "target takes the 1d4 and the 1 splash"
  // Splash damage is always 1 point to adjacent squares
  return 1
}