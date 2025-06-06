# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev      # Start Next.js development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run Next.js linting
```

## Development Notes
- dev server is already running in another terminal, you don't need to start it

## Architecture Overview

This is a tactical combat prototype for The Grudgekeeper, built with Next.js and TypeScript. The game implements a turn-based tactics system similar to Final Fantasy Tactics.

### Key Technologies
- **Next.js 15.3.3** with App Router
- **TypeScript** with strict mode
- **Zustand** for game state management (with Immer middleware)
- **Tailwind CSS** for styling
- **Canvas API** for game board rendering

### Project Structure
```
src/
├── app/                    # Next.js pages
│   └── game/page.tsx      # Main game page
├── game/                  # Core game logic
│   ├── components/        # React components (GameBoard, ActionBar, etc.)
│   ├── constants/         # Game configuration (stats, layout)
│   ├── store/            # Zustand store with game state
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions (grid, unit utilities)
└── styles/               # Global CSS
```

### Game State Architecture

The game uses a single Zustand store (`gameStore.ts`) that manages:
- **Units**: Array of all units (dwarves and enemies) with positions, stats, and states
- **Grid**: 8x8 grid with cell types (floor, wall, crate, door)
- **Turn Management**: Current unit, turn order, round tracking
- **Action System**: Selected action, valid moves/targets
- **Game Phase**: combat, victory, or defeat

Key state management patterns:
- Immer for immutable updates
- Computed values for valid moves/targets
- Action methods that modify state (moveUnit, attackUnit, endTurn)

### Component Hierarchy
```
GamePage
├── GameBoard (Canvas rendering of grid and units)
├── ActionBar (Player action buttons)
├── UnitStatsPanel (Current unit information)
├── TurnOrderPanel (Initiative order display)
└── VictoryScreen (End game state)
```

### Implementation Status

**Implemented (Phase 1):**
- 8x8 tactical grid with Canvas rendering
- Unit system with 4 dwarf classes and 3 enemy types
- Turn-based movement with range visualization
- Basic combat (attack rolls, damage)
- Action points system (3 per turn)
- Victory/defeat conditions

**Implemented (Phase 2 - Completed 12/6/2024):**
- Line of Sight system with visual indicators
- Cover system (crates provide -2 AC, walls provide -4 AC)
- Animated dice roll display showing attack resolution
- Range weapon visualization (circles showing max range)
- All special abilities:
  - Ironclad Shield Wall: Grants +2 AC to adjacent ally for 1 round
  - Delver Ore Scanner: Reveals 3x3 area through walls (range 4)
  - Brewmaster Combat Brew: Heals adjacent ally 2 HP
  - Engineer Deploy Turret: Places turret unit (3 HP, 10 AC, +2 attack, 1 damage, range 4)
- Floating damage numbers on hits
- Status effect indicators (blue ring for Shield Wall)
- Turret units that act on their own turn

**Bug Fixes & Improvements (12/6/2024):**
- Fixed screen flashing issues by optimizing canvas rendering
- Fixed dice roll positioning (now appears at 1/3 from top with backdrop)
- Improved layout with more compact UI elements
- Implemented basic enemy AI to prevent game from freezing on enemy turns
- Enemy AI behavior: moves toward nearest dwarf and attacks when in range
- Fixed cover system bug: removed incorrect "adjacent cover" calculation that was giving cover bonuses even with clear line of sight
- Cover now only applies when obstacles (crates) are directly in the line of fire between attacker and target

**Phase 3 - Not Yet Implemented:**
- Smooth movement animations (sliding between squares)
- Attack animations (unit bump toward target)
- Victory/defeat screens with statistics
- Sound effects
- Aim and Defend actions
- Wounded state at 0 HP (limited actions)
- Combat log
- Multiple encounters
- Keyboard shortcuts
- Advanced enemy AI (flanking, targeting priority, ability usage)

## Important Implementation Details

### Grid System
- Grid coordinates use (x, y) with (0, 0) at top-left
- Cell size is 64x64 pixels
- Movement uses Chebyshev distance (diagonals cost 1)
- Crates are difficult terrain (cost 2 movement)

### Combat Mechanics
- Attack roll: d20 + attackBonus vs target AC
- Critical hit on natural 20 or beating AC by 10+
- All damage values are fixed (no damage rolls)

### Turn Order
- Initiative: d20 + (speed / 5)
- Units act in descending initiative order
- Rounds increment when turn order wraps

## Code Organization & Best Practices

### State Management
- **Zustand Store**: All game state is centralized in `gameStore.ts`
- **Immer Middleware**: Enables direct state mutations for cleaner code
- **Action Methods**: All state changes go through store methods

### Performance Optimizations
- **Canvas Rendering**: Uses refs for animations to avoid React re-renders
- **Memoized Drawing**: Draw function only recalculates when necessary
- **Animation Loop**: Separate requestAnimationFrame loop for smooth animations

### Code Documentation
- All major functions and components have comprehensive JSDoc comments
- Complex algorithms (Bresenham's line, BFS pathfinding) are well-documented
- Type definitions include descriptions of their purpose

### Recent Improvements
- **Rendering Performance**: Fixed flashing by optimizing canvas dependency tracking
- **UI/UX**: More compact layout, better dice roll positioning
- **Game Flow**: Added enemy AI to prevent game freezing
- **Code Quality**: Added extensive comments throughout codebase

## Development Guidelines

When implementing new features:
1. Check `Project Documents/tactical-prototype-guide.md` for the implementation roadmap
2. Refer to `Project Documents/grudgekeeper-tactical-playtest.md` for game rules
3. Add new types to `src/game/types/index.ts`
4. Keep game constants in `src/game/constants/index.ts` for easy balancing
5. Use the existing Zustand patterns for state updates
6. Add JSDoc comments for new functions and complex logic
7. Test edge cases (enemy turns, unit death, ability targeting)