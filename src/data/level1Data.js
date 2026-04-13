// Level 1: Shanghai Awakening — all geometry, collectibles, and entity positions
// Pure data module — no Phaser import.
// Consumed by Level1Scene via: import { LEVEL1 } from '../data/level1Data.js'

export const LEVEL1 = Object.freeze({
  worldWidth:  3200,
  worldHeight: 720,
  playerSpawn: { x: 200, y: 580 },
  checkpoint:  { x: 200, y: 580 },

  // Ground: full-width strip at bottom (center y 688, h 64 → top surface at y 656)
  ground: { x: 1600, y: 688, w: 3200, h: 64 },

  // Platforms: each { x, y, w, h, color? }
  // color defaults to 0x444466 when omitted
  // Moving platforms carry: moving: true, rangeX, speed
  platforms: [
    { x: 350,  y: 580, w: 180, h: 20 },  // [0] low hop — intro
    { x: 580,  y: 500, w: 160, h: 20 },  // [1] step up
    { x: 800,  y: 420, w: 200, h: 20 },  // [2] mid height — enemy patrol
    { x: 1050, y: 350, w: 160, h: 20 },  // [3] high reach — double jump needed
    { x: 1300, y: 450, w: 180, h: 20 },  // [4] back down
    { x: 1550, y: 380, w: 140, h: 20, moving: true, rangeX: 120, speed: 80 }, // [5] moving
    { x: 1800, y: 500, w: 200, h: 20 },  // [6] after moving platform
    { x: 2050, y: 400, w: 160, h: 20 },  // [7] enemy patrol platform
    { x: 2300, y: 480, w: 200, h: 20 },  // [8] enemy patrol platform
    { x: 2550, y: 350, w: 180, h: 20 },  // [9] high platform — book here
    { x: 2800, y: 500, w: 220, h: 20 },  // [10] pre-boss area
  ],

  // Boss door: locked rectangle barrier before boss arena
  bossDoor: { x: 3050, y: 656, w: 40, h: 128, color: 0xcc3333 },

  // Boss arena spawn (past boss door)
  bossSpawn: { x: 3150, y: 630 },

  // Coins: 5 skill coins — gold, require platforming to reach
  // y = platform.y - platformH/2 - 20 (floating above surface)
  coins: [
    { x: 580,  y: 460 },  // above platform [1]
    { x: 800,  y: 380 },  // above platform [2]
    { x: 1050, y: 310 },  // above platform [3] — highest
    { x: 1550, y: 340 },  // above moving platform [5]
    { x: 2050, y: 360 },  // above platform [7] — enemy platform (risk/reward)
  ],

  // Book: single collectible on high platform near boss door
  book: { x: 2550, y: 300 },  // above platform [9]

  // Enemies: 3 patrol suits — patrolMin/patrolMax are x-axis bounds
  // patrolMin/Max calculated from platform edges (platform.x ± platform.w/2)
  enemies: [
    { x: 800,  y: 380, patrolMin: 720,  patrolMax: 980  },  // platform [2]
    { x: 2050, y: 360, patrolMin: 1970, patrolMax: 2130 },  // platform [7]
    { x: 2300, y: 440, patrolMin: 2220, patrolMax: 2480 },  // platform [8]
  ],
})
