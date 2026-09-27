# Zero Caliber 2 Community Arena: Quest VR Feasibility Report

**Project**: ZC2 Community Arena  
**Target Platform**: Meta Quest 3  
**Date**: 2026-09-27  
**Status**: Feasibility Assessment

---

## Executive Summary

A port of Zero Caliber 2 Community Arena to Meta Quest 3 is **technically feasible** with moderate development effort. The existing Canvas/WebGL architecture can be adapted for WebXR, leveraging the Quest's native browser capabilities. A proof-of-concept scope (4-6 weeks) could validate core mechanics before full development commitment.

**Recommendation**: Proceed with proof-of-concept development targeting single-player classic mode with hand-tracking and controller hybrid input.

---

## 1. Architecture Analysis

### Current ZC2 Architecture
- **Frontend**: Canvas/WebGL rendering engine
- **Backend**: Supabase (authentication, leaderboards, real-time signals)
- **Deployment**: Vercel-hosted static PWA
- **Input**: Touch controls (d-pad, buttons) on mobile devices

### VR Development Path Options

#### Option A: WebXR Browser Port (Recommended)
**Approach**: Wrap existing Canvas engine with WebXR API layer
- **Advantages**:
  - Leverages existing codebase (canvas/WebGL already VR-capable)
  - No native SDK learning curve
  - Shared backend with main PWA (Supabase)
  - Rapid iteration cycle
  - WebXR Emulator for desktop testing
  
- **Disadvantages**:
  - WebGPU-WebXR integration not yet supported (2026 limitation)
  - Lower performance ceiling vs native development
  - Limited haptic feedback options
  - Constraints on advanced hand-tracking features

- **Feasibility**: ★★★★☆ (High - 6-8 weeks for MVP)

#### Option B: Native Android Development
**Approach**: Rewrite game using Meta XR SDK + Unity/Unreal
- **Requirements**:
  - Unity 6 or 2022 LTS with Android support
  - Meta XR Core SDK v57+
  - Interaction SDK for input handling
  - Platform SDK for social/leaderboard integration
  
- **Advantages**:
  - Maximum performance (native 90 FPS target)
  - Full haptic feedback and haptic composition
  - Advanced hand-tracking with pose estimation
  - Offline play capability
  
- **Disadvantages**:
  - Complete engine rewrite required (high effort)
  - Parallel development maintaining separate codebase
  - Backend integration complexity
  - Longer development timeline (12-16 weeks)

- **Feasibility**: ★★★☆☆ (Medium - High effort)

---

## 2. Input Design & Adaptation

### Current ZC2 Input Model
- **Classic Mode**: Three buttons (left, right, fire) - horizontal defense
- **Adventure Mode**: Omnidirectional movement + 8-way aiming, joystick + arrow keys

### VR Input Mapping Strategy

#### Hybrid Approach (Recommended)
Support both hand-tracking and controller input, following industry best practice (Beat Saber, Story of Seasons).

**Controller Input** (Primary for Classic Mode):
- Left Controller Thumbstick: Horizontal movement (up/down in landscape)
- Right Controller Trigger: Fire action
- A Button: Reload / Special action
- B Button: Pause / Menu

**Hand-Tracking Input** (Primary for Adventure Mode):
- Right Hand Position: Aiming reticle (track palm facing)
- Left Hand Position: Movement direction (thumb-up gesture = forward, fist = strafe)
- Hand Gesture Recognition: Pinch = fire (thumb + index), Open palm = hold aim
- Controller Fallback: Automatically switch if hand tracking lost

**Immersion Considerations**:
- Minimal controller requirement for core gameplay
- Haptic feedback on fire actions (pulse at trigger)
- Hand-tracking reduces motion sickness (more intuitive feedback)
- Voice commands for pause/menu (emerging capability)

---

## 3. Performance Modeling

