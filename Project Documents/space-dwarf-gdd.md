# The Grudgekeeper
## Game Design Document v1.0

*A Space Dwarf Colony Ship Management Roguelike*

---

## Executive Summary

**The Grudgekeeper** is a roguelike dungeon crawler with persistent progression, featuring space dwarves managing a living bio-mechanical ship while exploring dangerous locations for resources. The game combines tactical dungeon exploration with strategic ship management, wrapped in a humorous narrative about the universe's grumpiest symbiotic relationship.

**Core Pillars:**
- Meaningful death through persistent grudge mechanics
- Tactical dungeon crawling with resource extraction
- Humorous personality-driven ship management
- Deep progression systems across multiple layers

**Target Platform:** Web (Next.js + Supabase)  
**Target Audience:** Fans of FTL, Deep Rock Galactic, and Kingdom Death: Monster  
**Estimated Playtime:** 30-60 minute runs with hundreds of hours of progression

---

## Core Gameplay Loop

### Primary Loop (30-60 minutes)
1. **Preparation Phase** - Select crew, equipment, and destination
2. **Expedition Phase** - Explore procedurally generated dungeons
3. **Extraction/Death** - Return with resources or die gloriously
4. **Settlement Phase** - Upgrade ship, unlock abilities, manage grudges
5. **Progression** - Spend points on skill trees, discover new content

### Secondary Loops
- **Run Loop** (5-10 expeditions): Build toward specific ship upgrades
- **Prestige Loop** (10+ successful expeditions): Reset for deeper content
- **Discovery Loop** (ongoing): Find artifacts, blueprints, and lore

---

## The Grudgekeeper (Living Ship)

### Personality System
The ship is an ancient dwarven bio-mechanical vessel with strong opinions about everything. Its mood affects all gameplay systems.

**Mood States:**
- **Cooperative** (Rare) - Bonus resources, helpful mutations
- **Grumpy** (Default) - Normal operations with occasional complaints
- **Grudging** - Reduced efficiency, passive-aggressive behavior
- **Furious** - Active hindrance, but powerful rage bonuses

**Mood Influences:**
- Feeding quality minerals (+)
- Successful expeditions (+)
- Crew deaths (- initially, but adds Grudge Power)
- Time without proper ale (-)
- Discovering ship history (+)

### Ship Organs

Each organ serves a gameplay function and has personality quirks:

1. **The Heart Forge**
   - Function: Crafting and equipment upgrades
   - Personality: Perfectionist, hates rushed work
   - Upgrade path: Speed → Quality → Exotic crafting

2. **The Neural Ale-Gardens**
   - Function: Brewing and consumable creation
   - Personality: Experimental, occasionally drunk
   - Upgrade path: Capacity → Potency → Weird effects

3. **The Grudge Cortex**
   - Function: Stores and processes all grudges
   - Personality: Never forgets, catalogues everything
   - Upgrade path: Memory → Processing → Weaponization

4. **The Digestive Arrays**
   - Function: Processes minerals into resources
   - Personality: Extremely picky eater
   - Upgrade path: Efficiency → Variety → Transmutation

5. **The Sensory Polyps**
   - Function: Navigation and scanning
   - Personality: Paranoid, sees threats everywhere
   - Upgrade path: Range → Detail → Precognition

---

## Character Classes

### Base Classes (Available at Start)

**1. Ironclad**
- Role: Tank/Defender
- Unique Mechanic: Grudge Shield (absorbs damage, releases as AoE)
- Signature Ability: "Ancestral Stubbornness" - Cannot be moved/stunned

**2. Delver**
- Role: Scout/Resource Specialist  
- Unique Mechanic: Ore Sense (sees through walls briefly)
- Signature Ability: "Deep Strike" - Creates shortcuts for team

**3. Brewmaster**
- Role: Support/Buffer
- Unique Mechanic: Combat Brewing (mix potions mid-fight)
- Signature Ability: "Liquid Courage" - Team-wide buff/heal

**4. Engineer**
- Role: Utility/Damage
- Unique Mechanic: Deployable turrets/explosives
- Signature Ability: "Percussive Maintenance" - Fix or break anything

### Unlockable Classes

**5. Voidwright** (Find in Void Hulk)
- Role: Psionic Damage/Control
- Unique Mechanic: Grudge-powered psychic abilities
- Unlock: Survive a void exposure event

**6. Grudgekeeper** (Ship Trust Level 5)
- Role: Ship Synergy Specialist
- Unique Mechanic: Channel ship organs as abilities
- Unlock: Resolve 10 ancient grudges

**7. Runesmith** (Discover 3 Artifacts)
- Role: Magic Item Enhancer
- Unique Mechanic: Modify equipment properties
- Unlock: Collection requirement

**8. Berserker** (Prestige 1)
- Role: Risk/Reward Damage
- Unique Mechanic: Power increases as health decreases
- Unlock: Complete first prestige

---

## Expedition Mechanics

### Team Composition
- 4 Active Dwarves (expandable to 5)
- 2-8 Reserve Dwarves on ship
- Shared equipment pool
- Instant replacement on death (with expedition bonuses intact)

