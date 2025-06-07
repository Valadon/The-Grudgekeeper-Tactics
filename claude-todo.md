# Claude Todo List - Tactical Design Implementation

This is a comprehensive, step-by-step task list for implementing the new tactical design system based on the grudgekeeper-tactical-design.md document.

## Phase 1: Core Stats & Class Rename
- [ ] Update Unit type in `src/game/types/index.ts` for new class names
- [ ] Update UnitClass enum to include Voidguard, AsteroidMiner, BrewmasterEngineer, StarRanger
- [ ] Update DWARF_STATS in `src/game/constants/index.ts` with new HP/AC/Speed values:
  - [ ] Voidguard: HP 10, AC 16, Speed 2
  - [ ] AsteroidMiner: HP 6, AC 14, Speed 4  
  - [ ] BrewmasterEngineer: HP 8, AC 15, Speed 3
  - [ ] StarRanger: HP 7, AC 14, Speed 3
- [ ] Update ENEMY_STATS with new enemy types:
  - [ ] GoblinScavenger: HP 3, AC 12, Speed 3
  - [ ] VoidHound: HP 5, AC 14, Speed 5
  - [ ] CorruptedMiningDrone: HP 8, AC 11, Speed 2
- [ ] Update UI labels in components to show new class names
- [ ] Update class colors and visual styling
- [ ] Test that all renamed classes spawn and display correctly

## Phase 2: Dice System Implementation
- [ ] Create dice rolling utility functions in `src/game/utils/`
  - [ ] rollDice(sides: number, count: number = 1): number[]
  - [ ] rollDamage(diceString: string): number (e.g., "1d6", "1d8")
  - [ ] formatDiceRoll(roll: number[], bonus: number): string
- [ ] Update weapon damage from fixed values to dice strings in constants
- [ ] Update damage calculations in gameStore.ts to use dice rolls
- [ ] Enhance DiceRoll component to show damage rolls (not just attack rolls)
- [ ] Update combat log to display damage roll details (e.g., "1d6: [4] = 4 damage")
- [ ] Add dice roll animation for damage calculations
- [ ] Test that all weapons use correct dice values

## Phase 3: New Action Types
- [ ] Add new ActionType values to enum in types/index.ts:
  - [ ] DROP_PRONE
  - [ ] RAISE_SHIELD
  - [ ] TAKE_COVER  
  - [ ] BRACE
  - [ ] RELOAD
  - [ ] STEP (1-tile movement)
  - [ ] STRIDE (full movement)
- [ ] Implement Drop Prone action in gameStore.ts
  - [ ] Add prone status to Unit type
  - [ ] Apply -2 to hit with ranged, +2 to hit with melee
- [ ] Implement Raise Shield action
  - [ ] Check if unit has shield equipment
  - [ ] Apply +2 AC until next turn
- [ ] Implement Take Cover action  
  - [ ] Check if adjacent to cover
  - [ ] Apply +1 AC until end of turn
- [ ] Implement Brace action
  - [ ] Add braced status to Unit type
  - [ ] Reduce knockback/forced movement effects
- [ ] Update ActionBar component to show new action buttons
- [ ] Add action validation for new action types
- [ ] Test all new actions work correctly

## Phase 4: Weapon & Ammo System
- [ ] Add ammo tracking to Unit type:
  - [ ] currentAmmo: number
  - [ ] maxAmmo: number
- [ ] Add weapon properties to constants:
  - [ ] ammoCapacity: number
  - [ ] range: number
  - [ ] damageType: string
  - [ ] special properties (splash, piercing, etc.)
- [ ] Implement reload action in gameStore.ts
  - [ ] Restore ammo to max capacity
  - [ ] Consume 1 action point
- [ ] Update attack logic to consume ammo
  - [ ] Prevent attacks when ammo is 0
  - [ ] Automatically show reload option when empty
- [ ] Add ammo counters to UnitStatsPanel
- [ ] Add visual ammo indicators on game board
- [ ] Update weapon stats for all classes:
  - [ ] Voidguard Plasma Hammer: Melee, no ammo
  - [ ] Miner Mining Laser: Range 3, 3 shots
  - [ ] Brewmaster Chem-Launcher: Range 4, splash damage
  - [ ] Ranger Mag-Rifle: Range 4, 6 shots
- [ ] Test ammo system with all weapon types

