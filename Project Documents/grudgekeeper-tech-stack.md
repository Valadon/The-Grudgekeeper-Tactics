# The Grudgekeeper - Technical Stack Documentation
## Version 1.0 - May 25, 2025

---

## Overview

This document outlines the complete technical stack and architecture for The Grudgekeeper, a web-based roguelike dungeon crawler. The stack is optimized for rapid development, excellent developer experience, and the specific needs of a real-time game with persistent progression.

---

## Core Technology Stack

### Frontend Framework
**Next.js 14+ (App Router)**
- Server/client separation for secure game logic
- Built-in API routes for game endpoints
- Excellent performance with React Server Components
- SEO benefits for game landing pages

### Language
**TypeScript**
- Type safety for complex game systems
- Better IDE support and autocomplete
- Self-documenting code
- Catches bugs at compile time

### Database & Backend
**Supabase**
- PostgreSQL for complex game data
- Real-time subscriptions for multiplayer features (future)
- Built-in authentication
- Row-level security for player data
- Edge functions for server-side game logic

### Styling
**Tailwind CSS + CSS Modules**
- Tailwind for rapid UI development
- CSS Modules for game-specific styles (ASCII grid, animations)
- PostCSS for advanced features

### Deployment
**Vercel**
- Zero-config deployment
- Edge functions for low latency
- Automatic preview deployments
- Built-in analytics

### AI Integration
**Anthropic Claude SDK**
- Claude 3 Haiku for ship personality
- Narrative generation
- Dynamic event creation

---

## Game-Specific Dependencies

### State Management
```json
{
  "zustand": "^4.5.0",     // Lightweight state management
  "immer": "^10.0.0"       // Immutable state updates
}
```

### Graphics & Rendering
```json
{
  "pixi.js": "^8.0.0"      // 2D WebGL renderer with Canvas fallback
}
```

### Audio
```json
{
  "howler": "^2.2.0"       // Cross-browser audio support
}
```

### Utilities
```json
{
  "nanoid": "^5.0.0",      // Unique ID generation
  "lodash": "^4.17.0",     // Utility functions
  "date-fns": "^3.0.0"     // Date manipulation
}
```

### Development Tools
```json
{
  "@faker-js/faker": "^8.4.0",    // Test data generation
  "vitest": "^1.3.0",             // Unit testing
  "@testing-library/react": "^14.0.0"  // Component testing
}
```

---

## Project Structure

```
the-grudgekeeper/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── game/                 # Game routes
│   │   │   ├── page.tsx         # Main game view
│   │   │   ├── expedition/      # Active expedition
│   │   │   └── ship/            # Ship management
│   │   ├── api/                  # API routes
│   │   │   ├── game/            # Game state endpoints
│   │   │   │   ├── save/
│   │   │   │   ├── load/
│   │   │   │   └── expedition/
│   │   │   ├── ai/              # Claude integration
│   │   │   │   └── ship-response/
│   │   │   └── auth/            # Supabase auth helpers
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   │
│   ├── game/                     # Core game logic
│   │   ├── engine/              # Game engine
│   │   │   ├── GameLoop.ts     # Main game loop
│   │   │   ├── InputHandler.ts # Input management
│   │   │   └── Renderer.ts     # Rendering logic
│   │   ├── systems/             # Game systems
│   │   │   ├── combat/
│   │   │   ├── movement/
│   │   │   ├── inventory/
│   │   │   └── progression/
│   │   ├── entities/            # Game entities
│   │   │   ├── Dwarf.ts
│   │   │   ├── Enemy.ts
│   │   │   ├── Item.ts
│   │   │   └── Mineral.ts
│   │   ├── dungeons/            # Dungeon generation
│   │   │   ├── Generator.ts
│   │   │   ├── Room.ts
│   │   │   └── templates/
│   │   ├── ship/                # Ship systems
│   │   │   ├── Personality.ts
│   │   │   ├── Mood.ts
│   │   │   ├── Organs.ts
│   │   │   └── Grudges.ts
│   │   └── constants/           # Game constants
│   │       ├── balance.ts
│   │       └── ascii.ts
│   │
│   ├── components/              # React components
│   │   ├── game/               # Game UI components
│   │   │   ├── DungeonView.tsx
│   │   │   ├── DwarfPanel.tsx
│   │   │   ├── ShipPanel.tsx
│   │   │   └── ExpeditionBar.tsx
│   │   ├── ui/                 # Shared UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Tooltip.tsx
│   │   └── providers/          # Context providers
│   │       ├── GameProvider.tsx
│   │       └── AudioProvider.tsx
│   │
│   ├── lib/                    # Utilities & integrations
│   │   ├── supabase/          # Database
│   │   │   ├── client.ts
│   │   │   ├── queries/
│   │   │   └── mutations/
│   │   ├── ai/                # Claude integration
│   │   │   ├── client.ts
│   │   │   └── prompts.ts
│   │   ├── utils/             # Helper functions
│   │   └── hooks/             # Custom React hooks
│   │
│   ├── styles/                # Global styles
│   │   ├── globals.css
│   │   └── game.module.css
│   │
│   └── types/                 # TypeScript types
│       ├── game.ts
│       ├── database.ts
│       └── api.ts
│
├── public/
│   ├── fonts/                # Web fonts
│   ├── sounds/              # Audio files
│   └── images/              # Static images
│
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── config files...
```

