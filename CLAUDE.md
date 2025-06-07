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



## Development Guidelines

When implementing new features:
1. Check `Project Documents/tactical-prototype-guide.md` for the implementation roadmap
2. Refer to `Project Documents/grudgekeeper-tactical-playtest.md` for game rules
3. Add new types to `src/game/types/index.ts`
4. Keep game constants in `src/game/constants/index.ts` for easy balancing
5. Use the existing Zustand patterns for state updates
6. Add JSDoc comments for new functions and complex logic
7. Test edge cases (enemy turns, unit death, ability targeting)