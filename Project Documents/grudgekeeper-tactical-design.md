# The Grudgekeeper - Tactical Combat Design v1.0
## Space Dwarf Tactical Prototype

---

## Core Combat Parameters

### Grid & Scale
- **Grid Size**: 8x8 for initial testing (expand to 10x10 or 12x12 later)
- **Tile Display**: 32x32 pixels per tile (scales nicely)
- **Camera**: Fixed overhead view, no rotation needed
- **Turn Order**: 1d20 + speed

### Time Targets
- **Encounter Duration**: Aiming for 5-10 minutes maximum, but tracking turns not mins
- **Turn Limit**: Soft limit at 15 turns (ship gets impatient)
- **Decision Time**: No hard timer, but visual/audio pressure cues

---

## The 3-Action Economy

Each dwarf gets **3 actions per turn**. Period. Simple, clean, tactical.

### Basic Actions (1 Action Each)

**Movement Actions**
- **Stride**: Move up to Speed value (usually 3 tiles)
- **Step**: Move 1 tile (doesn't trigger reactions)
- **Drop Prone**: -2 to hit you with ranged, +2 to hit with melee

**Combat Actions**
- **Strike**: Make one attack with equipped weapon
- **Reload**: Required for some weapons after X shots
- **Aim**: +2 to next Strike this turn

**Defensive Actions**
- **Raise Shield**: +2 AC until next turn (shields only)
- **Take Cover**: +1 AC if adjacent to cover
- **Brace**: Reduce knockback/forced movement

### Complex Actions (2-3 Actions)

**2-Action Abilities**
- **Suppressing Fire**: Create 3-tile cone of difficult terrain
- **Power Shot**: Strike with +1d6 damage
- **Shield Bash**: Strike + knock back 1 tile
- **Combat Medicine**: Heal adjacent ally 1d4 HP

**3-Action Abilities**
- **Plasma Overcharge**: Next shot deals double damage
- **Deploy Turret**: Place automated turret (Engineers only) Turret has 1 hp, and 3 ammo, when ammo is depleted it disapears. It has 1 action per turn
- **Defensive Formation**: All adjacent allies get +2 AC for 1 round
- **"For the Forge!"**: Rally cry - all dwarves get +1 action next turn (1/combat)

---

## Space Dwarf Classes (Initial Four)

### 1. VOIDGUARD (Tank)
**Stats**: HP 10 | AC 16 | Speed 2
**Weapon**: Plasma Hammer (Melee, 1d8 damage)
**Special Gear**: Energy Shield (+2 AC when raised)

**Unique Abilities**:
- **Shield Wall** (1 action): While shield raised, adjacent allies get +1 AC
- **Graviton Slam** (2 actions): Strike all adjacent enemies, knock back 1 tile
- **Void Anchor** (Reaction): When ally would be moved, prevent it

**Role**: Hold the line, protect squishier dwarves

### 2. ASTEROID MINER (DPS/Scout)
**Stats**: HP 6 | AC 14 | Speed 4
**Weapon**: Mining Laser (Range 3, 1d6 damage, 3 shots before reload)
**Special Gear**: Ore Scanner (see through 1 wall thickness)

**Unique Abilities**:
- **Precision Drilling** (2 actions): Ignore cover for next Strike
- **Ore Sense** (1 action): Reveal 3x3 area through walls
- **Tunnel** (3 actions): Create 1-tile passage through destructible wall

**Role**: Flanking, scouting, opening new routes

### 3. BREWMASTER ENGINEER (Support)
**Stats**: HP 8 | AC 15 | Speed 3
**Weapon**: Chem-Launcher (Range 4, 1d4 damage + 1dmg splash in each adjacent square to target, and to target)
**Special Gear**: Portable Still (craft mid-combat!)

**Unique Abilities**:
- **Combat Brew** (2 actions): Adjacent ally heals 1d6 or gains +2 damage next turn
- **Volatile Mix** (1 action): Next Chem-Launcher shot creates 2x2 difficult terrain
- **"It's Medicinal!"** (3 actions): All allies within 3 tiles heal 1d4

**Role**: Healing, buffs, area control

### 4. STAR RANGER (Ranged DPS)
**Stats**: HP 7 | AC 14 | Speed 3
**Weapon**: Mag-Rifle (Range 4, 1d6+1 damage, 6 shots)
**Special Gear**: Targeting Visor (+1 to hit)

**Unique Abilities**:
- **Overwatch** (2 actions): Reaction shot when enemy enters cone
- **Called Shot** (2 actions): Target specific body part for effect
- **Rail Shot** (3 actions): Piercing shot through multiple enemies

**Role**: Consistent damage, area denial

---

## Enemy Types (Start Simple)

### Goblin Scavenger (Fodder)
**Stats**: HP 3 | AC 12 | Speed 3
**Weapon**: Scrap Pistol (Range 3, 1d4)
**AI**: Move toward cover, shoot closest dwarf
**Special**: Drops random ammo on death

### Void Hound (Flanker)
**Stats**: HP 5 | AC 14 | Speed 5
**Weapon**: Energy Bite (Melee, 1d6)
**AI**: Target isolated dwarves, flank when possible
**Special**: Gets +2 damage vs isolated targets

### Corrupted Mining Drone (Artillery)
**Stats**: HP 8 | AC 11 | Speed 2
**Weapon**: Mining Beam (Range 4, 1d8, 1 shot/turn)
**AI**: Stay at max range, target lowest HP
**Special**: Beam damages all in line

---

## Terrain Features

### Basic Terrain
- **Open Floor**: No effect
- **Difficult Terrain**: Costs 2 movement per tile
- **Walls**: Block movement and line of sight
- **Destructible Walls**: 5 HP, can be destroyed

### Cover Types
- **Half Cover** (crates, low walls): +1 AC
- **Full Cover** (pillars, corners): +2 AC
- **Destructible Cover**: Has HP, can be destroyed

### Special Features (1-2 per map)
- **Elevated Platform**: +2 damage from height advantage
- **Chokepoint**: 1-tile passage perfect for Shield Wall
- **Explosive Barrels**: 2d6 damage in 2x2 area when shot
- **Mineral Deposit**: Defend for 3 turns for bonus resources

---

## Combat Flow Example

**Turn 1 - Dwarves**
- Voidguard: Stride (3 tiles) + Raise Shield + Shield Wall
- Miner: Stride (4 tiles) + Aim + Strike goblin
- Brewmaster: Stride (3 tiles) + Combat Brew on Voidguard
- Ranger: Stride (3 tiles) + Overwatch cone

**Turn 1 - Enemies**
- Goblins move to cover and shoot
- Void Hound rushes toward isolated Ranger
- Mining Drone charges beam

**Ship Commentary**: "Oh look, the miner actually hit something. Mark your calendars."

---

## Map Objectives (Pick One Per Encounter)

1. **Extermination**: Eliminate all hostiles (basic)
2. **Defend the Drill**: Protect objective for 8 turns
3. **Resource Extraction**: Reach and hold 3 mineral nodes
4. **Breach and Clear**: Get one dwarf to exit point
5. **Boss Takedown**: Defeat elite enemy + minions

---

## UI Requirements

### Action Display
- Show remaining actions as filled/empty diamonds (◆◆◇)
- Highlight valid move tiles when action selected
- Show action cost on ability buttons
- Turn order display on side

### Combat Feedback
- Floating damage numbers (big and chunky)
- Hit/miss indicators
- Status effect icons
- Cover indicators on tiles

### Ship Mood Integration
- Portrait shows current mood
- Comments appear in speech bubble
- Mood affects available ship abilities

---

## Progression Hooks (For Full Game)

After each combat:
- **Salvage**: Collect scrap from battlefield
- **Grudge Points**: Based on performance
- **Ship Approval**: Affects next encounter difficulty
- **Unlock Tokens**: For new abilities/equipment

---

## Key Design Principles

1. **Every Action Matters**: 3 actions means 3 meaningful choices
2. **Positioning > Damage**: Good positioning should trump raw DPS
3. **No Perfect Strategies**: Multiple valid approaches to each encounter
4. **Quick Resolution**: If it takes >10 minutes, it's too long
5. **Personality Throughout**: Ship comments on tactics, mocks failures

---

## Test Scenarios

### Scenario 1: "Cargo Bay Ambush"
- 4 Goblin Scavengers, 1 Void Hound
- Crates provide cover throughout
- Objective: Eliminate all enemies
- Ship Mood: Grumpy ("Try not to bleed on my cargo")

### Scenario 2: "Mining Platform Defense"
- 2 Goblins, 1 Mining Drone, waves of 2 more goblins
- Central elevated platform
- Objective: Hold platform for 8 turns
- Ship Mood: Skeptical ("This seems like a terrible idea")

### Scenario 3: "Breach the Vault"
- 1 Elite Goblin Captain, 3 Scavengers
- Multiple rooms with doors
- Objective: Reach vault in 10 turns
- Ship Mood: Excited ("Finally, something worth stealing!")

---

## Implementation Priority

1. **Core Loop**: Movement + basic attacks
2. **Cover System**: Critical for tactical play
3. **3-Action UI**: Must be crystal clear
4. **Two Classes**: Voidguard + Ranger (tank + DPS)
5. **One Enemy Type**: Goblin Scavenger
6. **One Map**: 8x8 with some cover

Get this working first, then layer in complexity!

---

## Balance Notes

- **Hit Chance**: Base 75%, modified by cover/abilities
- **Damage**: Should down fodder in 2 hits, tanks in 4-5
- **Healing**: Limited - maybe 2-3 heals per combat max
- **Movement**: Should cross map in 3 turns if unobstructed
- **Ammo**: Some weapons need reload for tactical pressure

Remember: We're not making XCOM. We're making "Grumpy Space Dwarves Shoot Things While Their Ship Insults Them."

*Forge and Void!* ⚔️🚀