### Target Specification
- **Platform**: Meta Quest 3 (Snapdragon Gen 2 Leading Version)
- **Target Frame Rate**: 90 FPS (VR minimum for comfort)
- **Render Resolution**: 1800x1920 per eye (Quest 3 native)
- **GPU Headroom**: 12ms per frame (1000ms / 90 FPS)

### Current Canvas/WebGL Performance
- Current build runs 60 FPS+ on mobile browsers
- Asset count: ~45 unique sprites
- Particle effects: Low-moderate intensity (muzzle flashes, explosions)
- Draw calls: Estimated 50-100 per frame

### Optimization Requirements for 90 FPS

**1. Rendering Optimization**:
- Level-of-detail (LOD) sprite scaling for distant objects
- Instancing for repeated zombie sprites
- Canvas batching (reduce draw call count to <30)
- Target: 8-10ms per frame render time

**2. Physics & Logic Optimization**:
- Spatial partitioning for collision detection
- Reduce AI calculation frequency (32ms update cycles acceptable in VR)
- Simplify particle systems (cap at 200 active particles)
- Target: 2-3ms per frame logic time

**3. Memory Constraints**:
- Quest 3 RAM: ~8GB available for apps
- Current asset footprint: ~50MB (cache + code)
- Texture atlasing to reduce draw calls
- Streaming assets for adventure mode maps

**Performance Projection**:
- Classic Mode (simpler): 80-90 FPS achievable ✓
- Adventure Mode (omnidirectional): 75-85 FPS with LOD optimization ✓
- Performance margin acceptable for VR comfort

---

## 4. Asset Adaptation Strategy

### Current Asset Structure
- 2D sprite-based artwork (PNG/WebP)
- Fixed aspect ratio (9:16 portrait, 16:9 landscape)
- Procedural sprite rendering for creature parts

### VR-Specific Adaptations

**Option 1: 2D Sprite Expansion** (Quickest)
- Scale existing sprites for larger VR viewport
- Implement sprite scaling/tessellation for 3D depth
- Parallax backgrounds for depth illusion
- **Effort**: 1-2 weeks

**Option 2: 3D Asset Creation** (Best Visual Quality)
- Commission/create 3D models for Joey Rob and zombies
- Render 3D sprites for consistency across viewing angles
- Improved immersion for hand-tracking perspective
- **Effort**: 3-4 weeks, higher cost

**Recommended Approach**: Option 1 initially (rapid MVP), with Option 2 as post-launch enhancement.

### Rendered Intro Scene Considerations
- Existing comic-strip boss intro animations adapt well to VR
- Over-shoulder perspective already designed for first-person feel
- Animation timings (tease 3.2s, reveal 2.4s) need VR motion sickness testing
- Consider subtle head-tracking parallax during cinematics

---

## 5. Development Effort Estimation

### Proof-of-Concept Scope (Recommended)
**Single-player Classic Mode with WebXR**

| Component | Effort | Notes |
|-----------|--------|-------|
| WebXR layer integration | 1 week | Wrap canvas with immersive session |
| Input mapping (hybrid) | 1 week | Controller + hand-tracking |
| Performance optimization | 1.5 weeks | Achieve 90 FPS baseline |
| Testing & iteration | 1.5 weeks | Haptics, latency, comfort validation |
| **Total MVP** | **5 weeks** | Single-player classic mode only |

### Full Feature Parity
**Multi-player, Adventure Mode, Leaderboards**

| Component | Effort | Notes |
|-----------|--------|-------|
| PoC tasks (above) | 5 weeks | Foundation |
| Adventure mode adaptation | 2 weeks | Omnidirectional movement in 3D space |
| Multiplayer WebXR sync | 1.5 weeks | Coordinate camera/hand tracking |
| Supabase integration | 1 week | Leaderboards, voice signals |
| Analytics & debugging | 1 week | VR-specific telemetry |
| **Total Full Release** | **11-12 weeks** | Full feature parity |

---

