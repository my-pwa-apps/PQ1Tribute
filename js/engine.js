/* ── Badge of Honor — Core Engine ──
 * VGA 320×200 (rendered at 640×400), AGI-inspired architecture
 * Incorporates Sierra AGI engine patterns:
 *   - Priority bands with control lines (based on AGI pic priority buffer)
 *   - LFSR dissolve transitions (Amiga polynomial 0x3500, 17-bit)
 *   - Text parser with said() matching (AGI WORDS.TOK-style dictionary)
 *   - Procedural rendering with AGI-style splatter brush (LFSR polynomial 0xB8)
 *   - Direction-to-loop sprite mapping (AGI VIEW system: R=0, L=1, Front=2, Back=3)
 *   - Dual-pass room rendering (background + player + foreground) for depth sorting
 */

'use strict';

// ══════════════════════════════════════════════════════════════
//  AGI ENGINE CONSTANTS (from Sierra AGI Technical Reference)
// ══════════════════════════════════════════════════════════════

const AGI = Object.freeze({
    // Screen dimensions (AGI internal → our VGA mapping)
    SCRIPT_WIDTH: 160,   // AGI game logic resolution
    SCRIPT_HEIGHT: 168,  // AGI game logic resolution
    DISPLAY_WIDTH: 320,  // Our logical display
    DISPLAY_HEIGHT: 200, // Our logical display
    CANVAS_SCALE: 2,     // Physical pixels per logical pixel

    // Direction-to-loop mapping (VIEW system)
    // In AGI, sprites have loops (0-3) mapped to facing direction
    DIR: { RIGHT: 0, LEFT: 1, FRONT: 2, BACK: 3 },

    // Priority bands (AGI pic priority system)
    PRI: {
        UNCONDITIONAL_BLOCK: 0,  // Impassable regardless of flags
        CONDITIONAL_BLOCK: 1,    // Block if object flag "block" unset
        TRIGGER: 2,              // Trigger signal when stepped on
        WATER: 3,                // Only objects with "on.water" can enter
        MIN_DEPTH: 4,            // First depth band (furthest back)
        MAX_DEPTH: 14,           // Last depth band (nearest)
        FOREGROUND: 15,          // Always drawn on top
    },

    // LFSR polynomials from AGI sources
    LFSR_DISSOLVE_AMIGA: 0x3500,  // 17-bit, covers 320×200
    LFSR_DISSOLVE_ATARI: 0xD5A0,  // 17-bit, Atari ST variant
    LFSR_SPLATTER: 0xB8,          // 8-bit, brush splatter pattern

    // Picture rendering opcodes (for reference/documentation)
    PIC_OP: {
        SET_VIS_COLOR: 0xF0,
        DISABLE_VIS: 0xF1,
        SET_PRI_COLOR: 0xF2,
        DISABLE_PRI: 0xF3,
        DRAW_YLINE: 0xF4,
        DRAW_XLINE: 0xF5,
        DRAW_LINE: 0xF6,
        DRAW_PEN: 0xF7,
        FILL: 0xF8,
        SET_PEN: 0xF9,
        END: 0xFF,
    },
});


// ══════════════════════════════════════════════════════════════
//  VGA 256-COLOR PALETTE (procedurally generated)
// ══════════════════════════════════════════════════════════════

const VGA = (() => {
    const palette = [];
    // 0-15: Standard EGA colors (VGA compatible)
    const ega = [
        [0,0,0],[0,0,170],[0,170,0],[0,170,170],
        [170,0,0],[170,0,170],[170,85,0],[170,170,170],
        [85,85,85],[85,85,255],[85,255,85],[85,255,255],
        [255,85,85],[255,85,255],[255,255,85],[255,255,255]
    ];
    ega.forEach(c => palette.push(c));

    // 16-231: 6×6×6 color cube (216 colors)
    for (let r = 0; r < 6; r++)
        for (let g = 0; g < 6; g++)
            for (let b = 0; b < 6; b++)
                palette.push([Math.round(r * 51), Math.round(g * 51), Math.round(b * 51)]);

    // 232-255: Grayscale ramp (24 shades)
    for (let i = 0; i < 24; i++) {
        const v = Math.round(8 + i * (248 - 8) / 23);
        palette.push([v, v, v]);
    }

    // Helper: find nearest VGA palette index for an RGB value
    function nearest(r, g, b) {
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < 256; i++) {
            const dr = palette[i][0] - r;
            const dg = palette[i][1] - g;
            const db = palette[i][2] - b;
            const d = dr * dr + dg * dg + db * db;
            if (d < bestDist) { bestDist = d; best = i; }
        }
        return best;
    }

    // Named color shortcuts for room drawing
    const C = {
        BLACK: 0, BLUE: 1, GREEN: 2, CYAN: 3,
        RED: 4, MAGENTA: 5, BROWN: 6, LGRAY: 7,
        DGRAY: 8, LBLUE: 9, LGREEN: 10, LCYAN: 11,
        LRED: 12, LMAGENTA: 13, YELLOW: 14, WHITE: 15,
        // VGA extended colors for police game
        SKIN_LIGHT: nearest(222, 175, 135),
        SKIN_DARK: nearest(180, 130, 90),
        HAIR_BROWN: nearest(100, 60, 30),
        HAIR_BLACK: nearest(30, 20, 15),
        UNIFORM_BLUE: nearest(30, 40, 100),
        UNIFORM_DARK: nearest(20, 25, 65),
        BADGE_GOLD: nearest(200, 170, 50),
        ROAD_GRAY: nearest(80, 80, 85),
        ROAD_DARK: nearest(50, 50, 55),
        SIDEWALK: nearest(170, 165, 155),
        BUILDING_TAN: nearest(180, 160, 130),
        BUILDING_BRICK: nearest(150, 70, 60),
        BUILDING_GRAY: nearest(130, 130, 140),
        FLOOR_TILE: nearest(160, 155, 145),
        WALL_BEIGE: nearest(200, 190, 170),
        WALL_GREEN: nearest(120, 150, 120),
        DESK_BROWN: nearest(120, 80, 50),
        LOCKER_GRAY: nearest(140, 145, 155),
        LOCKER_DARK: nearest(95, 100, 110),
        SKY_BLUE: nearest(100, 140, 220),
        SKY_LIGHT: nearest(150, 190, 240),
        GRASS_GREEN: nearest(60, 130, 40),
        GRASS_DARK: nearest(40, 100, 30),
        TREE_TRUNK: nearest(90, 60, 35),
        TREE_LEAVES: nearest(40, 110, 30),
        WATER_BLUE: nearest(30, 80, 160),
        WATER_LIGHT: nearest(60, 120, 200),
        WINDOW_CYAN: nearest(120, 180, 200),
        DOOR_BROWN: nearest(100, 65, 35),
        CARPET_RED: nearest(130, 40, 40),
        METAL_GRAY: nearest(160, 165, 175),
        EVIDENCE_BAG: nearest(200, 200, 190),
        NEON_RED: nearest(255, 50, 50),
        NEON_GREEN: nearest(50, 255, 50),
        CAR_WHITE: nearest(230, 230, 235),
        CAR_BLACK: nearest(30, 30, 35),
        NIGHT_SKY: nearest(10, 10, 40),
        LAMP_YELLOW: nearest(255, 230, 120),
    };

    // Pre-compute CSS strings for all 256 palette entries (avoids per-draw allocation)
    const cssCache = palette.map(c => `rgb(${c[0]},${c[1]},${c[2]})`);

    /** Convert a palette index to a CSS rgb string (cached) */
    function toCSS(idx) {
        return cssCache[idx];
    }

    // LRU cache for nearest-color lookups (key: r<<16|g<<8|b)
    const nearestCache = new Map();
    const NEAREST_CACHE_MAX = 512;
    const _nearestUncached = nearest;

    function nearestCached(r, g, b) {
        const key = (r << 16) | (g << 8) | b;
        let result = nearestCache.get(key);
        if (result !== undefined) return result;
        result = _nearestUncached(r, g, b);
        if (nearestCache.size >= NEAREST_CACHE_MAX) {
            // Evict oldest entry
            nearestCache.delete(nearestCache.keys().next().value);
        }
        nearestCache.set(key, result);
        return result;
    }

    return { palette, nearest: nearestCached, C, toCSS, cssCache };
})();


