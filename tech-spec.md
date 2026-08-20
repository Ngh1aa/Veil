# Atelier Veil — Technical Specification

## Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | DOM renderer |
| gsap | ^3.12.7 | Animation engine, ScrollTrigger, Flip (MorphSwap) |
| lenis | ^1.2.3 | Smooth scroll with inertia |
| react-fast-marquee | ^1.6.5 | Infinite horizontal ticker (MarqueeDivider) |
| imagesloaded | ^5.0.0 | Image load detection for layout measurements |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.0.0 | Build tool |
| @vitejs/plugin-react | ^4.4.0 | React fast-refresh for Vite |
| typescript | ^5.7.0 | Type safety |
| tailwindcss | ^4.0.0 | Utility-first CSS |
| @types/react | ^19.0.0 | React type definitions |
| @types/react-dom | ^19.0.0 | ReactDOM type definitions |

---

## Component Inventory

### Layout

| Component | Source | Reuse |
|-----------|--------|-------|
| TopNav | Custom | Single instance — transparent fixed bar, `mix-blend-mode: difference`, mobile hamburger panel |
| Footer | Custom | Single instance — newsletter + 4-column link directory |

### Sections

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | Fullscreen video background, scroll-driven time scrub, mouse-responsive gradient |
| FragranceCollectionSection | Custom | Horizontal scroll pin, 4 fragrance cards with per-card LivingWaveCanvas |
| MoodChamberSection | Custom | Full-viewport interactive color-shift, single shared LivingWaveCanvas |
| CollectionGridSection | Custom | 4 perfume cards → EditorialDivider → 4 body ritual cards, staggered reveal |
| TestimonialsSection | Custom | 3-column liquid-glass cards on dark background |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| ProductCard | Custom | CollectionGridSection (×8) — image, overline, title, description, price |
| LiquidGlassCard | Custom | TestimonialsSection (×3) — layered CSS glass refraction with `::before` edge + `::after` specular highlight |
| LivingWaveCanvas | Custom | FragranceCollectionSection (×4, per-card), MoodChamberSection (×1, viewport-sized) — Canvas 2D text wave renderer |
| ScrollReveal | Custom | Wraps any element with `gsap.from` entrance + ScrollTrigger — used implicitly across all sections |
| SectionDivider | Custom | Between every major section — animated 1px line (scaleX 0→1 on scroll) |
| NoiseOverlay | Custom | Single instance, fixed full-page — tiling noise PNG at 2.5% opacity with drift animation |

### Hooks

| Hook | Purpose |
|------|---------|
| useLenis | Initializes Lenis, wires `scroll` event to `ScrollTrigger.update()`, provides instance ref |
| useMousePosition | Tracks normalized mouse coords (0–1), returns `{ x, y }` ref — drives ambient gradient in Hero and MoodChamber |
| useScrollDrivenVideo | Connects a video element to GSAP ScrollTrigger scrub — desktop only, falls back to loop on mobile |

---

## Animation Implementation

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Hero entrance sequence | GSAP timeline | Time-based timeline: heading 3s fade+translate, subtitle 2.5s with 0.5s offset, arrow 2s with 1s offset | Low |
| Scroll-driven video playback | GSAP ScrollTrigger + custom hook | Proxy tween 0→1, `onUpdate` maps progress to `video.currentTime`; throttled to avoid per-frame `currentTime` cost | Medium |
| Mouse-responsive gradient | CSS custom properties + raf | `--mx`/`--my` driven by `mousemove`, radial-gradient layers in CSS; `requestAnimationFrame` lerp (factor 0.05) for smooth follow | Low |
| Horizontal scroll pin (Fragrance Collection) | GSAP ScrollTrigger | `pin: true`, `scrub: 0.8`, `end: "+=3000"`, translateX 0→-75% on 400vw flex container | Medium |
| Living wave canvas (×5 instances) | Canvas 2D API + raf | Per-character `fillText()` with sinusoidal kerning; `requestAnimationFrame` loop, `time += 0.012`; shared WaveRenderer class | **High** 🔒 |
| Mood Chamber color transition | GSAP | Tween CSS custom properties `--bg-color-1`/`--bg-color-2` to target fragrance gradient over 3s; crossfade mood label/mood word simultaneously | Medium |
| Mood Chamber ambient gradient drift | GSAP or CSS animation | Oscillate `background-position` ±5% on 15s infinite loop | Low |
| Collection grid staggered reveal | GSAP ScrollTrigger | Batch trigger: `y: 80, opacity: 0, scale: 0.96`, stagger 0.08s, `start: "top 88%"` | Low |
| Editorial divider entrance | GSAP ScrollTrigger | `opacity: 0, scale: 1.02 → 1`, `start: "top 80%"` | Low |
| Testimonial cards scroll reveal | GSAP ScrollTrigger | `y: 60, opacity: 0`, stagger 0.15s | Low |
| Footer entrance | GSAP ScrollTrigger | Divider scaleX 0→1, then left/right columns fade in with 0.2s/0.4s delays | Low |
| Noise overlay drift | CSS @keyframes | `background-position` translation over 20s `alternate infinite` | Low |
| Scroll arrow fade-out | GSAP ScrollTrigger | `opacity: 1→0` scrubbed over first 100px of scroll | Low |
| Card image hover zoom | CSS transition | `transform: scale(1.05)`, 500ms ease — pure CSS, no JS | Low |
| Nav entrance | GSAP | `y: -20 → 0, opacity: 0 → 1`, 1s, delay 0.5s after page load | Low |
| Button underline hover | CSS | `background-size` from `0% 1px` to `100% 1px` on pseudo-element, 400ms transition | Low |