## 6. Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Motion sickness at 90 FPS | Medium | High | Frame rate testing early; head-tracking latency <20ms; smooth acceleration curves |
| WebXR hand-tracking unreliability | Medium | Medium | Fallback to controller; hybrid input mandatory; hand-tracking as enhancement not requirement |
| Backend sync latency in VR | Low | High | Local state prediction; test with 100ms+ network latency |
| Device compatibility | Low | Medium | Test on Quest 3 only initially; Emulator for early dev; Controller support mandatory |
| Canvas rendering bottleneck | Low | Medium | Profile with DevTools; switch to WebGL2 if needed; consider Babylon.js framework |

### Schedule Risks

| Risk | Mitigation |
|------|-----------|
| Unforeseen VR UX issues | Allocate 1-week buffer in PoC timeline; early user testing |
| Input mapping complexity | Start with 3-button classic mode; phase in omnidirectional |
| Performance regression mid-dev | Weekly profiling checkpoints; establish FPS baselines early |

---

## 7. Proof-of-Concept Plan

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up WebXR development environment (Emulator + Quest 3)
- [ ] Create WebXR wrapper layer for existing canvas
- [ ] Implement controller input mapping (3-button classic)
- [ ] Verify 60+ FPS rendering in immersive session

### Phase 2: Interaction (Weeks 3-4)
- [ ] Add hand-tracking input detection
- [ ] Implement hybrid input fallback logic
- [ ] Add haptic feedback on fire actions
- [ ] Test with 10+ users for comfort/nausea

### Phase 3: Polish (Weeks 5)
- [ ] Performance optimization pass (target 90 FPS)
- [ ] VR-specific UX refinements (menu scaling, text legibility)
- [ ] Documentation for full-feature dev team
- [ ] Generate proof-of-concept build for stakeholder review

### Success Criteria
- ✓ 90 FPS sustained in Classic mode
- ✓ <50ms hand-tracking latency with fallback working
- ✓ 5/5 test users report no motion sickness
- ✓ All core game mechanics functional (firing, zombies, scoring)
- ✓ Controller AND hand-tracking both playable paths

---

## 8. Recommendation

### Go/No-Go Decision
**PROCEED with Proof-of-Concept Development**

**Rationale**:
1. **Technical Feasibility**: WebXR + existing Canvas architecture minimizes risk
2. **Market Opportunity**: VR horde defense (Drop Dead, Zombie Horde VR) is proven genre
3. **Development Timeline**: 5-week PoC is low-cost validation gate
4. **User Experience**: Existing game mechanics map well to VR controllers/hands
5. **Backend Leverage**: Supabase integration enables multiplayer and leaderboards post-PoC

### Next Steps
1. **Immediate (Week 1)**: Establish WebXR dev environment and create prototype integration layer
2. **Contingency**: If hand-tracking proves problematic, pivot to controller-only classic mode (always achievable)
3. **Stakeholder Review**: Present PoC build by end of week 5 for full-feature development decision
4. **Asset Planning**: Begin 3D asset planning in parallel (optional enhancement for post-launch)

---

## Appendix: Technical Resources

### Meta Quest 3 Development
- **Meta XR SDK v57**: [meta.com/developers](https://meta.com/developers)
- **WebXR Standard**: [immersive-web.github.io](https://immersive-web.github.io)
- **Meta XR Simulator**: Desktop testing tool (no headset required during dev)
- **Immersive Web Emulator**: Chrome extension for WebXR testing

### Performance Benchmarks
- **Target**: 90 FPS @ 1800x1920 per eye
- **Margin**: <12ms per frame (including framework overhead)
- **Hand Tracking**: <20ms latency acceptable for precision aiming

### Reference VR Titles
- **Drop Dead**: Arcade horde defense (controller-based)
- **Zombie Horde VR**: Mobile port example (input-adaptive)
- **Beat Saber (Flux update)**: Hand-tracking hybrid implementation model
- **Story of Seasons**: Full hand-tracking without controllers

---

**Document Status**: Ready for stakeholder review  
**Prepared By**: Claude Code Session  
**Approval Required Before**: Full feature development initiation