// ══════════════════════════════════════════════════════════════
//  SEEDED PRNG (for procedural generation)
// ══════════════════════════════════════════════════════════════

class SeededRandom {
    constructor(seed) {
        this.seed = seed | 0;
        if (this.seed === 0) this.seed = 12345;
    }
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return (this.seed >>> 16) / 32767;
    }
    int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
    pick(arr) { return arr[this.int(0, arr.length - 1)]; }
}


// ══════════════════════════════════════════════════════════════
//  PRIORITY SYSTEM (AGI-inspired, adapted for 200-line VGA)
//  AGI default: pri = y < 48 ? 4 : min(14, floor((y-48)/12) + 5)
//  Control priorities 0-3 reserved for block/trigger/water
//  Depth priorities 4-14 for Y-based sorting
//  Priority 15 = always-on-top foreground
// ══════════════════════════════════════════════════════════════

class PrioritySystem {
    constructor() {
        this.table = new Uint8Array(200);
        this.base = 48;
        this.buildTable();
    }
    buildTable() {
        // AGI default priority formula adapted for VGA 200-line display
        for (let y = 0; y < 200; y++) {
            if (y < this.base) this.table[y] = AGI.PRI.MIN_DEPTH;
            else this.table[y] = Math.min(AGI.PRI.MAX_DEPTH,
                Math.floor((y - this.base) / ((200 - this.base) / 10)) + 5);
        }
    }
    fromY(y) { return this.table[Math.min(199, Math.max(0, y))]; }
}


// ══════════════════════════════════════════════════════════════
//  LFSR DISSOLVE TRANSITION (AGI Amiga-style)
//  Uses 17-bit LFSR with polynomial 0x3500 (Amiga) to produce
//  the distinctive Sierra dissolve effect between screens.
//  Scaled to 640×400 physical pixels via 20-bit extended LFSR.
// ══════════════════════════════════════════════════════════════

class DissolveTransition {
    constructor() {
        this.active = false;
        this.pixelsPerFrame = 3200;
        this.lfsrState = 1;
        this.revealed = 0;
        this.oldImageData = null;
        this.newImageData = null;
    }
    start(oldData, newData) {
        this.oldImageData = oldData;
        this.newImageData = newData;
        this.lfsrState = 1;
        this.revealed = 0;
        this.active = true;
    }
    step(ctx) {
        if (!this.active) return;
        const w = 640, h = 400;
        const total = w * h;
        for (let i = 0; i < this.pixelsPerFrame; i++) {
            // 20-bit maximal-length LFSR (period 2^20-1 = 1048575, covers 640×400=256000)
            let bit = ((this.lfsrState >> 0) ^ (this.lfsrState >> 2) ^
                        (this.lfsrState >> 3) ^ (this.lfsrState >> 5)) & 1;
            this.lfsrState = (this.lfsrState >> 1) | (bit << 19);

            if (this.lfsrState < total && this.newImageData) {
                const x = this.lfsrState % w;
                const y = Math.floor(this.lfsrState / w);
                const idx = (y * w + x) * 4;
                const r = this.newImageData.data[idx];
                const g = this.newImageData.data[idx + 1];
                const b = this.newImageData.data[idx + 2];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 1, 1);
                this.revealed++;
            }

            if (this.lfsrState === 1) {
                this.active = false;
                // Draw complete new frame
                if (this.newImageData) {
                    ctx.putImageData(this.newImageData, 0, 0);
                }
                break;
            }
        }
    }
}


// ══════════════════════════════════════════════════════════════
//  TEXT PARSER (AGI WORDS.TOK-style dictionary + said() matching)
//  Implements AGI parser patterns:
//    - Word groups: synonyms share the same numeric ID
//    - Group 0: ignored filler words (articles, prepositions)
//    - said(v, n): matches verb + noun pattern with group IDs
//    - Wildcard 9999: matches rest of input (AGI "rest-of-line")
//    - Unknown word detection: returns first unrecognized word
// ══════════════════════════════════════════════════════════════

class TextParser {
    constructor() {
        this.dictionary = new Map();
        this.synonymGroups = new Map();
        this.lastParsed = [];
        this._buildDictionary();
    }

    _buildDictionary() {
        const words = [
            // Verbs
            ['look', 1], ['examine', 1], ['inspect', 1], ['check', 1], ['search', 1], ['read', 1],
            ['get', 2], ['take', 2], ['grab', 2], ['pick', 2], ['collect', 2],
            ['use', 3], ['apply', 3],
            ['open', 4], ['unlock', 4],
            ['close', 5], ['shut', 5],
            ['talk', 6], ['speak', 6], ['ask', 6], ['say', 6], ['tell', 6],
            ['walk', 7], ['go', 7], ['move', 7], ['enter', 7],
            ['give', 8], ['show', 8], ['hand', 8],
            ['push', 9], ['press', 9],
            ['pull', 10],
            ['wear', 11], ['put on', 11], ['equip', 11], ['change', 11], ['dress', 11],
            ['drop', 12], ['put', 12],
            ['drive', 13], ['start', 13],
            ['arrest', 14], ['cuff', 14], ['handcuff', 14],
            ['call', 15], ['radio', 15], ['dial', 15],
            ['write', 16], ['note', 16],
            ['load', 17],
            ['draw', 18],
            ['holster', 19],
            ['sit', 20], ['stand', 21],
            ['turn', 22], ['switch', 22],
            ['shoot', 23], ['fire', 23],
            ['follow', 24],
            ['wait', 25], ['hide', 25],
            ['save', 26],
            ['inventory', 27],
            ['help', 28],

            // Nouns — Station
            ['locker', 50], ['cabinet', 50],
            ['gun', 51], ['revolver', 51], ['pistol', 51], ['weapon', 51], ['firearm', 51],
            ['badge', 52],
            ['radio', 53],
            ['notebook', 54], ['notes', 54], ['notepad', 54],
            ['key', 55], ['keys', 55],
            ['uniform', 56], ['clothes', 56],
            ['desk', 57],
            ['computer', 58], ['terminal', 58],
            ['phone', 59], ['telephone', 59],
            ['door', 60],
            ['memo', 61], ['paper', 61], ['report', 61],
            ['car', 62], ['vehicle', 62], ['patrol', 62], ['cruiser', 62],
            ['nightstick', 63], ['baton', 63],
            ['handcuffs', 64], ['cuffs', 64],
            ['flashlight', 65], ['torch', 65],
            ['evidence', 66], ['clue', 66],
            ['file', 67], ['folder', 67], ['case file', 67],
            ['coffee', 68], ['mug', 68],
            ['shower', 69],
            ['towel', 70],
            ['briefcase', 71],
            ['ticket', 72], ['citation', 72],
            ['license', 73],
            ['wallet', 74],
            ['map', 75],
            ['photo', 76], ['photograph', 76], ['picture', 76],
            ['fingerprint', 77], ['prints', 77],
            ['warrant', 78],
            ['suspect', 79],
            ['witness', 80],
            ['victim', 81],
            ['body', 82],
            ['trash', 83], ['garbage', 83], ['can', 83],
            ['bench', 84],
            ['receipt', 85],
            ['note', 86], ['ransom', 86],
            ['van', 87],
            ['rope', 88], ['ropes', 88],
            ['chair', 89],

            // Nouns — Locations
            ['north', 90], ['south', 91], ['east', 92], ['west', 93],
            ['inside', 94], ['outside', 95],
            ['upstairs', 96], ['downstairs', 97],
            ['station', 100], ['precinct', 100],
            ['office', 101],
            ['locker room', 102],
            ['briefing', 103], ['briefing room', 103],
            ['parking', 104], ['lot', 104], ['garage', 104],
            ['jail', 105], ['cell', 105],
            ['lab', 106], ['forensics', 106],
            ['street', 107], ['road', 107],
            ['diner', 108], ['cafe', 108], ['restaurant', 108],
            ['bar', 109], ['pub', 109],
            ['park', 110],
            ['courthouse', 111],
            ['apartment', 112], ['building', 112],
            ['warehouse', 113], ['docks', 113],
            ['alley', 114],
            ['shop', 115], ['store', 115],
            ['hotel', 116],
            ['room', 117],

            // People
            ['man', 120], ['guy', 120], ['person', 120],
            ['woman', 121], ['lady', 121],
            ['captain', 122], ['chief', 122], ['boss', 122],
            ['partner', 123],
            ['bartender', 124], ['barkeeper', 124],
            ['clerk', 125],
            ['judge', 126],
            ['lawyer', 127],
            ['detective', 128],
            ['officer', 129],
            ['criminal', 130], ['crook', 130], ['thief', 130],
            ['lily', 81], ['sandra', 80],
            ['rosie', 124],
            ['torres', 122],
            ['vasquez', 130],
            ['swat', 131],
            ['back', 132], ['here', 132],

            // Ignored words (group 0)
            ['the', 0], ['a', 0], ['an', 0], ['to', 0], ['at', 0],
            ['in', 0], ['on', 0], ['with', 0], ['my', 0], ['of', 0],
            ['up', 0], ['around', 0], ['for', 0], ['from', 0], ['about', 0],
            ['into', 0], ['it', 0], ['this', 0], ['that', 0], ['is', 0],
            ['please', 0], ['just', 0], ['then', 0], ['some', 0],
        ];

        for (const [word, groupId] of words) {
            this.dictionary.set(word, groupId);
            if (groupId !== 0) {
                if (!this.synonymGroups.has(groupId)) this.synonymGroups.set(groupId, []);
                this.synonymGroups.get(groupId).push(word);
            }
        }
    }