## Phase 5: Enhanced Combat Mechanics
- [ ] Implement splash damage for Chem-Launcher
  - [ ] Calculate adjacent squares to target
  - [ ] Apply 1 damage to each adjacent square
  - [ ] Update damage calculation to handle area effects
- [ ] Add knockback system
  - [ ] Implement pushUnit function in gameStore.ts
  - [ ] Add knockback validation (walls, other units)
  - [ ] Apply knockback to relevant abilities
- [ ] Implement line attacks (for Mining Drone beam)
  - [ ] Calculate line of tiles from attacker to target
  - [ ] Apply damage to all units in line
  - [ ] Show line attack visualization
- [ ] Add reaction system framework
  - [ ] Add reaction triggers to Unit type
  - [ ] Implement basic reaction resolution
  - [ ] Start with Void Anchor ability
- [ ] Update cover system to Half/Full types
  - [ ] Modify cover calculation in combat
  - [ ] Update visual indicators for cover types
- [ ] Test all enhanced combat mechanics

## Phase 6: Class Abilities Implementation

### Voidguard Abilities
- [ ] **Shield Wall** (1 action): Adjacent allies get +1 AC while shield raised
  - [ ] Check if shield is raised
  - [ ] Apply AC bonus to adjacent allies
  - [ ] Add visual indicator for affected allies
- [ ] **Graviton Slam** (2 actions): Strike all adjacent enemies, knock back 1 tile
  - [ ] Calculate all adjacent enemy positions
  - [ ] Apply attack roll to each enemy
  - [ ] Apply knockback to hit enemies
- [ ] **Void Anchor** (Reaction): Prevent ally forced movement
  - [ ] Add reaction trigger system
  - [ ] Detect when ally would be moved
  - [ ] Allow Voidguard to negate movement

### Asteroid Miner Abilities  
- [ ] **Precision Drilling** (2 actions): Ignore cover for next Strike
  - [ ] Add temporary status effect
  - [ ] Modify next attack to bypass cover
- [ ] **Ore Sense** (1 action): Reveal 3x3 area through walls
  - [ ] Implement area revelation system
  - [ ] Update fog of war/visibility
- [ ] **Tunnel** (3 actions): Create passage through destructible wall
  - [ ] Check if target is destructible wall
  - [ ] Convert wall tile to floor tile
  - [ ] Update pathfinding after wall destruction

### Brewmaster Engineer Abilities
- [ ] **Combat Brew** (2 actions): Adjacent ally heals 1d6 OR gains +2 damage
  - [ ] Present choice UI to player
  - [ ] Apply healing or damage buff
  - [ ] Add visual indicator for damage buff
- [ ] **Volatile Mix** (1 action): Next shot creates 2x2 difficult terrain
  - [ ] Add temporary status to unit
  - [ ] Modify next Chem-Launcher attack
  - [ ] Create difficult terrain tiles on impact
- [ ] **"It's Medicinal!"** (3 actions): All allies within 3 tiles heal 1d4
  - [ ] Calculate allies within range
  - [ ] Apply healing to each valid target
  - [ ] Show healing animation/feedback

### Star Ranger Abilities
- [ ] **Overwatch** (2 actions): Reaction shot when enemy enters cone
  - [ ] Define cone area and visualize
  - [ ] Set up reaction trigger
  - [ ] Execute attack when triggered
- [ ] **Called Shot** (2 actions): Target specific body part for effect
  - [ ] Add targeting UI for body parts
  - [ ] Implement different effects (slow, blind, etc.)
- [ ] **Rail Shot** (3 actions): Piercing shot through multiple enemies
  - [ ] Calculate line from shooter through targets
  - [ ] Apply damage to all enemies in line
  - [ ] Show piercing effect visualization

## Phase 7: Terrain Features
- [ ] Add destructible walls with HP to grid system
  - [ ] Add wallHP property to GridCell type
  - [ ] Implement wall damage system
  - [ ] Update visual rendering for damaged walls
- [ ] Implement elevated platforms
  - [ ] Add elevation property to GridCell
  - [ ] Apply +2 damage from height advantage
  - [ ] Update movement validation for elevation changes
- [ ] Add explosive barrels
  - [ ] New terrain type with HP
  - [ ] 2d6 damage in 2x2 area when destroyed
  - [ ] Chain explosion possibility
- [ ] Create mineral deposits
  - [ ] Special terrain for resource objectives
  - [ ] Defend for 3 turns mechanics
  - [ ] Progress tracking UI
- [ ] Update pathfinding algorithm for new terrain types
- [ ] Test all terrain interactions

