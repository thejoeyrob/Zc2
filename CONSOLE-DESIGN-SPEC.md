# ZC2 Handheld Console Design Specification

**Version**: 5.27.0  
**Date**: 2026-09-27

## Overview

The ZC2 arcade game now features a dedicated handheld console aesthetic with geometry-locked responsive layout, repositioned control buttons below the screen, and haptic feedback on all button interactions.

## Geometry Reference

The console frame is designed using reference geometry locked to the device screen perimeter:

### Portrait Layout (Classic Mode)
- **Aspect Ratio**: 9:16 (iPhone SE reference)
- **Console Edge Padding**: 14px
- **Screen Position**: Locked 14px from left/right edges, top 54px, bottom 154px
- **Gameplay Area**: Scales to fill available space within screen bounds
- **Bottom Console Deck**: Positioned below gameplay, contains Menu and Pause buttons

### Landscape Layout (Adventure Mode)
- **Aspect Ratio**: 16:9 (cinematic)
- **Console Edge Padding**: 14px
- **Side Pods**: Calculated width based on `(100vw - screen_width) / 2`
- **Grenade Button**: Centered horizontally between pods and screen
- **Menu/Pause Buttons**: Bottom left/right below screen

## Button Layout

### Menu Button (Bottom Left)
- **Portrait**: Position at bottom-left console deck, auto-width (min 80px)
- **Landscape**: Position at bottom-left of landscape pod area
- **Label**: "MENU" with menu icon
- **Haptic**: `menu` pattern (24ms)
- **Color**: Skin-coordinated accent color

### Pause/Play Button (Bottom Right)
- **Portrait**: Position at bottom-right console deck, auto-width (min 80px)
- **Landscape**: Position at bottom-right of landscape pod area
- **Label**: "PAUSE" (or "PLAY" when paused)
- **Haptic**: `press` pattern (12ms, 6ms delay, 12ms)
- **Color**: Skin-coordinated accent color