    parse(input) {
        this.lastParsed = [];
        const cleaned = input.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        if (!cleaned) return { ok: false, words: [], unknown: null };

        const tokens = cleaned.split(/\s+/);
        for (const token of tokens) {
            if (token.length === 1 && (token === 'a' || token === 'i')) continue;
            const gid = this.dictionary.get(token);
            if (gid === undefined) return { ok: false, words: this.lastParsed, unknown: token };
            if (gid === 0) continue;
            this.lastParsed.push({ word: token, gid });
        }
        return { ok: true, words: this.lastParsed, unknown: null };
    }

    /** Check if parsed input matches expected group IDs.
     *  Use 9999 to match rest of input (any remaining words).
     *  Group 0 words (articles) are already stripped by parse().
     */
    said(...expectedGids) {
        if (this.lastParsed.length === 0) return false;
        for (let i = 0; i < expectedGids.length; i++) {
            const exp = expectedGids[i];
            if (exp === 9999) return true; // rest-match: accept anything remaining
            if (i >= this.lastParsed.length) return false;
            if (this.lastParsed[i].gid !== exp) return false;
        }
        return true;
    }

    /** Quick check: does parsed input contain a group ID? */
    has(gid) {
        return this.lastParsed.some(w => w.gid === gid);
    }

    /** Get verb group ID (first word) */
    verb() {
        return this.lastParsed.length > 0 ? this.lastParsed[0].gid : null;
    }

    /** Get noun group ID (second word) */
    noun() {
        return this.lastParsed.length > 1 ? this.lastParsed[1].gid : null;
    }
}


// ══════════════════════════════════════════════════════════════
//  PROCEDURAL DRAWING PRIMITIVES
// ══════════════════════════════════════════════════════════════

