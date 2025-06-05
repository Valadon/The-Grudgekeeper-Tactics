# The Grudgekeeper - Graphics Technical Documentation
## Version 1.0 - May 25, 2025

---

## Overview

This document outlines the graphics implementation strategy for The Grudgekeeper, starting with an ASCII-Plus approach and providing a clear upgrade path to full sprite-based graphics. The goal is to maintain playability at every stage while allowing incremental visual improvements.

---

## Graphics Philosophy

**Core Principles:**
- **Playable First**: Game should be fully functional with ASCII alone
- **Incremental Enhancement**: Add visual elements without breaking existing functionality
- **Consistent Art Direction**: Maintain cohesive style across all visual elements
- **Performance Conscious**: Web-based rendering must remain smooth on modest hardware

---

## Phase 1: ASCII-Plus Foundation

### Display Architecture

```
┌─────────────────────────────────────────────────────┐
│  Top Bar (Ship Mood | Resources)                    │
├─────────────┬─────────────────────┬─────────────────┤
│   Dwarf     │    Dungeon View     │   Ship Panel    │
│   Panel     │    (ASCII Grid)     │   (Portrait)    │
│  (4 slots)  │                     │   (Dialogue)    │
│             │                     │   (Organs)      │
└─────────────┴─────────────────────┴─────────────────┘
│         Expedition Progress Bar                      │
└─────────────────────────────────────────────────────┘
```

### ASCII Character Set

```javascript
const ASCII_TILES = {
  // Environment
  WALL: '█',
  FLOOR: '·',
  DOOR_CLOSED: '+',
  DOOR_OPEN: '/',
  STAIRS_UP: '<',
  STAIRS_DOWN: '>',
  
  // Characters
  DWARF_ACTIVE: '@',
  DWARF_INACTIVE: 'o',
  GOBLIN: 'g',
  VOID_HORROR: 'V',
  BOSS: '◙',
  
  // Objects
  MINERAL_COMMON: '◊',
  MINERAL_RARE: '◈',
  CHEST: '▪',
  ITEM: '!',
  TRAP: '^',
  
  // Effects
  EXPLOSION: '*',
  PROJECTILE: '•',
  MAGIC: '¤'
};
```

### Color Palette

```css
:root {
  /* UI Colors */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --border-color: #444;
  --text-primary: #e0e0e0;
  --text-secondary: #999;
  
  /* Game Element Colors */
  --dwarf-color: #66ff00;
  --enemy-color: #ff0066;
  --mineral-color: #00ccff;
  --item-color: #ffcc00;
  --door-color: #cc9900;
  --wall-color: #666;
  --floor-color: #333;
  
  /* Status Colors */
  --health-full: #66ff00;
  --health-mid: #ffcc00;
  --health-low: #ff6600;
  --health-critical: #ff0000;
  
  /* Mood Colors */
  --mood-cooperative: #66ff00;
  --mood-grumpy: #ff6600;
  --mood-grudging: #ff3300;
  --mood-furious: #ff0000;
}
```

### Implementation Details

**Rendering Method**: CSS Grid for dungeon layout
```css
.dungeon-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-width), 1.2em);
  grid-template-rows: repeat(var(--grid-height), 1.2em);
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  line-height: 1;
}

.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}
```

---

## Phase 2: Portrait Integration

### AI-Generated Portraits

**Ship Mood Portraits** (256x256px)
- Cooperative (rare green glow)
- Grumpy (default orange tint)
- Grudging (red warning lights)
- Furious (dramatic red/black)

**Dwarf Class Portraits** (128x128px)
- Ironclad (heavy armor, shield)
- Delver (mining gear, goggles)
- Brewmaster (barrel, tankard)
- Engineer (tools, gadgets)
- [Unlockable classes as discovered]

**Ship Organ Illustrations** (200x150px)
- Heart Forge (mechanical heart + forge)
- Neural Ale-Gardens (brain + brewery)
- Grudge Cortex (crystalline memory bank)
- Digestive Arrays (bio-mechanical stomach)
- Sensory Polyps (eye stalks)

### AI Art Generation Guidelines

**Recommended Prompt Structure:**
```
"[subject], space dwarf aesthetic, bio-mechanical, 
dark sci-fi, pixel art style, [mood/color], 
game asset, dark background, no text"
```

**Style Consistency:**
- Dark, muted color palette with accent colors
- Bio-mechanical fusion aesthetic
- Slightly cartoonish proportions
- Clear silhouettes for readability

---

## Phase 3: Sprite Conversion

### Tile Sprite Specifications

**Standard Tile Size**: 32x32px (scalable to 16x16 or 64x64)

**Sprite Categories:**
1. **Environment Tiles** (static)
   - Walls (multiple variants)
   - Floors (wear patterns)
   - Doors (open/closed states)
   - Environmental hazards

2. **Character Sprites** (animated)
   - 4 directions (N/S/E/W)
   - Idle (2 frames)
   - Walk (4 frames)
   - Attack (3 frames)
   - Death (4 frames)