## Phase 8: Map Size Flexibility
- [ ] Update grid initialization in gameStore.ts for variable sizes
  - [ ] Add gridWidth and gridHeight to game state
  - [ ] Modify initializeGrid function for dynamic sizing
- [ ] Update Canvas rendering in GameBoard component
  - [ ] Calculate canvas size based on grid dimensions
  - [ ] Adjust cell size if needed for larger maps
- [ ] Add map size selection to game initialization
  - [ ] Add UI controls for map size
  - [ ] Preset sizes: 8x8, 10x10, 12x12
- [ ] Update camera/viewport system for larger maps
  - [ ] Implement panning for maps larger than screen
  - [ ] Add minimap for large map navigation
- [ ] Update all position calculations to use dynamic grid size
- [ ] Test with various map sizes

## Phase 9: Advanced Features
- [ ] Implement turn limit warnings
  - [ ] Add turn counter to game state
  - [ ] Show warnings at turns 10, 13, 15
  - [ ] Add "ship getting impatient" flavor text
- [ ] Add temporary action system
  - [ ] Actions that can be taken out of normal turn order
  - [ ] Reaction timing and priority
- [ ] Update status effect duration logic
  - [ ] Add turn-based duration tracking
  - [ ] Automatic cleanup of expired effects
- [ ] Enhance enemy AI behaviors
  - [ ] Goblin Scavenger: Move to cover, shoot closest dwarf
  - [ ] Void Hound: Target isolated dwarves, flanking
  - [ ] Mining Drone: Stay at max range, target lowest HP
  - [ ] Add AI difficulty levels

## Phase 10: Combat Log Visual Enhancement
- [ ] Add color-coded text for different message types (hits in green, misses in red, etc.)
- [ ] Implement dice roll highlighting (natural 20s in gold, critical fails in dark red)
- [ ] Add icons for different action types (⚔️ for attacks, 🛡️ for defense, etc.)
- [ ] Create visual separators between rounds
- [ ] Highlight damage numbers in bold with color based on severity
- [ ] Add roll breakdown formatting (e.g., "1d20+3" shows as distinct colored parts)
- [ ] Implement alternating background colors for readability
- [ ] Add animation for new entries (subtle fade-in)
- [ ] Create collapsible sections for verbose actions
- [ ] Add filters to show/hide certain message types
- [ ] Implement scroll-to-bottom with smooth animation
- [ ] Add timestamp or turn counter for each entry
- [ ] Create hover effects for detailed information
- [ ] Style critical hits with special effects (glow, larger text)
- [ ] Add sound effect indicators for actions that will have audio

## Phase 11: UI/UX Polish
- [ ] Add action cost indicators to all buttons
  - [ ] Show cost as (1), (2), or (3) on buttons
  - [ ] Dim buttons when not enough actions remain
- [ ] Implement diamond action display (◆◆◇)
  - [ ] Replace current action counter with diamonds
  - [ ] Filled diamonds for available actions
  - [ ] Empty diamonds for used actions
- [ ] Enhanced status indicators
  - [ ] Prone status icon
  - [ ] Shield raised indicator
  - [ ] Braced status icon
  - [ ] Cover bonus indicators
- [ ] Cover visualization improvements
  - [ ] Different colors for half vs full cover
  - [ ] Clearer cover direction indicators
  - [ ] Cover preview when moving
- [ ] Add floating damage numbers with dice details
  - [ ] Show both dice roll and final damage
  - [ ] Different colors for different damage types
- [ ] Improve turn order panel
  - [ ] Show upcoming turns more clearly
  - [ ] Highlight current unit
  - [ ] Show action points remaining for each unit

## Testing & Validation
- [ ] Create test scenarios for each major feature
- [ ] Validate all class abilities work as designed
- [ ] Test edge cases (unit death, ability interactions)
- [ ] Performance testing with larger maps
- [ ] UI/UX testing for clarity and usability
- [ ] Balance testing for combat encounters
- [ ] Integration testing for all systems working together

## Documentation Updates
- [ ] Update CLAUDE.md with new implementation status
- [ ] Document new type definitions and interfaces
- [ ] Add comments for complex algorithms and systems
- [ ] Update project status in README (if it exists)

---

**Notes:**
- Each checkbox represents a discrete, testable task
- Tasks are ordered roughly by dependency (earlier phases needed for later ones)
- Some tasks within phases can be done in parallel
- Test thoroughly after each phase before moving to the next
- Keep the existing working game functional during development