### Expedition Power Scaling

**Expedition Rank** (0-10 per run)
- Gained by: Clearing rooms, completing objectives, finding secrets
- Benefits: 
  - +10% health/damage per rank (all dwarves)
  - Unlock equipment tier access
  - Ship cooperation bonuses

**Momentum Systems:**
- **Grudge Momentum**: Each death adds permanent bonuses
- **Knowledge Momentum**: Discovered enemy patterns benefit all
- **Equipment Momentum**: Better gear drops as rank increases

### Location Types

**1. Asteroids**
- Focus: Mining and environmental hazards
- Unique Mechanic: Ore veins and cave-ins
- Rewards: Minerals, crafting materials

**2. Derelict Ships**
- Focus: Combat and technical challenges
- Unique Mechanic: System hacking, atmospheric dangers
- Rewards: Technology, equipment

**3. Space Hulks**
- Focus: Multi-level exploration
- Unique Mechanic: Reality distortion, void exposure
- Rewards: Artifacts, void crystals

**4. Planetary Surfaces**
- Focus: Mixed challenges
- Unique Mechanic: Day/night cycles, weather
- Rewards: Biological samples, unique minerals

---

## Progression Systems

### 1. Run Progression (Temporary)
- Expedition Rank
- Equipment found
- Consumables crafted
- Temporary ship mood buffs

### 2. Meta Progression (Permanent)

**Grudge Points** (Main Currency)
- Earned from: Deaths, discoveries, milestones
- Spent on: Skill trees, ship upgrades

**Skill Trees:**

**A. Universal Trees** (All classes benefit)
- Ship Symbiosis
- Mining Mastery  
- Combat Doctrine
- Brewing & Alchemy

**B. Class-Specific Trees** (Only when playing that class)
- 15-20 nodes per class
- Mix of passive and active abilities
- Ultimate ability at tree completion

### 3. Discovery Progression
- Artifacts (permanent powerful items)
- Blueprints (new ship organs)
- Ancient Grudges (ship history = bonuses)
- Recipes (new consumables)

### 4. Prestige System ("The Great Delving")

**Requirements:** 10 successful expeditions

**Reset:**
- Expedition progress
- Some ship upgrades
- Mineral stockpiles

**Keep:**
- Core class unlocks
- Artifacts found
- Ancient grudges
- Class skill progress

**Unlock:**
- Deep Grudge mechanics
- Void crystal currency
- Core Worlds access
- Nightmare difficulty modifiers

---

## Technical Implementation

### LLM Integration (Claude 3 Haiku)

**Primary Uses:**
1. **Ship Personality Responses**
   - React to player actions
   - Contextual complaints/praise
   - Grudge descriptions

2. **Procedural Flavor Text**
   - Room descriptions
   - Item lore
   - Death eulogies

3. **Dynamic Events**
   - Expedition complications  
   - Inter-dwarf dialogue
   - Discovery narratives

**Implementation Strategy:**
- Cache common responses
- Use templates with variable insertion
- Limit to 2-3 sentences per generation
- Fallback to pre-written content if API fails

### Database Structure (Supabase)

**Core Tables:**
- `players` - Account management
- `runs` - Active expedition data
- `ship_state` - Persistent ship upgrades/mood
- `grudges` - All accumulated grudges
- `unlocks` - Player progression/discoveries
- `expedition_log` - For analytics/balancing

### State Management
- Client-side for active gameplay
- Server validation for progression
- Async saves every room completion
- Full state backup on expedition end

---

## Content Scope (MVP)

### Launch Content
- 4 Base classes
- 3 Location types (Asteroid, Derelict, Hulk)
- 5 Ship organs
- 50+ Equipment items
- 30+ Consumables
- 20+ Enemy types
- 100+ Grudges to discover

### Post-Launch Roadmap
1. **Phase 1**: Planetary exploration + 2 new classes
2. **Phase 2**: Prestige system + Core Worlds
3. **Phase 3**: Challenge modes + Leaderboards
4. **Phase 4**: Ship customization + Visual upgrades

---

## Monetization (Optional Future)

- **Cosmetic Ship Skins** - "Less Ugly" pack
- **Dwarf Customization** - Beards, armor appearance
- **QoL Features** - Multiple save slots, statistics tracking
- **Supporter Pack** - Name in credits, exclusive grudge

*Note: Core game remains fully playable without purchases*

---

## Balancing Philosophy

"Easy to learn, impossible to master, fun to fail"

- Deaths should feel like player mistakes, not RNG
- Each run should offer meaningful choices
- Power progression should feel earned
- Humor softens failure frustration
- Always provide multiple viable strategies

---

## Summary

The Grudgekeeper combines the best of roguelike progression, dungeon crawling tactics, and management strategy into a unique package. The living ship provides personality and narrative cohesion, while the dwarf expeditions deliver moment-to-moment excitement. With multiple progression layers and a humorous tone, the game offers both immediate fun and long-term goals.

*Rock and Stone!*