---

## Configuration Files

### package.json
```json
{
  "name": "the-grudgekeeper",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@game/*": ["./src/game/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### .env.local
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Game Config
NEXT_PUBLIC_GAME_VERSION=0.1.0
NEXT_PUBLIC_DEBUG_MODE=false
```

### tailwind.config.ts
```javascript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Game-specific colors
        'dwarf': '#66ff00',
        'enemy': '#ff0066',
        'mineral': '#00ccff',
        'item': '#ffcc00',
        'wall': '#666666',
        'floor': '#333333',
        // Mood colors
        'mood-cooperative': '#66ff00',
        'mood-grumpy': '#ff6600',
        'mood-grudging': '#ff3300',
        'mood-furious': '#ff0000',
      },
      fontFamily: {
        'mono': ['Space Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
```

---

## Database Schema (Supabase)

### Core Tables

```sql
-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_playtime INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]'
);

-- Ships table
CREATE TABLE ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  name TEXT NOT NULL,
  mood TEXT DEFAULT 'grumpy',
  mood_value INTEGER DEFAULT 50,
  organs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runs table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  ship_id UUID REFERENCES ships(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  expedition_rank INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  state JSONB NOT NULL
);

-- Grudges table
CREATE TABLE grudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  description TEXT NOT NULL,
  severity INTEGER DEFAULT 1,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progression table
CREATE TABLE progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  skill_trees JSONB DEFAULT '{}',
  unlocks JSONB DEFAULT '[]',
  resources JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Development Workflow

### Initial Setup
```bash
# 1. Create Next.js app
npx create-next-app@latest the-grudgekeeper --typescript --tailwind --app

# 2. Install dependencies
cd the-grudgekeeper
npm install zustand immer @anthropic-ai/sdk pixi.js howler nanoid lodash date-fns
npm install -D @faker-js/faker vitest @testing-library/react @types/lodash

# 3. Set up Supabase
npm install @supabase/supabase-js
npx supabase init
npx supabase start

# 4. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 5. Run database migrations
npm run db:migrate

# 6. Start development server
npm run dev
```

### Git Workflow
```bash
# Branch naming
feature/ship-personality
fix/dungeon-generation-bug
chore/update-dependencies

# Commit messages
feat: add ship mood system
fix: resolve expedition save bug
docs: update tech stack documentation
chore: upgrade to Next.js 14.2
```

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load game assets on demand
2. **Code Splitting**: Separate game engine from UI
3. **State Management**: Use zustand subscriptions wisely
4. **Rendering**: Batch ASCII grid updates
5. **Database**: Index frequently queried columns

### Monitoring
- Vercel Analytics for performance metrics
- Sentry for error tracking (optional)
- Custom game metrics via Supabase

---

## Security Considerations

1. **Game State Validation**: Server-side validation for all game actions
2. **Row Level Security**: Supabase RLS for player data isolation
3. **API Rate Limiting**: Protect Claude API from abuse
4. **Input Sanitization**: Prevent XSS in user-generated content

---

## Deployment Strategy

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build passes without errors
- [ ] Tests pass
- [ ] Performance audit complete
- [ ] Security headers configured

### Vercel Configuration
```json
{
  "functions": {
    "app/api/ai/ship-response/route.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## Future Considerations

### Scalability Path
1. **Redis Cache**: For session management
2. **WebSocket Server**: For real-time multiplayer
3. **CDN**: For game assets
4. **Worker Threads**: For expensive computations

### Feature Flags
- Use environment variables initially
- Consider Vercel Edge Config or similar for dynamic flags

---

## Summary

This tech stack provides a solid foundation for The Grudgekeeper, balancing modern web technologies with game-specific needs. The architecture supports both rapid prototyping and long-term scalability, while maintaining excellent developer experience throughout.

Key advantages:
- **Type Safety**: Full TypeScript coverage
- **Real-time Ready**: Supabase subscriptions
- **AI Integration**: Clean Claude implementation
- **Performance**: Optimized rendering pipeline
- **Developer Experience**: Hot reload, great tooling

*Rock and Stone!* ⛏️