---

## State & Logic Plan

### Living Wave Canvas — Shared Renderer Class

Five instances across the page (4 in Fragrance Collection cards, 1 in Mood Chamber) share the same rendering algorithm but with different configurations. Extract a `WaveRenderer` class instantiated per canvas:

- **Constructor**: receives canvas ref, word layers config (text/frequency/amplitude/spacing/y/weight), gradient colors, font size
- **Lifecycle**: `init()` → `resize()` (match window size, cap DPR at 2) → `start()` (raf loop) → `destroy()` (cancel raf, remove listeners)
- **Runtime**: each frame clears canvas, applies gradient fill, iterates all word layers, renders character-by-character with sinusoidal y-offset
- **Input**: `mouseX`/`mouseY` as normalized offsets (desktop: mousemove, mobile: touchmove ×0.5 sensitivity)

The Mood Chamber instance adds a `crossfade()` method that interpolates text content and gradient colors over 1s when fragrance selection changes.

### Mood Chamber — Color State Machine

Four possible states (no selection + 4 fragrances). On hotspot click:

1. Update active fragrance ID in React state
2. Trigger GSAP tweens on CSS custom properties for background gradient (3s)
3. Signal WaveRenderer to crossfade text/gradient (1s)
4. Crossfade mood label and mood word via GSAP staggered opacity/scale

No complex state library needed — local `useState` for active ID, GSAP handles all visual transitions imperatively via refs.

### Scroll-Driven Video — Performance Guard

`video.currentTime` assignment is expensive. The `useScrollDrivenVideo` hook must:

- Only activate on desktop (`window.innerWidth > 768`)
- Use GSAP ScrollTrigger `onUpdate` (already throttled by GSAP's internal raf) rather than manual raf
- Clamp time: `Math.max(0, Math.min(progress * duration, duration - 0.1))`
- On mobile: video loops via native `loop` attribute, no ScrollTrigger created

### Lenis ↔ GSAP ScrollTrigger Bridge

Single `useLenis` hook at app root:

- Instantiate Lenis with `{ lerp: 0.08, duration: 1.2 }`
- On Lenis `scroll` event, call `ScrollTrigger.update()`
- Expose Lenis instance via ref for potential programmatic scroll-to
- Clean up on unmount

---

## Other Key Decisions

### No shadcn/ui Components

The design is entirely bespoke with no standard UI patterns (no forms, dialogs, tables, dropdowns). All components are custom-styled. Product cards, liquid-glass cards, and buttons are simple enough to build from scratch with Tailwind — adding shadcn would introduce unnecessary dependency weight and theming constraints.

### Tailwind v4 with CSS-First Configuration

Use Tailwind v4's CSS-native configuration (`@theme` in CSS) rather than `tailwind.config.js`. Define the design tokens (colors, fonts, spacing) as CSS custom properties in a base layer, then reference them via `theme()` in utility classes. This keeps the design system co-located with the styles.

### Canvas Strategy — Imperative, Not React-Declarative

All Canvas 2D rendering (LivingWaveCanvas) uses imperative refs, not React state. The raf loop, text measurements, and redraws happen outside React's render cycle. React only provides the container ref and triggers config changes (e.g., Mood Chamber fragrance switch signals the renderer imperatively).

### Video Asset Strategy

The hero video is a self-hosted MP4 (H.264 for compatibility, WebM as optional fallback). It autoplays muted with `playsInline` for iOS. A static fallback JPEG (`hero-fallback`) is displayed via `poster` attribute and serves as the background if autoplay is blocked. The video is lazy-loaded below-the-fold — the hero section uses `preload="auto"` since it's above the fold.