const Draw = {
    /** Fill rectangle with VGA palette index */
    rect(ctx, x, y, w, h, colorIdx) {
        ctx.fillStyle = VGA.cssCache[colorIdx];
        ctx.fillRect(x * 2, y * 2, w * 2, h * 2);
    },

    /** Single pixel (doubled for VGA 320→640) */
    pixel(ctx, x, y, colorIdx) {
        ctx.fillStyle = VGA.cssCache[colorIdx];
        ctx.fillRect(x * 2, y * 2, 2, 2);
    },

    /** Line (Bresenham) */
    line(ctx, x1, y1, x2, y2, colorIdx) {
        ctx.fillStyle = VGA.cssCache[colorIdx];
        let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        let sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        while (true) {
            ctx.fillRect(x1 * 2, y1 * 2, 2, 2);
            if (x1 === x2 && y1 === y2) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x1 += sx; }
            if (e2 < dx) { err += dx; y1 += sy; }
        }
    },

    /** VGA dither pattern (checkerboard of two colors) */
    dither(ctx, x, y, w, h, c1, c2) {
        const css1 = VGA.cssCache[c1], css2 = VGA.cssCache[c2];
        for (let py = y; py < y + h; py++) {
            for (let px = x; px < x + w; px++) {
                ctx.fillStyle = ((px + py) & 1) ? css2 : css1;
                ctx.fillRect(px * 2, py * 2, 2, 2);
            }
        }
    },

    /** Gradient fill (vertical, approximate with VGA colors) */
    gradient(ctx, x, y, w, h, topColor, botColor) {
        const t = VGA.palette[topColor], b = VGA.palette[botColor];
        const hm1 = Math.max(1, h - 1);
        for (let row = 0; row < h; row++) {
            const f = row / hm1;
            const r = Math.round(t[0] + (b[0] - t[0]) * f);
            const g = Math.round(t[1] + (b[1] - t[1]) * f);
            const bl = Math.round(t[2] + (b[2] - t[2]) * f);
            ctx.fillStyle = `rgb(${r},${g},${bl})`;
            ctx.fillRect(x * 2, (y + row) * 2, w * 2, 2);
        }
    },

    /** Ellipse */
    ellipse(ctx, cx, cy, rx, ry, colorIdx, filled = true) {
        const css = VGA.cssCache[colorIdx];
        ctx.save();
        ctx.fillStyle = css;
        ctx.strokeStyle = css;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx * 2, cy * 2, rx * 2, ry * 2, 0, 0, Math.PI * 2);
        if (filled) ctx.fill(); else ctx.stroke();
        ctx.restore();
    },

    /** Text in VGA style */
    text(ctx, str, x, y, colorIdx, size = 8) {
        ctx.fillStyle = VGA.cssCache[colorIdx];
        ctx.font = `${size * 2}px monospace`;
        ctx.fillText(str, x * 2, y * 2);
    },

    /** Seeded pseudo-random splatter/brush (AGI-style LFSR pattern)
     *  Uses polynomial 0xB8 from AGI brush splatter specification */
    splatter(ctx, cx, cy, size, colorIdx, seed) {
        // AGI splatter uses an 8-bit LFSR to decide which pixels to plot
        let lfsr = (seed & 0xFF) || 1;  // Seed the 8-bit LFSR
        ctx.fillStyle = VGA.cssCache[colorIdx];
        for (let py = cy - size; py <= cy + size; py++) {
            for (let px = cx - size; px <= cx + size; px++) {
                // Step the LFSR with AGI polynomial 0xB8
                const bit = ((lfsr >> 0) ^ (lfsr >> 3) ^ (lfsr >> 4) ^ (lfsr >> 5) ^ (lfsr >> 7)) & 1;
                lfsr = ((lfsr >> 1) | (bit << 7)) & 0xFF;
                if (lfsr & 1) {
                    const dx = px - cx, dy = py - cy;
                    if (dx * dx + dy * dy <= size * size) {
                        ctx.fillRect(px * 2, py * 2, 2, 2);
                    }
                }
            }
        }
    },

    /** Procedural tree */
    tree(ctx, x, y, seed) {
        const rng = new SeededRandom(seed);
        const trunkH = rng.int(12, 20);
        const canopyR = rng.int(8, 14);
        // Trunk
        Draw.rect(ctx, x - 2, y - trunkH, 4, trunkH, VGA.C.TREE_TRUNK);
        Draw.rect(ctx, x - 1, y - trunkH - 1, 2, 1, VGA.C.TREE_TRUNK);
        // Canopy (splattered ellipse)
        const cy = y - trunkH - canopyR + 2;
        for (let a = 0; a < 30; a++) {
            const ax = x + rng.int(-canopyR, canopyR);
            const ay = cy + rng.int(-canopyR + 2, canopyR - 2);
            const dx = ax - x, dy = ay - cy;
            if (dx * dx / (canopyR * canopyR) + dy * dy / ((canopyR - 2) * (canopyR - 2)) <= 1) {
                const shade = rng.next() > 0.5 ? VGA.C.TREE_LEAVES : VGA.C.GRASS_DARK;
                Draw.rect(ctx, ax, ay, rng.int(1, 3), rng.int(1, 2), shade);
            }
        }
        Draw.ellipse(ctx, x, cy, canopyR, canopyR - 2, VGA.C.TREE_LEAVES, false);
    },

    /** Procedural bush */
    bush(ctx, x, y, seed) {
        const rng = new SeededRandom(seed);
        const w = rng.int(6, 12);
        const h = rng.int(4, 7);
        for (let i = 0; i < 20; i++) {
            const bx = x + rng.int(-w, w);
            const by = y + rng.int(-h, 1);
            const shade = rng.next() > 0.4 ? VGA.C.GRASS_GREEN : VGA.C.TREE_LEAVES;
            Draw.rect(ctx, bx, by, rng.int(1, 3), rng.int(1, 2), shade);
        }
    },

    /** Procedural cloud */
    cloud(ctx, x, y, seed) {
        const rng = new SeededRandom(seed);
        const puffs = rng.int(3, 5);
        for (let i = 0; i < puffs; i++) {
            const px = x + i * rng.int(6, 10);
            const py = y + rng.int(-3, 3);
            const r = rng.int(5, 9);
            Draw.ellipse(ctx, px, py, r, r - 2, VGA.C.WHITE);
        }
    },

    /** Procedural streetlamp (detailed) */
    lamp(ctx, x, y) {
        // Base
        Draw.rect(ctx, x - 2, y - 1, 6, 2, VGA.C.DGRAY);
        // Pole
        Draw.rect(ctx, x, y - 30, 2, 30, VGA.C.METAL_GRAY);
        // Pole highlight
        Draw.rect(ctx, x + 1, y - 28, 1, 26, VGA.C.LGRAY);
        // Arm
        Draw.rect(ctx, x - 3, y - 32, 8, 3, VGA.C.DGRAY);
        // Lamp housing
        Draw.rect(ctx, x - 4, y - 35, 10, 3, VGA.C.DGRAY);
        // Light
        Draw.ellipse(ctx, x + 1, y - 34, 4, 3, VGA.C.LAMP_YELLOW);
        // Light glow
        Draw.ellipse(ctx, x + 1, y - 34, 6, 4, VGA.C.LAMP_YELLOW, false);
    },

    /** Procedural window */
    window(ctx, x, y, w, h, lit = false) {
        const frameColor = VGA.C.BUILDING_GRAY;
        Draw.rect(ctx, x, y, w, h, frameColor);
        Draw.rect(ctx, x + 1, y + 1, w - 2, h - 2, lit ? VGA.C.LAMP_YELLOW : VGA.C.WINDOW_CYAN);
        // Cross-bar
        Draw.rect(ctx, x + Math.floor(w / 2), y, 1, h, frameColor);
        Draw.rect(ctx, x, y + Math.floor(h / 2), w, 1, frameColor);
    },

    /** Procedural person (NPC) — enhanced with detail */
    person(ctx, x, y, seed, options = {}) {
        const rng = new SeededRandom(seed);
        const skinColor = options.skin || VGA.C.SKIN_LIGHT;
        const shirtColor = options.shirt || rng.pick([VGA.C.BLUE, VGA.C.RED, VGA.C.GREEN, VGA.C.BROWN, VGA.C.DGRAY]);
        const pantsColor = options.pants || rng.pick([VGA.C.DGRAY, VGA.C.BLUE, VGA.C.BROWN]);
        const hairColor = options.hair || rng.pick([VGA.C.HAIR_BROWN, VGA.C.HAIR_BLACK, VGA.C.YELLOW]);
        const isUniform = options.uniform || false;
        const shirt = isUniform ? VGA.C.UNIFORM_BLUE : shirtColor;
        const pants = isUniform ? VGA.C.UNIFORM_DARK : pantsColor;

        // Shadow
        Draw.ellipse(ctx, x, y + 1, 5, 2, VGA.C.BLACK);
        // Head
        Draw.ellipse(ctx, x, y - 22, 3, 4, skinColor);
        // Ears
        Draw.pixel(ctx, x - 3, y - 22, skinColor);
        Draw.pixel(ctx, x + 3, y - 22, skinColor);
        // Hair
        Draw.rect(ctx, x - 3, y - 27, 7, 3, hairColor);
        Draw.pixel(ctx, x - 3, y - 24, hairColor); // sideburn
        Draw.pixel(ctx, x + 3, y - 24, hairColor);
        // Eyes
        Draw.pixel(ctx, x - 1, y - 23, VGA.C.BLACK);
        Draw.pixel(ctx, x + 1, y - 23, VGA.C.BLACK);

        // Body
        Draw.rect(ctx, x - 4, y - 18, 9, 12, shirt);
        if (isUniform) {
            // Collar
            Draw.rect(ctx, x - 2, y - 19, 5, 2, VGA.C.UNIFORM_DARK);
            // Badge
            Draw.pixel(ctx, x - 2, y - 16, VGA.C.BADGE_GOLD);
            Draw.pixel(ctx, x - 3, y - 15, VGA.C.BADGE_GOLD);
            // Shoulder patches
            Draw.pixel(ctx, x - 4, y - 17, VGA.C.BADGE_GOLD);
            Draw.pixel(ctx, x + 4, y - 17, VGA.C.BADGE_GOLD);
            // Pocket flaps
            Draw.rect(ctx, x - 3, y - 12, 3, 1, VGA.C.UNIFORM_DARK);
            Draw.rect(ctx, x + 1, y - 12, 3, 1, VGA.C.UNIFORM_DARK);
            // Belt
            Draw.rect(ctx, x - 4, y - 7, 9, 1, VGA.C.BLACK);
            Draw.pixel(ctx, x, y - 7, VGA.C.METAL_GRAY); // buckle
        } else {
            // Collar/neckline
            Draw.pixel(ctx, x - 1, y - 19, skinColor);
            Draw.pixel(ctx, x + 1, y - 19, skinColor);
            // Button/detail
            Draw.pixel(ctx, x, y - 15, VGA.nearest(Math.max(0, VGA.palette[shirt][0] - 40), Math.max(0, VGA.palette[shirt][1] - 40), Math.max(0, VGA.palette[shirt][2] - 40)));
        }
        // Arms
        Draw.rect(ctx, x - 6, y - 17, 2, 8, shirt);
        Draw.rect(ctx, x + 5, y - 17, 2, 8, shirt);
        // Hands
        Draw.rect(ctx, x - 6, y - 9, 2, 2, skinColor);
        Draw.rect(ctx, x + 5, y - 9, 2, 2, skinColor);
        // Legs
        Draw.rect(ctx, x - 3, y - 6, 3, 6, pants);
        Draw.rect(ctx, x + 1, y - 6, 3, 6, pants);
        // Shoes
        Draw.rect(ctx, x - 4, y, 4, 2, VGA.C.BLACK);
        Draw.rect(ctx, x + 1, y, 4, 2, VGA.C.BLACK);
    },

    /**
     * Player character (Detective Mercer)
     * Uses AGI-style direction-to-loop mapping:
     *   0 = facing front/down, 1 = facing left (side profile),
     *   2 = facing right (side profile), 3 = facing back/up
     * Each direction has a distinct sprite. Left/right show a narrower
     * side profile with one eye, nose, and proper arm/leg layering.
     * Supports two outfits: plainclothes detective suit and police uniform.
     */
    player(ctx, x, y, direction, frame, wearingUniform) {
        // AGI direction mapping: 0=down(front), 1=left, 2=right, 3=up(back)
        const bobY = Math.sin(frame * 0.3) * 1;
        const armSwing = Math.sin(frame * 0.4) * 2;
        const py = y + bobY;

        // Outfit colors — consistent in all directions
        const bodyColor = wearingUniform ? VGA.C.UNIFORM_BLUE : VGA.C.DGRAY;
        const pantsColor = wearingUniform ? VGA.C.UNIFORM_DARK : VGA.C.DGRAY;
        const darkBody = wearingUniform ? VGA.C.UNIFORM_DARK : VGA.nearest(55, 55, 55);

        // Shadow
        Draw.ellipse(ctx, x, y + 1, 6, 2, VGA.C.BLACK);

        const isSide = (direction === 1 || direction === 2);
        // flip: +1 = facing right, -1 = facing left
        const f = (direction === 1) ? -1 : 1;

        if (isSide) {
            // ═══════════════════════════════════════
            //  SIDE VIEW (AGI Loop 1=left, Loop 2=right)
            // ═══════════════════════════════════════

            // Head (profile — slightly narrower)
            Draw.ellipse(ctx, x, py - 22, 3, 4, VGA.C.SKIN_LIGHT);
            // Ear (only the far-side ear visible)
            Draw.pixel(ctx, x - f * 3, py - 22, VGA.C.SKIN_LIGHT);
            // Hair
            Draw.rect(ctx, x - 3, py - 27, 7, 3, VGA.C.HAIR_BROWN);
            Draw.pixel(ctx, x - f * 3, py - 25, VGA.C.HAIR_BROWN); // sideburn
            // Eye (one eye, on the facing side)
            Draw.pixel(ctx, x + f * 1, py - 23, VGA.C.BLACK);
            // Nose bump
            Draw.pixel(ctx, x + f * 3, py - 22, VGA.C.SKIN_LIGHT);
            Draw.pixel(ctx, x + f * 3, py - 21, VGA.C.SKIN_LIGHT);
            // Mouth
            Draw.pixel(ctx, x + f * 1, py - 21, VGA.nearest(190, 140, 110));

            // Body (narrower profile — 6px wide instead of 9)
            Draw.rect(ctx, x - 3, py - 18, 7, 12, bodyColor);

            if (wearingUniform) {
                // Collar
                Draw.rect(ctx, x - 2, py - 19, 5, 2, darkBody);
                Draw.pixel(ctx, x, py - 19, VGA.C.WHITE); // undershirt peek
                // Shoulder patch (near side)
                Draw.pixel(ctx, x + f * 3, py - 17, VGA.C.BADGE_GOLD);
                // Badge (facing side)
                Draw.pixel(ctx, x + f * 1, py - 16, VGA.C.BADGE_GOLD);
                Draw.pixel(ctx, x + f * 1, py - 15, VGA.C.BADGE_GOLD);
                Draw.pixel(ctx, x + f * 2, py - 15, VGA.C.BADGE_GOLD);
                // Pocket flap (visible side)
                Draw.rect(ctx, x + f * 0, py - 13, 3, 1, darkBody);
                // Button line (side angle — offset toward viewer)
                Draw.pixel(ctx, x + f * 1, py - 16, darkBody);
                Draw.pixel(ctx, x + f * 1, py - 13, darkBody);
                Draw.pixel(ctx, x + f * 1, py - 10, darkBody);
                // Duty belt
                Draw.rect(ctx, x - 4, py - 7, 9, 2, VGA.C.BLACK);
                Draw.pixel(ctx, x, py - 7, VGA.C.METAL_GRAY);           // buckle
                Draw.pixel(ctx, x + f * 3, py - 6, VGA.C.METAL_GRAY);   // holster/radio
                Draw.pixel(ctx, x - f * 2, py - 6, VGA.C.METAL_GRAY);   // cuff case
            } else {
                // Detective suit side view
                // Jacket edge / lapel
                Draw.rect(ctx, x + f * 0, py - 18, 2, 7, VGA.C.WHITE); // shirt sliver
                Draw.pixel(ctx, x + f * 1, py - 18, darkBody); // lapel fold
                Draw.pixel(ctx, x + f * 1, py - 17, darkBody);
                // Tie (peeking out)
                Draw.pixel(ctx, x + f * 0, py - 17, VGA.C.RED);
                Draw.pixel(ctx, x + f * 0, py - 16, VGA.C.RED);
                Draw.pixel(ctx, x + f * 0, py - 15, VGA.C.RED);
                // Belt
                Draw.rect(ctx, x - 3, py - 7, 7, 1, VGA.C.BLACK);
                Draw.pixel(ctx, x, py - 7, VGA.C.METAL_GRAY);
                // Holster bulge (hip, facing side)
                Draw.pixel(ctx, x - f * 3, py - 10, darkBody);
            }

            // Far arm (behind body) — drawn first so body overlaps it
            Draw.rect(ctx, x - f * 3, py - 17 - armSwing, 2, 8, bodyColor);
            Draw.rect(ctx, x - f * 3, py - 9 - armSwing, 2, 2, VGA.C.SKIN_LIGHT);
            // Near arm (in front of body)
            Draw.rect(ctx, x + f * 2, py - 17 + armSwing, 2, 8, bodyColor);
            Draw.pixel(ctx, x + f * 2, py - 9 + armSwing, darkBody); // cuff
            Draw.rect(ctx, x + f * 2, py - 8 + armSwing, 2, 2, VGA.C.SKIN_LIGHT);

            // Legs — stride animation (one forward, one back)
            const stride = Math.sin(frame * 0.4) * 3;
            // Far leg (behind)
            Draw.rect(ctx, x - 1 - f * stride * 0.3, py - 5, 3, 6, pantsColor);
            // Near leg (in front)
            Draw.rect(ctx, x + f * stride * 0.3, py - 5, 3, 6, pantsColor);
            // Trouser crease on near leg
            Draw.rect(ctx, x + 1 + f * stride * 0.3, py - 4, 1, 4, darkBody);
            // Shoes
            Draw.rect(ctx, x - 2 - f * stride * 0.3, py + 1, 4, 2, VGA.C.BLACK);
            Draw.rect(ctx, x - 1 + f * stride * 0.3, py + 1, 4, 2, VGA.C.BLACK);
            Draw.pixel(ctx, x - 1 - f * stride * 0.3, py + 1, VGA.C.DGRAY); // shine

        } else {
            // Head (front/back share common head)
            Draw.ellipse(ctx, x, py - 22, 3, 4, VGA.C.SKIN_LIGHT);
            Draw.pixel(ctx, x - 3, py - 22, VGA.C.SKIN_LIGHT); // ear L
            Draw.pixel(ctx, x + 3, py - 22, VGA.C.SKIN_LIGHT); // ear R
            Draw.rect(ctx, x - 3, py - 27, 7, 3, VGA.C.HAIR_BROWN);
            Draw.pixel(ctx, x - 3, py - 25, VGA.C.HAIR_BROWN); // sideburn L
            Draw.pixel(ctx, x + 3, py - 25, VGA.C.HAIR_BROWN); // sideburn R

            if (direction === 3) {
                // ═══════════════════════════════════════
                //  BACK VIEW (AGI Loop 3)
                // ═══════════════════════════════════════
                Draw.rect(ctx, x - 4, py - 18, 9, 12, bodyColor);
                // Collar (back)
                Draw.rect(ctx, x - 2, py - 19, 5, 2, darkBody);
                if (wearingUniform) {
                    // Shoulder seam / epaulette tabs
                    Draw.pixel(ctx, x - 4, py - 17, VGA.C.BADGE_GOLD);
                    Draw.pixel(ctx, x + 4, py - 17, VGA.C.BADGE_GOLD);
                    // Back center seam
                    Draw.rect(ctx, x, py - 16, 1, 9, darkBody);
                    // Belt (duty belt with equipment)
                    Draw.rect(ctx, x - 5, py - 7, 11, 2, VGA.C.BLACK);
                    Draw.pixel(ctx, x - 3, py - 7, VGA.C.METAL_GRAY); // radio clip
                    Draw.pixel(ctx, x + 3, py - 7, VGA.C.METAL_GRAY); // cuff case
                    Draw.pixel(ctx, x, py - 7, VGA.C.METAL_GRAY);     // buckle
                } else {
                    // Jacket back seam
                    Draw.rect(ctx, x, py - 16, 1, 9, darkBody);
                    // Belt
                    Draw.rect(ctx, x - 4, py - 7, 9, 1, VGA.C.BLACK);
                }
                // Arms
                Draw.rect(ctx, x - 6, py - 17 + armSwing, 2, 8, bodyColor);
                Draw.rect(ctx, x + 5, py - 17 - armSwing, 2, 8, bodyColor);
                // Hands
                Draw.rect(ctx, x - 6, py - 9 + armSwing, 2, 2, VGA.C.SKIN_LIGHT);
                Draw.rect(ctx, x + 5, py - 9 - armSwing, 2, 2, VGA.C.SKIN_LIGHT);
            } else {
                // ═══════════════════════════════════════
                //  FRONT VIEW (AGI Loop 0)
                // ═══════════════════════════════════════
                Draw.rect(ctx, x - 4, py - 18, 9, 12, bodyColor);

                if (wearingUniform) {
                    // Collar
                    Draw.pixel(ctx, x - 2, py - 19, darkBody);
                    Draw.pixel(ctx, x - 1, py - 19, darkBody);
                    Draw.pixel(ctx, x + 1, py - 19, darkBody);
                    Draw.pixel(ctx, x + 2, py - 19, darkBody);
                    // Undershirt showing at collar
                    Draw.pixel(ctx, x, py - 19, VGA.C.WHITE);

                    // Badge (star shape approximated)
                    Draw.pixel(ctx, x - 2, py - 16, VGA.C.BADGE_GOLD);
                    Draw.pixel(ctx, x - 3, py - 15, VGA.C.BADGE_GOLD);
                    Draw.pixel(ctx, x - 2, py - 15, VGA.C.BADGE_GOLD);
                    Draw.pixel(ctx, x - 1, py - 15, VGA.C.BADGE_GOLD);

                    // Shoulder patches / epaulettes
                    Draw.pixel(ctx, x - 4, py - 17, VGA.C.BADGE_GOLD);
                    Draw.pixel(ctx, x + 4, py - 17, VGA.C.BADGE_GOLD);

                    // Shirt buttons center line
                    Draw.pixel(ctx, x, py - 16, darkBody);
                    Draw.pixel(ctx, x, py - 13, darkBody);
                    Draw.pixel(ctx, x, py - 10, darkBody);

                    // Pocket flaps
                    Draw.rect(ctx, x - 3, py - 13, 3, 1, darkBody);
                    Draw.rect(ctx, x + 1, py - 13, 3, 1, darkBody);
                    // Pocket outlines
                    Draw.rect(ctx, x - 3, py - 12, 3, 3, darkBody);
                    Draw.rect(ctx, x + 1, py - 12, 3, 3, darkBody);

                    // Name tag (right chest)
                    Draw.rect(ctx, x + 1, py - 16, 3, 1, VGA.C.WHITE);

                    // Duty belt (detailed)
                    Draw.rect(ctx, x - 5, py - 7, 11, 2, VGA.C.BLACK);
                    Draw.pixel(ctx, x, py - 7, VGA.C.METAL_GRAY);      // buckle
                    Draw.pixel(ctx, x - 3, py - 6, VGA.C.METAL_GRAY);  // radio holder
                    Draw.pixel(ctx, x + 3, py - 6, VGA.C.METAL_GRAY);  // cuff case
                    Draw.pixel(ctx, x - 4, py - 6, VGA.C.DGRAY);       // holster
                } else {
                    // Detective suit — jacket with lapels over white shirt
                    // Shirt under jacket
                    Draw.rect(ctx, x - 1, py - 18, 3, 8, VGA.C.WHITE);
                    // Lapels (V shape)
                    Draw.pixel(ctx, x - 2, py - 18, darkBody);
                    Draw.pixel(ctx, x - 1, py - 17, darkBody);
                    Draw.pixel(ctx, x + 2, py - 18, darkBody);
                    Draw.pixel(ctx, x + 1, py - 17, darkBody);
                    // Tie
                    Draw.pixel(ctx, x, py - 18, VGA.C.RED);
                    Draw.pixel(ctx, x, py - 17, VGA.C.RED);
                    Draw.pixel(ctx, x, py - 16, VGA.C.RED);
                    Draw.pixel(ctx, x, py - 15, VGA.C.RED);
                    Draw.pixel(ctx, x, py - 14, VGA.C.RED);
                    Draw.pixel(ctx, x - 1, py - 14, VGA.C.RED); // tie knot wider
                    Draw.pixel(ctx, x + 1, py - 14, VGA.C.RED);
                    // Jacket pocket hint
                    Draw.rect(ctx, x + 1, py - 12, 3, 1, darkBody);
                    // Belt and buckle
                    Draw.rect(ctx, x - 4, py - 7, 9, 1, VGA.C.BLACK);
                    Draw.pixel(ctx, x, py - 7, VGA.C.METAL_GRAY);
                    // Holster bulge (under jacket)
                    Draw.pixel(ctx, x - 4, py - 10, darkBody);
                }

                // Arms
                Draw.rect(ctx, x - 6, py - 17 + armSwing, 2, 8, bodyColor);
                Draw.rect(ctx, x + 5, py - 17 - armSwing, 2, 8, bodyColor);
                // Cuffs / sleeve ends
                Draw.pixel(ctx, x - 6, py - 9 + armSwing, darkBody);
                Draw.pixel(ctx, x + 5, py - 9 - armSwing, darkBody);
                // Hands
                Draw.rect(ctx, x - 6, py - 8 + armSwing, 2, 2, VGA.C.SKIN_LIGHT);
                Draw.rect(ctx, x + 5, py - 8 - armSwing, 2, 2, VGA.C.SKIN_LIGHT);
                // Face (front)
                Draw.pixel(ctx, x - 1, py - 23, VGA.C.BLACK); // eye
                Draw.pixel(ctx, x + 1, py - 23, VGA.C.BLACK); // eye
                // Mouth hint
                Draw.pixel(ctx, x, py - 21, VGA.nearest(190, 140, 110));
            }

            // Legs (with crease detail)
            const legSwing = Math.sin(frame * 0.4) * 2;
            Draw.rect(ctx, x - 3, py - 5, 3, 6, pantsColor);
            Draw.rect(ctx, x + 1, py - 5, 3, 6, pantsColor);
            // Trouser crease
            Draw.rect(ctx, x - 2, py - 4, 1, 4, darkBody);
            Draw.rect(ctx, x + 2, py - 4, 1, 4, darkBody);
            // Shoes (with shine)
            Draw.rect(ctx, x - 4 + legSwing * 0.3, py + 1, 4, 2, VGA.C.BLACK);
            Draw.rect(ctx, x + 1 - legSwing * 0.3, py + 1, 4, 2, VGA.C.BLACK);
            Draw.pixel(ctx, x - 3 + legSwing * 0.3, py + 1, VGA.C.DGRAY); // shine
            Draw.pixel(ctx, x + 2 - legSwing * 0.3, py + 1, VGA.C.DGRAY);
        }
    }
};


