# Tactical Combat Prototype - Implementation Guide for Claude Code

## Project Setup
Create a new Next.js project specifically for testing the tactical combat. This should be separate from the main Grudgekeeper project for now. Use TypeScript, Tailwind CSS, and Canvas for rendering.

---

## Phase 1: Grid, Units, and Basic Movement

### Goal
Create a tactical grid where units can be placed and moved around with mouse controls.

### Requirements

1. **Tactical Grid**
   - 8x8 grid rendered on canvas
   - Each cell should be 64x64 pixels
   - Grid lines visible but subtle (#333)
   - Coordinate system (0,0 top-left)

2. **Unit System**
   - Create dwarf units (Ironclad, Delver, Brewmaster, Engineer)
   - Create enemy units (Goblin Scavenger, Goblin Grunt, Void Warg)
   - Each unit displays as a colored circle with class initial:
     - Ironclad: Blue circle with "I"
     - Delver: Green circle with "D"
     - Brewmaster: Orange circle with "B"
     - Engineer: Yellow circle with "E"
     - Enemies: Red circles with "g", "G", "W"

3. **Turn-Based Movement**
   - Display current unit's turn with glowing border
   - Show movement range (highlight valid squares in semi-transparent blue)
   - Click to move to valid square
   - Units have Speed stat determining movement range
   - Cannot move through walls or other units

4. **UI Elements**
   - Turn order display on the right side
   - Current unit stats (HP, AC, Speed, Actions remaining)
   - "End Turn" button
   - Action buttons: Move, Strike, Aim, Defend

5. **Test Room**
   - Implement the "Storage Bay Skirmish" layout from the rules
   - Walls block movement and line of sight
   - Crates provide cover (can move through but counts as difficult terrain)

### Success Criteria
- Can move all units around the grid
- Turn order works correctly
- Movement range visualization is clear
- Can't move through walls or units

---

## Phase 2: Combat Mechanics

### Goal
Add attacking, damage, line of sight, and special abilities.

### Requirements

1. **Line of Sight System**
   - When selecting Strike action, show valid targets in red
   - Draw line from attacker to target
   - Check for walls blocking LoS
   - Show cover indicators (-2 or -4 penalty)

2. **Combat Resolution**
   - Click target to attack
   - Show d20 roll animation
   - Display: Roll + Bonus vs AC
   - Apply damage on hit
   - Show floating damage numbers
   - Critical hits (nat 20 or beat AC by 10+) show special effect

3. **Range Weapons**
   - Each weapon has max range
   - Can't target beyond range
   - Visualize range when selecting Strike

4. **Action Economy**
   - Each unit gets 3 actions per turn
   - Display remaining actions as dots/pips
   - Different actions cost different amounts:
     - Move: 1 action
     - Strike: 1 action
     - Abilities: varies (1-3 actions)
   - Gray out unavailable actions

5. **Special Abilities**
   - Ironclad Shield Wall: Click adjacent ally to grant +2 AC
   - Delver Ore Scanner: Click to reveal 3x3 area through walls
   - Brewmaster Combat Brew: Click adjacent ally to heal 2 HP
   - Engineer Deploy Turret: Click empty adjacent square to place

6. **Status Tracking**
   - HP bars above units
   - AC shown when targeting
   - Wounded state at 0 HP (unit grayed out, limited actions)
   - Remove dead units from board

### Success Criteria
- Can attack enemies and resolve combat
- Range and LoS work correctly  
- Abilities function as designed
- Units die when reaching 0 HP

---

## Phase 3: AI, Polish, and Full Encounter

### Goal
Add enemy AI, polish the experience, and make it feel like a real tactical game.

### Requirements

1. **Enemy AI**
   - Goblin Scavenger: Move toward nearest dwarf, shoot if in range
   - Goblin Grunt: Rush to melee range of nearest dwarf
   - Void Warg: Target dwarf with lowest HP, gets faster when wounded
   - AI should use all 3 actions intelligently

2. **Visual Polish**
   - Smooth unit sliding between squares (200ms transitions)
   - Attack animations (unit bumps toward target)
   - Dice roll visualization in corner
   - Hit/miss feedback (screen shake on crit, etc.)
   - Better unit art (still simple, but more than circles)

3. **Game Flow**
   - Victory screen when all enemies defeated
   - Defeat screen if all dwarves wounded/dead
   - "Restart Encounter" button
   - Track statistics: Rounds taken, damage dealt/received

4. **Quality of Life**
   - Hover over units to see stats
   - Preview path before confirming movement
   - Undo last move (optional)
   - Keyboard shortcuts (Space = end turn, etc.)
   - Sound effects for attacks, movement, abilities

5. **Debug/Testing Tools**
   - Damage unit button (for testing wounded states)
   - Skip to any turn
   - Enable/disable AI
   - Spawn additional enemies
   - God mode toggle

### Success Criteria
- Full encounter plays smoothly
- AI provides reasonable challenge
- Game feels responsive and polished
- Clear feedback for all actions
- Easy to test different scenarios

---

## Technical Notes

- Use Zustand for turn management and game state
- Canvas for grid rendering, HTML overlay for UI
- Keep all game constants easily tweakable (exported from constants.ts)
- Make dice rolls visible but fast (show for ~1 second)
- All animations should be skippable by clicking

## Testing Focus

After implementation, test these specific scenarios:
1. Do flanking bonuses make positioning interesting?
2. Is 3 actions too many/few?
3. Are abilities worth their action cost?
4. Does combat last 5-8 rounds as intended?
5. Do different team compositions feel different?

---

## Bonus Features (If Time Allows)

- Multiple test encounters
- Different victory conditions (survive X turns, reach exit, protect VIP)
- Environmental hazards (exploding barrels, void tiles)
- Elevation system (units on crates get +1 range)
- Deployment phase (choose starting positions)

Remember: This is a prototype! Keep it functional over pretty. The goal is to find out if the core tactical loop is fun.

*Forge and Void!*