### Grenade Button (Center of Control Panel)
- **Position**: Centered horizontally in control panel area (below screen), not in gameplay center
- **Size**: 6.8% of console width, scales responsively on all devices
- **Color**: ALWAYS yellow (#ffff00), never skin-coordinated
- **Neon Ring Indicator**:
  - **Inactive** (no grenades): Greyed-out static blue ring (#0066ff) with low opacity
  - **Active** (grenades available): Glowing cyan neon ring (#00ddff) with pulsing animation
  - **Ring is always blue regardless of skin choice**
- **Haptic**: `grenade` pattern (16ms, 8ms delay, 16ms, 8ms delay, 16ms)
- **Label**: Explosion icon

### Movement Controls (Portrait)
- **Left Button**: Left side, d-pad style
- **Right Button**: Right side, d-pad style
- **Position**: Below center of screen, outside gameplay area
- **Haptic**: `light` pattern (8ms)
- **Size**: Scales responsively (56-58px)

### Movement Controls (Landscape)
- **Joystick**: Left pod, centered
- **Size**: 72x72px or 80% of pod width (whichever is smaller)
- **Haptic**: Integrated into joystick directional feedback

### Fire Button
- **Portrait**: Right side, below gameplay area
- **Landscape**: Right pod, 64% from top
- **Size**: Responsive (92-98px portrait, 80% of pod width landscape)
- **Haptic**: `press` pattern
- **Color**: Skin-coordinated

## Color Coordination

**Grenade Button**: Always yellow (#ffff00) with blue neon ring, regardless of console skin:
- **Button Color**: #ffff00 (bright yellow)
- **Neon Ring Inactive**: #0066ff (blue, low opacity)
- **Neon Ring Active**: #00ddff (cyan, full glow)

**Other Console Elements**: Skin-coordinated accent colors for frame borders, button highlights, and HUD elements (no grenade button variation by skin).

## Haptic Feedback Patterns

Haptic patterns (in milliseconds):

```javascript
light:    [8]                    // Subtle touch feedback
press:    [12, 6, 12]           // Medium-strength button press
release:  [6]                   // Light release feedback
grenade:  [16, 8, 16, 8, 16]   // Triple-pulse grenade throw
menu:     [24]                  // Strong menu open/close
```

## Console Frame Design

The console frame is a 2D background image positioned behind the gameplay screen. It includes:

1. **Rounded Corners**: 10px border radius on screen bezel
2. **Button Indents**: Visual indents for buttons in console deck
3. **Edge Bezel**: 14px thick frame around edges with gradient lighting
4. **Texture**: Subtle material texture matching each skin
5. **Bleed Area**: 6px transparent bleed outside visible screen for overflow safety

### Frame Zones

**Portrait Mode (540px × 960px base)**:
- Top bezel: 40px (from top edge to screen top)
- Screen area: Dynamic based on aspect ratio
- Bottom deck: 140px (from screen bottom to edge)
- Left/right margins: 14px each side

**Landscape Mode (Aspect 16:9)**:
- Top/bottom bezels: 14px each
- Left/right pods: Variable (calculated from `(100vw - 16:9_screen) / 2`)
- Each pod contains button indents and controls

## Technical Implementation

### CSS Architecture

```css
/* Geometry-locked variables */
.zs52-shell {
  --consoleEdge: 14px;      /* Frame thickness */
  --screenBleed: 6px;        /* Safety overflow margin */
}

/* Responsive scaling */
.zs52-shell.mode-portrait {
  --portrait-width: min(100vw, calc(100dvh * 9/16));
  width: var(--portrait-width);
  aspect-ratio: 9/16;
}

.zs52-shell.mode-landscape {
  --landscape-pod: calc((100vw - min(100dvh * 16/9, 100vw - 28px)) / 2);
  --screen-width: min(calc(100vw - var(--landscape-pod) * 2), calc(100dvh * 16/9));
}
```

### JavaScript Architecture

```javascript
// Haptic feedback function
function hapticFeedback(type='light') {
  if (!navigator.vibrate) return;
  const patterns = {
    light:    [8],
    press:    [12, 6, 12],
    grenade:  [16, 8, 16, 8, 16],
    menu:     [24]
  };
  navigator.vibrate(patterns[type]);
}

// Grenade button state management
function updateGrenadeButton() {
  const g = $('#zs52Grenade');
  if (!g || !A.engine) return;
  const hasGrenades = A.engine.player.grenades > 0;
  g.classList.toggle('zs52-noammo', !hasGrenades);
  g.setAttribute('data-grenade-count', String(A.engine.player.grenades || 0));
}
```

## Asset Requirements

### Console Skin Frame Images

Each skin requires a 2D console frame background suitable for:
- **Portrait**: ~540px × 960px (or SVG)
- **Landscape**: ~1280px × 720px (or SVG)

Design should include:
- Rounded screen bezel (10px)
- Button indents for Menu/Pause
- Textured frame with skin-specific color/material
- Subtle lighting gradient (top-left highlights, bottom-right shadows)
- Edge bevels and depth cues

### Neon Ring Glow Effects

The grenade button neon ring is CSS-based with dynamic glows:
- Skin-coordinated color
- Pulsing box-shadow (when active)
- Inset glow for depth
- Smooth transitions between states

## Testing Checklist

- [ ] Portrait mode: All buttons visible and clickable at screen edges
- [ ] Landscape mode: Side pods properly sized, controls accessible
- [ ] Grenade button: Neon ring glows only when grenades available
- [ ] Haptic feedback: All button types trigger correct patterns
- [ ] Responsive scaling: Layout adapts to 300px-1920px width range
- [ ] Color coordination: Neon ring matches each skin's accent color
- [ ] Menu/Pause buttons: Positioned below screen, not overlapping gameplay
- [ ] Small devices: Layout compresses gracefully on phones <400px wide
- [ ] Landscape heights: Works at 520px minimum height (tablet mode)
- [ ] Performance: No layout thrashing, smooth animations at 60fps

## Version History

- **5.27.0** (2026-09-27): Initial handheld console aesthetic implementation
  - Geometry-locked responsive layout
  - Menu/Pause buttons repositioned to bottom
  - Grenade button neon ring indicator
  - Haptic feedback on all interactions
  - Color-coordinated button styling

## Future Enhancements

1. **3D Console Model**: Perspective 3D rendering for console frame (post-launch)
2. **Advanced Haptics**: Custom patterns per skin, intensity variations
3. **Console Customization**: User ability to adjust bezel style, button positions
4. **Accessibility**: Physical button size adjustment, haptic intensity control
5. **Dark Mode Console Frames**: Alternate frame designs for light/dark themes