// ══════════════════════════════════════════════════════════════
//  GAME ENGINE
// ══════════════════════════════════════════════════════════════

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.ctx.imageSmoothingEnabled = false;

        // Display dimensions (render at 640×400, scaled from 320×200 logical)
        this.W = 320;
        this.H = 200;
        this.SCALE = 2;

        // State
        this.state = {
            room: 'lockerRoom',
            prevRoom: null,
            score: 0,
            maxScore: 225,
            verb: 'walk',
            selectedItem: null,
            inventory: [],
            flags: {},
            variables: {},
            playerX: 160,
            playerY: 150,
            playerDir: 0, // 0=down,1=left,2=right,3=up
            targetX: null,
            targetY: null,
            walking: false,
            walkSpeed: 1.5,
            frame: 0,
            parserActive: false,
            messageTimer: 0,
            dead: false,
            won: false,
            dialogCallback: null,
            gameStarted: false,
        };

        // Snapshot for restart
        this._initialState = null;

        // Systems
        this.parser = new TextParser();
        this.priority = new PrioritySystem();
        this.dissolve = new DissolveTransition();
        this.rooms = {};
        this.hotspots = [];

        // UI references
        this.scoreEl = document.getElementById('score-display');
        this.roomNameEl = document.getElementById('room-name');
        this.messageEl = document.getElementById('message-display');
        this.parserContainer = document.getElementById('parser-input-container');
        this.parserInput = document.getElementById('parser-input');

        this._bindEvents();
    }

    // ── Event Binding ──

    _bindEvents() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            audio.init();
            audio.resume();
            const rect = this.canvas.getBoundingClientRect();
            const sx = (e.clientX - rect.left) / rect.width * this.canvas.width;
            const sy = (e.clientY - rect.top) / rect.height * this.canvas.height;
            const x = Math.floor(sx / this.SCALE);
            const y = Math.floor(sy / this.SCALE);
            this._handleClick(x, y);
        });

        // Canvas hover — change cursor over hotspots and show name
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const sx = (e.clientX - rect.left) / rect.width * this.canvas.width;
            const sy = (e.clientY - rect.top) / rect.height * this.canvas.height;
            const x = Math.floor(sx / this.SCALE);
            const y = Math.floor(sy / this.SCALE);
            const hit = this._hitTestHotspots(x, y);
            this.canvas.style.cursor = hit ? 'pointer' : 'crosshair';
            // Show verb + target in message area (only if no timer message)
            if (!this.state.messageTimer) {
                if (hit) {
                    const verb = this.state.verb;
                    const itemName = this.state.selectedItem
                        ? (this.state.inventory.find(i => i.id === this.state.selectedItem)?.name || '')
                        : '';
                    const action = itemName ? `${verb} ${itemName} on ${hit.name}` : `${verb} ${hit.name}`;
                    this.messageEl.textContent = action.charAt(0).toUpperCase() + action.slice(1);
                } else {
                    this.messageEl.textContent = '';
                }
            }
        });

        // Verb buttons
        document.querySelectorAll('.verb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                audio.init();
                audio.resume();
                const verb = btn.dataset.verb;
                if (verb === 'inventory') {
                    this.showInventory();
                } else {
                    this.state.verb = verb;
                    this.state.selectedItem = null;
                    document.querySelectorAll('.verb-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            audio.init();
            audio.resume();
            this._handleKey(e);
        });

        // Parser input
        this.parserInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = this.parserInput.value.trim();
                if (text) {
                    this._processParserInput(text);
                }
                this.parserInput.value = '';
                this.toggleParser(false);
            } else if (e.key === 'Escape') {
                this.toggleParser(false);
            }
        });
    }

    _handleKey(e) {
        // If dialog is showing, advance it
        if (this.state.currentMessage || document.querySelector('.dialog-overlay')) {
            if (e.key === 'Enter' || e.key === ' ') {
                this._dismissDialog();
                return;
            }
        }

        if (this.state.dead || this.state.won) return;

        if (this.state.parserActive) return; // let parser input handle it

        switch (e.key) {
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.toggleParser(true);
                break;
            case '1': this._selectVerb('walk'); break;
            case '2': this._selectVerb('look'); break;
            case '3': this._selectVerb('get'); break;
            case '4': this._selectVerb('use'); break;
            case '5': this._selectVerb('talk'); break;
            case '6': this._selectVerb('open'); break;
            case '7': this._selectVerb('close'); break;
            case 'i': case 'I': this.showInventory(); break;
            case 'ArrowUp':
                e.preventDefault();
                this._startWalk(this.state.playerX, this.state.playerY - 30);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this._startWalk(this.state.playerX, this.state.playerY + 30);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this._startWalk(this.state.playerX - 30, this.state.playerY);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this._startWalk(this.state.playerX + 30, this.state.playerY);
                break;
            case 'Escape':
                this._closeOverlays();
                break;
        }
    }

    _selectVerb(verb) {
        this.state.verb = verb;
        this.state.selectedItem = null;
        document.querySelectorAll('.verb-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.verb === verb);
        });
    }

    _handleClick(x, y) {
        if (this.state.dead || this.state.won) return;
        if (this.dissolve.active) return;

        // Check dialog first
        if (this.state.currentMessage || document.querySelector('.dialog-overlay')) {
            this._dismissDialog();
            return;
        }

        const verb = this.state.verb;

        // Check hotspots
        const hit = this._hitTestHotspots(x, y);
        if (hit && verb !== 'walk') {
            this._interactHotspot(hit, verb);
            return;
        }

        // Walk
        if (verb === 'walk' || !hit) {
            this._startWalk(x, y);
        }
    }

    _hitTestHotspots(x, y) {
        const room = this.rooms[this.state.room];
        if (!room || !room.hotspots) return null;
        for (const hs of room.hotspots) {
            if (x >= hs.x && x < hs.x + hs.w && y >= hs.y && y < hs.y + hs.h) {
                return hs;
            }
        }
        return null;
    }

    _interactHotspot(hs, verb) {
        const room = this.rooms[this.state.room];
        if (!room) return;

        // Check room interaction handler first
        if (room.onInteract) {
            const handled = room.onInteract(this, verb, hs.id, hs);
            if (handled) return;
        }

        // Default look response
        if (verb === 'look' && hs.description) {
            this.showMessage(hs.description);
        } else if (verb === 'look') {
            this.showMessage(`You see ${hs.name || 'nothing special'}.`);
        } else {
            this.showMessage(`You can't ${verb} that.`);
        }
    }

    // ── Walking ──

    _startWalk(tx, ty) {
        const room = this.rooms[this.state.room];
        if (!room) return;

        // Clamp to walk bounds
        const wb = room.walkBounds || { x1: 10, y1: 100, x2: 310, y2: 190 };
        tx = Math.max(wb.x1, Math.min(wb.x2, tx));
        ty = Math.max(wb.y1, Math.min(wb.y2, ty));

        this.state.targetX = tx;
        this.state.targetY = ty;
        this.state.walking = true;

        // Determine direction
        const dx = tx - this.state.playerX;
        const dy = ty - this.state.playerY;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.state.playerDir = dx > 0 ? 2 : 1;
        } else {
            this.state.playerDir = dy > 0 ? 0 : 3;
        }
    }

    _updateWalk() {
        if (!this.state.walking) return;
        const dx = this.state.targetX - this.state.playerX;
        const dy = this.state.targetY - this.state.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
            this.state.playerX = this.state.targetX;
            this.state.playerY = this.state.targetY;
            this.state.walking = false;
            this.state.targetX = null;
            this.state.targetY = null;
            // Check exit triggers
            this._checkExits();
            return;
        }

        const speed = this.state.walkSpeed;
        this.state.playerX += (dx / dist) * speed;
        this.state.playerY += (dy / dist) * speed;

        // Footstep sound occasionally
        if (this.state.frame % 12 === 0) {
            audio.footstep();
        }
    }

    _checkExits() {
        const room = this.rooms[this.state.room];
        if (!room || !room.exits) return;
        for (const exit of room.exits) {
            const px = this.state.playerX, py = this.state.playerY;
            if (px >= exit.x1 && px <= exit.x2 && py >= exit.y1 && py <= exit.y2) {
                if (exit.condition && !exit.condition(this)) continue;
                this.changeRoom(exit.target, exit.enterX, exit.enterY, exit.enterDir);
                return;
            }
        }
    }

    // ── Room Management ──

    registerRoom(id, room) {
        this.rooms[id] = room;
    }

    changeRoom(roomId, px, py, dir) {
        if (!this.rooms[roomId]) {
            this.showMessage(`[Debug: Room "${roomId}" not found]`);
            return;
        }

        // Capture old frame
        const oldImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.state.prevRoom = this.state.room;
        this.state.room = roomId;

        if (px !== undefined) this.state.playerX = px;
        if (py !== undefined) this.state.playerY = py;
        if (dir !== undefined) this.state.playerDir = dir;
        this.state.walking = false;
        this.state.targetX = null;
        this.state.targetY = null;

        // Call room enter handler
        const room = this.rooms[roomId];
        if (room.onEnter) room.onEnter(this);

        // Update UI
        this.roomNameEl.textContent = room.name || roomId;
        this._updateScore();

        // Render new frame for dissolve
        this._renderRoom();
        const newImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Restore old frame and start dissolve
        this.ctx.putImageData(oldImageData, 0, 0);
        this.dissolve.start(oldImageData, newImageData);
        audio.roomTransition();
    }

    // ── Inventory ──

    addItem(id, name, icon, description) {
        if (this.state.inventory.find(i => i.id === id)) return false;
        this.state.inventory.push({ id, name, icon, description });
        audio.itemPickup();
        return true;
    }

    hasItem(id) {
        return this.state.inventory.some(i => i.id === id);
    }

    removeItem(id) {
        this.state.inventory = this.state.inventory.filter(i => i.id !== id);
    }

    showInventory() {
        this._closeOverlays();
        const overlay = document.createElement('div');
        overlay.className = 'inventory-overlay';

        let html = '<div class="inventory-panel"><div class="inventory-title">Inventory</div>';
        if (this.state.inventory.length === 0) {
            html += '<div style="text-align:center;color:#888;padding:20px;">Empty</div>';
        } else {
            html += '<div class="inventory-grid">';
            for (const item of this.state.inventory) {
                html += `<div class="inv-item" data-item-id="${item.id}">
                    <div class="inv-item-icon">${item.icon}</div>
                    <div>${item.name}</div>
                </div>`;
            }
            html += '</div>';
        }
        html += '</div>';
        overlay.innerHTML = html;

        overlay.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.inv-item');
            if (itemEl) {
                const itemId = itemEl.dataset.itemId;
                this.state.selectedItem = itemId;
                this.state.verb = 'use';
                this._selectVerb('use');
                this.showMessage(`Using: ${this.state.inventory.find(i => i.id === itemId)?.name || itemId}`);
                overlay.remove();
            } else {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);
    }

    // ── Score ──

    addScore(points) {
        this.state.score += points;
        this._updateScore();
        audio.scorePoint();
    }

    _updateScore() {
        this.scoreEl.textContent = `Score: ${this.state.score} of ${this.state.maxScore}`;
    }

    // ── Messages & Dialog ──

    showMessage(text, duration = 4000) {
        this.messageEl.textContent = text;
        if (this.state.messageTimer) clearTimeout(this.state.messageTimer);
        this.state.messageTimer = setTimeout(() => {
            this.messageEl.textContent = '';
            this.state.messageTimer = 0;
        }, duration);
    }

    showDialog(speaker, text, callback) {
        this._closeOverlays();
        // Convert markdown-style formatting to HTML
        const htmlText = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `<div class="dialog-box">
            ${speaker ? `<div class="speaker">${speaker}</div>` : ''}
            <div class="dialog-text">${htmlText}</div>
            <div class="dialog-continue">Press ENTER or click to continue</div>
        </div>`;
        this.state.dialogCallback = callback || null;
        overlay.addEventListener('click', () => this._dismissDialog());
        document.body.appendChild(overlay);
    }

    _dismissDialog() {
        const overlay = document.querySelector('.dialog-overlay');
        if (overlay) {
            overlay.remove();
            if (this.state.dialogCallback) {
                const cb = this.state.dialogCallback;
                this.state.dialogCallback = null;
                cb();
            }
        }
    }

    // ── Death ──

    die(message) {
        this.state.dead = true;
        audio.death();
        const overlay = document.createElement('div');
        overlay.className = 'death-overlay';
        overlay.innerHTML = `
            <h2>You have died!</h2>
            <p>${message}</p>
            <button id="restart-btn">Try Again</button>
        `;
        document.body.appendChild(overlay);
        document.getElementById('restart-btn').addEventListener('click', () => {
            overlay.remove();
            this._restart();
        });
    }

    _restart() {
        // Full restart — reload entire game state from snapshot
        if (this._initialState) {
            const saved = JSON.parse(this._initialState);
            Object.assign(this.state, saved);
            this.state.inventory = saved.inventory.map(i => ({ ...i }));
            this.state.flags = { ...saved.flags };
            this.state.variables = { ...saved.variables };
        } else {
            // Fallback: just reset death and reposition
            this.state.dead = false;
            this.state.walking = false;
        }
        const room = this.rooms[this.state.room];
        if (room && room.safeSpawn) {
            this.state.playerX = room.safeSpawn[0];
            this.state.playerY = room.safeSpawn[1];
        }
        this.state.dead = false;
        this.state.won = false;
        this.state.walking = false;
        this._updateScore();
        this.messageEl.textContent = '';
        if (room) this.roomNameEl.textContent = room.name || this.state.room;
    }

    // ── Text Parser ──

    toggleParser(on) {
        this.state.parserActive = on;
        this.parserContainer.style.display = on ? 'flex' : 'none';
        if (on) {
            this.parserInput.value = '';
            this.parserInput.focus();
        }
    }

    _processParserInput(text) {
        const result = this.parser.parse(text);
        if (!result.ok) {
            if (result.unknown) {
                this.showMessage(`I don't understand "${result.unknown}".`);
                audio.error();
            } else {
                this.showMessage("I don't understand that.");
                audio.error();
            }
            return;
        }

        // Special global commands
        if (this.parser.said(27)) { this.showInventory(); return; } // inventory
        if (this.parser.said(28)) { this.showMessage("Type commands like: look desk, get gun, talk captain, open door, use key on door"); return; }
        if (this.parser.said(26)) { this.showMessage("Game saved... just kidding. This is a browser game!"); return; }

        // Bare "look" — describe current room
        if (this.parser.verb() === 1 && this.parser.noun() === null) {
            const room = this.rooms[this.state.room];
            if (room) {
                const items = (room.hotspots || []).map(h => h.name).filter(Boolean);
                const desc = items.length > 0
                    ? `You are in: ${room.name}. You can see: ${items.join(', ')}.`
                    : `You are in: ${room.name}.`;
                this.showMessage(desc, 6000);
            }
            return;
        }

        // Delegate to current room handler
        const room = this.rooms[this.state.room];
        if (room && room.onParser) {
            const handled = room.onParser(this, this.parser);
            if (handled) return;
        }

        // Default responses
        const v = this.parser.verb();
        if (v === 1) this.showMessage("You don't see anything special.");
        else if (v === 2) this.showMessage("You can't take that.");
        else if (v === 7) this.showMessage("You can't go that way.");
        else this.showMessage("Nothing happens.");
    }

    // ── Utility ──

    _closeOverlays() {
        document.querySelectorAll('.inventory-overlay, .dialog-overlay').forEach(e => e.remove());
    }

    setFlag(name, val = true) { this.state.flags[name] = val; }
    getFlag(name) { return !!this.state.flags[name]; }
    setVar(name, val) { this.state.variables[name] = val; }
    getVar(name) { return this.state.variables[name] || 0; }

    // ── Rendering ──

    _renderRoom() {
        const room = this.rooms[this.state.room];
        if (!room) {
            // Clear to black
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Draw room background
        room.draw(this.ctx, this.state, this.state.frame);

        // Draw player
        if (!room.hidePlayer) {
            Draw.player(this.ctx, this.state.playerX, this.state.playerY,
                this.state.playerDir, this.state.walking ? this.state.frame : 0,
                !!this.state.flags.wearingUniform);
        }

        // Draw room foreground (things in front of player, based on priority)
        if (room.drawForeground) {
            room.drawForeground(this.ctx, this.state, this.state.frame);
        }
    }

    // ── Game Loop ──

    start(initialRoom) {
        if (initialRoom) this.state.room = initialRoom;
        this.state.gameStarted = true;
        this._updateScore();

        // Save initial state snapshot for restart
        this._initialState = JSON.stringify({
            room: this.state.room,
            score: this.state.score,
            inventory: [],
            flags: {},
            variables: {},
            playerX: this.state.playerX,
            playerY: this.state.playerY,
            playerDir: this.state.playerDir,
            verb: 'walk',
            selectedItem: null,
        });

        // Enter initial room
        const room = this.rooms[this.state.room];
        if (room) {
            if (room.onEnter) room.onEnter(this);
            this.roomNameEl.textContent = room.name || this.state.room;
        }

        const loop = () => {
            this.state.frame++;
            this._updateWalk();
            this._renderRoom();
            if (this.dissolve.active) {
                this.dissolve.step(this.ctx);
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