3. **Object Sprites** (static with effects)
   - Items (glow/sparkle overlay)
   - Minerals (subtle animation)
   - Interactables (state changes)

### Sprite Implementation

**Canvas-Based Rendering**:
```javascript
class SpriteRenderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.tileSize = 32;
    this.sprites = new Map();
  }
  
  drawTile(sprite, x, y, frame = 0) {
    const img = this.sprites.get(sprite);
    if (!img) {
      // Fallback to ASCII
      this.drawASCII(sprite, x, y);
      return;
    }
    
    this.ctx.drawImage(
      img,
      frame * this.tileSize, 0,
      this.tileSize, this.tileSize,
      x * this.tileSize, y * this.tileSize,
      this.tileSize, this.tileSize
    );
  }
}
```

### Transition Strategy

1. **Parallel Rendering Systems**
   - Maintain both ASCII and sprite renderers
   - Toggle via settings or based on loaded assets
   - Graceful fallback if sprites fail to load

2. **Progressive Enhancement**
   ```javascript
   // Check for sprite availability
   if (spriteLoader.hasSprite('dwarf_ironclad')) {
     renderer.drawSprite('dwarf_ironclad', x, y);
   } else {
     renderer.drawASCII('@', x, y, '--dwarf-color');
   }
   ```

---

## Asset Pipeline

### Directory Structure
```
/public/assets/
├── /sprites/
│   ├── /characters/
│   ├── /environment/
│   ├── /items/
│   └── /effects/
├── /portraits/
│   ├── /ship/
│   ├── /dwarves/
│   └── /organs/
└── /ui/
    ├── /icons/
    └── /backgrounds/
```

### Asset Loading Strategy

```javascript
class AssetLoader {
  async loadAssets() {
    // Priority 1: UI and Portraits
    await this.loadPortraits();
    
    // Priority 2: Character sprites
    await this.loadCharacterSprites();
    
    // Priority 3: Environment
    await this.loadEnvironmentSprites();
    
    // Game is playable at any point
    // Missing assets use ASCII fallback
  }
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Sprite Atlases**
   - Combine related sprites into single images
   - Reduce HTTP requests
   - Enable efficient batch rendering

2. **Lazy Loading**
   - Load sprites for current location only
   - Preload adjacent areas during gameplay
   - Cache frequently used assets

3. **Resolution Scaling**
   - Detect device capabilities
   - Serve appropriate resolution assets
   - Maintain pixel-perfect scaling ratios

### Rendering Performance

```javascript
// Use requestAnimationFrame for smooth updates
let lastRender = 0;
function gameLoop(timestamp) {
  const delta = timestamp - lastRender;
  
  if (delta > 16) { // Cap at 60 FPS
    update(delta);
    render();
    lastRender = timestamp;
  }
  
  requestAnimationFrame(gameLoop);
}
```

---

## Development Timeline

### Milestone 1: ASCII-Plus Core (Week 1-2)
- ✓ Basic ASCII rendering
- ✓ Color system implementation
- ✓ UI layout structure
- ✓ Font and styling

### Milestone 2: Portrait Integration (Week 3-4)
- [ ] AI portrait generation
- [ ] Portrait display system
- [ ] Dynamic mood changes
- [ ] Organ status visualization

### Milestone 3: Sprite Preparation (Week 5-6)
- [ ] Sprite renderer implementation
- [ ] Asset loading system
- [ ] Fallback mechanisms
- [ ] Performance optimization

### Milestone 4: Full Sprite Mode (Week 7-8)
- [ ] Complete sprite set
- [ ] Animation system
- [ ] Particle effects
- [ ] Polish and optimization

---

## Tools and Resources

### Recommended Tools

**AI Art Generation:**
- Midjourney (primary style development)
- DALL-E 3 (quick iterations)
- Stable Diffusion (batch generation)

**Sprite Editing:**
- Aseprite (pixel art, animation)
- Photoshop (touch-ups, atlases)

**Performance Testing:**
- Chrome DevTools (rendering performance)
- Lighthouse (web performance)

### Asset Specifications Summary

| Asset Type | Dimensions | Format | Animation |
|------------|------------|--------|-----------|
| Ship Portraits | 256x256 | PNG | No |
| Class Portraits | 128x128 | PNG | No |
| Organ Art | 200x150 | PNG | No |
| Character Sprites | 32x32 | PNG | Yes (sheet) |
| Environment Tiles | 32x32 | PNG | No |
| UI Icons | 24x24 | PNG/SVG | No |
| Item Sprites | 32x32 | PNG | Optional |

---

## Conclusion

This graphics approach allows The Grudgekeeper to be playable immediately while providing a clear path for visual enhancement. By starting with ASCII and progressively adding sprite graphics, we maintain development momentum while building toward a polished final product.

The key is that every visual element has both an ASCII and sprite representation, ensuring the game never breaks due to missing assets and allowing for flexible, iterative development.

*Rock and Stone!* ⛏️