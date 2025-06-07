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
- **IMPORTANT**: Always check `claude-todo.md` for the current implementation status and task list
- **IMPORTANT**: Mark completed tasks as [x] in `claude-todo.md` and add new tasks as needed
- **CONTEXT7 MCP SERVER**: Use the context7 MCP server for up-to-date documentation when working with libraries:
  - Next.js: `/vercel/next.js` (excellent App Router docs, 4479 code snippets)
  - Tailwind CSS: `/tailwindlabs/tailwindcss.com` (comprehensive config & usage, 2078 snippets) 
  - Zustand: `/pmndrs/zustand` (complete state management guide, 408 snippets including Immer middleware)
  - Access via `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`

## Project Overview

This is **The Grudgekeeper Tactics** - a tactical combat prototype that serves as the foundation for a larger space dwarf colony ship management roguelike. While the full game design includes ship management and dungeon crawling (see GDD), we're currently focused on developing a polished turn-based tactics system.

**Current Focus**: Tactical combat system (similar to Final Fantasy Tactics)
**Future Vision**: Full roguelike with ship management, expeditions, and persistent progression

## Architecture Overview

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
- **Action System**: 3-action economy with various tactical actions
- **Game Phase**: combat, victory, or defeat

Key state management patterns:
- Immer for immutable updates
- Computed values for valid moves/targets
- Action methods that modify state (moveUnit, attackUnit, endTurn)

### Component Hierarchy
```
GamePage
├── GameBoard (Canvas rendering of grid and units)
├── ActionBar (Player action buttons with 3-action economy)
├── UnitStatsPanel (Current unit information)
├── TurnOrderPanel (Initiative order display)
├── CombatLog (Detailed action history)
└── VictoryScreen (End game state)
```

## Current Implementation Status

**Completed Phases (1-3):**
- ✅ Phase 1: Core Stats & Class Rename (Voidguard, AsteroidMiner, BrewmasterEngineer, StarRanger)
- ✅ Phase 2: Dice System Implementation (full dice notation, damage rolling)
- ✅ Phase 3: New Action Types (Step/Stride movement, tactical actions like Drop Prone, Take Cover, etc.)

**Next Phase (4):**
- 🔄 Phase 4: Weapon & Ammo System

See `claude-todo.md` for detailed task breakdown and current priorities.

## Development Guidelines

When implementing new features:
1. **Always check `claude-todo.md`** for current implementation status and task list
2. **Mark completed tasks** as [x] in `claude-todo.md` and add new tasks as needed
3. Refer to `Project Documents/grudgekeeper-tactical-design.md` for game rules and balance
4. Check `Project Documents/grudgekeeper-tech-stack.md` for technical implementation details
5. Reference `Project Documents/grudgekeeper-graphics-tech-doc.md` for future visual enhancement plans
6. Add new types to `src/game/types/index.ts`
7. Keep game constants in `src/game/constants/index.ts` for easy balancing
8. Use the existing Zustand patterns for state updates
9. Add JSDoc comments for new functions and complex logic
10. **COMPREHENSIVE TESTING REQUIRED** - Do not skip testing for any feature

## Testing Requirements

**Testing is mandatory for all new features and changes.** Use the full range of testing tools available:

### Manual Testing
- Test all new actions and abilities thoroughly
- Verify edge cases (unit death, invalid moves, boundary conditions)
- Test AI behavior and turn transitions
- Validate UI interactions and visual feedback

### Automated Testing
- Use **Puppeteer** for end-to-end game flow testing
- Test critical game mechanics with browser automation
- Verify game state consistency across actions
- Test for regression in existing functionality

### Testing Best Practices
- **Test early and often** - Don't wait until feature completion
- **Cover edge cases** - What happens when units die mid-action? Invalid positions? 
- **Test the complete flow** - From action selection through execution to state cleanup
- **Verify visual feedback** - Ensure UI updates correctly reflect game state
- **Test enemy AI** - Verify AI makes valid moves and doesn't break game state
- **Cross-browser testing** - Use Puppeteer to test in different browser configurations

### Example Testing Scenarios
```javascript
// Test new tactical action
1. Select unit with available actions
2. Click tactical action button (e.g., "Drop Prone")
3. Verify action executes correctly
4. Check status effect is applied
5. Verify action cost is deducted
6. Ensure UI updates appropriately
7. Test that effect persists/expires correctly
```

**Remember**: A feature is not complete until it's fully tested. Quality over speed.

## Project Documents Reference

- `grudgekeeper-tactical-design.md` - Core combat mechanics, classes, and balance
- `grudgekeeper-tech-stack.md` - Technical implementation details and architecture
- `grudgekeeper-graphics-tech-doc.md` - Visual enhancement roadmap (ASCII → sprites)
- `space-dwarf-gdd.md` - Full game design document (future vision)

**Note**: We're building the tactical combat foundation first. The full roguelike features (ship management, expeditions, AI personality) will be implemented later based on the GDD.