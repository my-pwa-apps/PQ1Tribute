/* ── Badge of Honor — Room Definitions ──
 * All rooms procedurally generated with VGA palette
 * Original storyline: Detective Alex Mercer investigates a kidnapping ring in Oakdale
 *
 * STORY SYNOPSIS:
 * You are Detective Alex Mercer, a seasoned officer in the Oakdale Police Department.
 * A prominent businessman's daughter, Lily Chen, has been kidnapped. The department
 * is under pressure. You must gather your equipment, follow leads through the city,
 * interview witnesses, collect evidence, and ultimately raid the criminal hideout
 * to rescue Lily and bring the kidnappers to justice.
 *
 * ROOMS:
 * 1. Locker Room — Get equipped (gun, badge, radio, notebook, handcuffs)
 * 2. Briefing Room — Learn about the case from Captain Torres
 * 3. Station Hallway — Hub connecting station rooms
 * 4. Station Parking Lot — Get patrol car, drive to locations
 * 5. Downtown Street — Main investigation area  
 * 6. Rosie's Diner — Meet informant, get leads
 * 7. Crime Scene (apartment) — Gather evidence (fingerprints, photo, note)
 * 8. City Park — Encounter with suspicious person, chase
 * 9. Warehouse District — Find hideout  
 * 10. Warehouse Interior — Final confrontation, rescue Lily
 * 11. Captain's Office — Report back, victory
 */

'use strict';

function registerAllRooms(engine) {

    const G = engine; // shorthand
    const C = VGA.C;  // color shortcuts

    // ════════════════════════════════════════════════════════
    //  ROOM 1: LOCKER ROOM
    // ════════════════════════════════════════════════════════

    G.registerRoom('lockerRoom', {
        name: 'Police Station — Locker Room',
        walkBounds: { x1: 20, y1: 110, x2: 300, y2: 185 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'locker', x: 30, y: 30, w: 50, h: 80, name: 'Your locker',
              description: 'Your personal locker, number 7. It has your name on it: A. MERCER.' },
            { id: 'otherLockers', x: 90, y: 30, w: 120, h: 80, name: 'Other lockers',
              description: 'Rows of gray metal lockers. Some have photos and stickers on them.' },
            { id: 'bench', x: 100, y: 115, w: 80, h: 15, name: 'Bench',
              description: 'A wooden bench, worn smooth from years of use.' },
            { id: 'shower', x: 260, y: 40, w: 40, h: 70, name: 'Shower area',
              description: 'The shower area. Tiled walls with a constant drip.' },
            { id: 'mirror', x: 220, y: 45, w: 20, h: 30, name: 'Mirror',
              description: 'You see yourself: Detective Alex Mercer, 15 years on the force. Looking tired but determined.' },
        ],

        exits: [
            { x1: 140, y1: 185, x2: 180, y2: 195, target: 'hallway', enterX: 160, enterY: 115, enterDir: 3,
              condition: (g) => {
                  if (!g.hasItem('badge') || !g.hasItem('gun')) {
                      g.showMessage("You should get your equipment before heading out.");
                      return false;
                  }
                  if (!g.getFlag('wearingUniform')) {
                      g.showMessage("You can't go on duty in street clothes! Put on your uniform first.");
                      return false;
                  }
                  return true;
              }
            },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(42);
            // Floor
            Draw.rect(ctx, 0, 105, 320, 95, C.FLOOR_TILE);
            // Floor tile pattern
            for (let tx = 0; tx < 320; tx += 16) {
                for (let ty = 105; ty < 200; ty += 16) {
                    Draw.line(ctx, tx, ty, tx + 16, ty, C.LGRAY);
                    Draw.line(ctx, tx, ty, tx, ty + 16, C.LGRAY);
                }
            }

            // Walls
            Draw.rect(ctx, 0, 0, 320, 105, C.WALL_BEIGE);
            // Baseboard
            Draw.rect(ctx, 0, 100, 320, 5, C.BROWN);

            // Lockers - left side
            for (let i = 0; i < 5; i++) {
                const lx = 25 + i * 38;
                const isPlayer = (i === 0);
                const lockerColor = isPlayer ? C.LOCKER_GRAY : C.LOCKER_DARK;
                Draw.rect(ctx, lx, 25, 32, 78, lockerColor);
                Draw.rect(ctx, lx + 1, 26, 30, 76, C.LOCKER_GRAY);

                // Show player locker open with uniform inside
                if (isPlayer && state.flags.lockerOpen) {
                    // Open locker interior
                    Draw.rect(ctx, lx + 2, 27, 28, 74, VGA.nearest(20, 20, 25));
                    // Shelf at top
                    Draw.rect(ctx, lx + 2, 27, 28, 2, C.METAL_GRAY);

                    // Uniform hanging if not yet worn
                    if (!state.flags.wearingUniform) {
                        // Hanger (wire shape)
                        Draw.rect(ctx, lx + 12, 30, 6, 1, C.METAL_GRAY); // bar
                        Draw.pixel(ctx, lx + 15, 29, C.METAL_GRAY);      // hook top
                        Draw.pixel(ctx, lx + 15, 28, C.METAL_GRAY);
                        Draw.rect(ctx, lx + 10, 31, 1, 1, C.METAL_GRAY); // shoulder L
                        Draw.rect(ctx, lx + 19, 31, 1, 1, C.METAL_GRAY); // shoulder R

                        // Uniform shirt on hanger (detailed)
                        Draw.rect(ctx, lx + 8, 32, 14, 18, C.UNIFORM_BLUE);
                        // Collar
                        Draw.rect(ctx, lx + 10, 32, 10, 2, C.UNIFORM_DARK);
                        Draw.pixel(ctx, lx + 15, 32, C.WHITE); // undershirt at collar
                        // Shoulder patches
                        Draw.pixel(ctx, lx + 8, 34, C.BADGE_GOLD);
                        Draw.pixel(ctx, lx + 21, 34, C.BADGE_GOLD);
                        // Button line
                        for (let b = 0; b < 4; b++) {
                            Draw.pixel(ctx, lx + 15, 35 + b * 3, C.UNIFORM_DARK);
                        }
                        // Badge pinned on
                        Draw.pixel(ctx, lx + 11, 36, C.BADGE_GOLD);
                        Draw.pixel(ctx, lx + 10, 37, C.BADGE_GOLD);
                        Draw.pixel(ctx, lx + 12, 37, C.BADGE_GOLD);
                        // Pocket flaps
                        Draw.rect(ctx, lx + 10, 40, 4, 1, C.UNIFORM_DARK);
                        Draw.rect(ctx, lx + 16, 40, 4, 1, C.UNIFORM_DARK);
                        // Name tag
                        Draw.rect(ctx, lx + 16, 36, 4, 2, C.WHITE);

                        // Uniform pants folded on shelf below
                        Draw.rect(ctx, lx + 8, 54, 14, 8, C.UNIFORM_DARK);
                        Draw.rect(ctx, lx + 15, 54, 1, 8, VGA.nearest(15, 18, 50)); // crease

                        // Duty belt coiled on shelf
                        Draw.ellipse(ctx, lx + 15, 66, 4, 3, C.BLACK);
                        Draw.pixel(ctx, lx + 15, 66, C.METAL_GRAY); // buckle glint

                        // Police cap on top shelf
                        Draw.rect(ctx, lx + 18, 29, 8, 4, C.UNIFORM_DARK);
                        Draw.rect(ctx, lx + 17, 33, 10, 1, C.UNIFORM_BLUE);
                        Draw.pixel(ctx, lx + 22, 30, C.BADGE_GOLD); // cap badge
                    } else {
                        // Empty locker with some personal items
                        Draw.rect(ctx, lx + 8, 68, 12, 4, C.DGRAY); // civilian clothes folded
                        Draw.rect(ctx, lx + 18, 44, 6, 8, VGA.nearest(100, 60, 30)); // coffee thermos
                    }

                    // Hook on inside of door
                    Draw.pixel(ctx, lx + 27, 40, C.METAL_GRAY);
                } else {
                    // Vent slits (closed locker)
                    for (let s = 0; s < 4; s++) {
                        Draw.rect(ctx, lx + 8, 32 + s * 5, 16, 1, C.DGRAY);
                    }
                }

                // Handle
                Draw.rect(ctx, lx + 24, 60, 3, 6, C.METAL_GRAY);
                // Number
                Draw.text(ctx, `${i + 7}`, lx + 12, 88, C.BLACK, 6);
                if (isPlayer) {
                    Draw.text(ctx, 'MERCER', lx + 4, 95, C.BLACK, 5);
                }
            }

            // Bench
            Draw.rect(ctx, 95, 115, 90, 6, C.DESK_BROWN);
            Draw.rect(ctx, 100, 121, 4, 10, C.DESK_BROWN);
            Draw.rect(ctx, 176, 121, 4, 10, C.DESK_BROWN);

            // Shower area (right side)
            Draw.rect(ctx, 255, 25, 55, 80, C.WINDOW_CYAN);
            Draw.rect(ctx, 256, 26, 53, 78, C.WHITE);
            // Tiles
            for (let tx = 256; tx < 309; tx += 8) {
                for (let ty = 26; ty < 104; ty += 8) {
                    Draw.rect(ctx, tx, ty, 7, 7, C.WHITE);
                    Draw.line(ctx, tx, ty, tx + 7, ty, C.LGRAY);
                }
            }
            // Shower head
            Draw.rect(ctx, 278, 28, 8, 3, C.METAL_GRAY);
            Draw.rect(ctx, 281, 31, 2, 4, C.METAL_GRAY);

            // Mirror
            Draw.rect(ctx, 218, 42, 24, 34, C.DGRAY);
            Draw.rect(ctx, 220, 44, 20, 30, C.WINDOW_CYAN);
            // Mirror reflection highlight
            Draw.line(ctx, 221, 45, 221, 65, C.WHITE);

            // Wall clock
            Draw.ellipse(ctx, 205, 25, 8, 8, C.WHITE);
            Draw.ellipse(ctx, 205, 25, 8, 8, C.DGRAY, false);
            // Clock hands
            Draw.line(ctx, 205, 25, 205, 20, C.BLACK); // minute
            Draw.line(ctx, 205, 25, 209, 25, C.BLACK); // hour
            Draw.pixel(ctx, 205, 25, C.RED); // center

            // Ceiling vent
            Draw.rect(ctx, 160, 3, 20, 8, C.METAL_GRAY);
            for (let v = 0; v < 3; v++) {
                Draw.rect(ctx, 162, 4 + v * 3, 16, 1, C.DGRAY);
            }

            // Fluorescent lights
            Draw.rect(ctx, 60, 5, 80, 3, C.WHITE);
            Draw.rect(ctx, 200, 5, 60, 3, C.WHITE);
            // Light glow
            Draw.dither(ctx, 60, 8, 80, 2, C.WHITE, C.WALL_BEIGE);
            Draw.dither(ctx, 200, 8, 60, 2, C.WHITE, C.WALL_BEIGE);

            // Shower water drip (animated)
            if (frame % 45 < 15) {
                const dripY = 35 + (frame % 45);
                Draw.pixel(ctx, 282, dripY, C.WINDOW_CYAN);
            }
            if (frame % 45 > 30) {
                // Splash
                Draw.pixel(ctx, 281, 100, C.WINDOW_CYAN);
                Draw.pixel(ctx, 283, 99, C.WINDOW_CYAN);
            }

            // Wet spot on floor near shower
            Draw.dither(ctx, 268, 108, 20, 3, C.WINDOW_CYAN, C.FLOOR_TILE);

            // Towel draped on bench
            Draw.rect(ctx, 140, 113, 12, 3, C.WHITE);
            Draw.rect(ctx, 140, 116, 5, 6, C.WHITE); // hanging part

            // Exit door (bottom center)
            Draw.rect(ctx, 135, 90, 50, 15, C.DOOR_BROWN);
            Draw.text(ctx, 'EXIT', 148, 100, C.WHITE, 6);
            // Arrow on floor
            Draw.text(ctx, 'v', 158, 192, C.YELLOW, 7);
        },

        onInteract(g, verb, id, hs) {
            if (id === 'locker') {
                if (verb === 'open' || verb === 'use') {
                    if (g.getFlag('lockerOpen')) {
                        g.showMessage("The locker is already open.");
                        return true;
                    }
                    g.setFlag('lockerOpen', true);
                    g.showDialog('', 'You open your locker. Inside you find your police uniform, service pistol, badge, radio, handcuffs, and a notebook.', () => {
                        // Auto-collect items
                        if (g.addItem('gun', 'Service Pistol', '🔫', 'Standard-issue Oakdale PD sidearm.')) g.addScore(3);
                        if (g.addItem('badge', 'Detective Badge', '⭐', 'Your detective shield, #1247.')) g.addScore(2);
                        if (g.addItem('radio', 'Police Radio', '📻', 'Portable radio for dispatch communication.')) g.addScore(2);
                        if (g.addItem('handcuffs', 'Handcuffs', '⛓️', 'Standard-issue handcuffs.')) g.addScore(1);
                        if (g.addItem('notebook', 'Notebook', '📓', 'Your trusty detective notebook and pen.')) g.addScore(2);
                        g.showMessage("You collected: Pistol, Badge, Radio, Handcuffs, Notebook. Your uniform is still hanging in the locker.");
                    });
                    return true;
                }
                if (verb === 'close') {
                    if (!g.getFlag('lockerOpen')) {
                        g.showMessage("It's already closed.");
                    } else {
                        g.setFlag('lockerOpen', false);
                        g.showMessage("You close the locker.");
                        audio.doorClose();
                    }
                    return true;
                }
            }

            // Wear/change uniform via clicking locker
            if (id === 'locker' && verb === 'wear') {
                if (!g.getFlag('lockerOpen')) {
                    g.showMessage("You need to open your locker first.");
                    return true;
                }
                if (g.getFlag('wearingUniform')) {
                    g.showMessage("You're already wearing your uniform.");
                    return true;
                }
                g.setFlag('wearingUniform', true);
                g.addScore(5);
                g.showDialog('', 'You change out of your street clothes and into your police uniform. ' +
                    'The familiar weight of the badge on your chest feels reassuring. ' +
                    'You look like a proper officer of the law now.');
                return true;
            }

            if (id === 'mirror' && verb === 'look') {
                if (g.getFlag('wearingUniform')) {
                    g.showDialog('Alex Mercer',
                        "You see yourself in your crisp police uniform. Fifteen years on the force " +
                        "and the uniform still fits. Badge gleaming, ready for duty. " +
                        "Time to find Lily Chen.");
                } else {
                    g.showDialog('Alex Mercer',
                        "Fifteen years on the force. You're still in your street clothes — " +
                        "you should change into your uniform before heading out. " +
                        "Captain Torres runs a tight ship.");
                }
                return true;
            }

            if (id === 'shower') {
                if (verb === 'use') {
                    g.showMessage("No time for a shower. There's a missing girl out there.");
                    return true;
                }
            }

            if (id === 'bench' && verb === 'sit') {
                g.showMessage("No time to sit around. Lily Chen is counting on you.");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(4, 50) || p.said(3, 50)) { // open/get locker
                this.onInteract(g, 'open', 'locker');
                return true;
            }
            if (p.said(1, 50)) { // look locker
                g.showMessage(this.hotspots[0].description);
                return true;
            }
            if (p.said(3, 51)) { // get gun
                if (g.getFlag('lockerOpen')) {
                    if (!g.hasItem('gun')) {
                        g.addItem('gun', 'Service Pistol', '🔫', 'Standard-issue Oakdale PD sidearm.');
                        g.addScore(3);
                        g.showMessage("You take your pistol.");
                    } else {
                        g.showMessage("You already have it.");
                    }
                } else {
                    g.showMessage("You need to open your locker first.");
                }
                return true;
            }
            if (p.said(3, 52)) { // get badge
                if (!g.hasItem('badge')) {
                    if (g.getFlag('lockerOpen')) {
                        g.addItem('badge', 'Detective Badge', '⭐', 'Badge #1247.');
                        g.addScore(2);
                        g.showMessage("You pin your badge on.");
                    } else {
                        g.showMessage("Open your locker first.");
                    }
                } else {
                    g.showMessage("You already have your badge.");
                }
                return true;
            }
            if (p.said(1, 69)) { // look shower
                g.showMessage("The communal shower. Two of the shower heads are dripping.");
                return true;
            }
            // Wear/change uniform via parser
            if (p.said(11, 56) || p.said(3, 56)) { // wear/change uniform, use uniform
                if (!g.getFlag('lockerOpen')) {
                    g.showMessage("You need to open your locker first.");
                } else if (g.getFlag('wearingUniform')) {
                    g.showMessage("You're already wearing your uniform.");
                } else {
                    g.setFlag('wearingUniform', true);
                    g.addScore(5);
                    g.showDialog('', 'You change out of your street clothes and into your police uniform. ' +
                        'The familiar weight of the badge on your chest feels reassuring. ' +
                        'You look like a proper officer of the law now.');
                }
                return true;
            }
            if (p.said(2, 56) || p.said(3, 56)) { // get/take uniform
                if (!g.getFlag('lockerOpen')) {
                    g.showMessage("You need to open your locker first.");
                } else if (g.getFlag('wearingUniform')) {
                    g.showMessage("You're already wearing your uniform.");
                } else {
                    g.showMessage("You should put it on. Type 'wear uniform' or 'change clothes'.");
                }
                return true;
            }
            if (p.said(1, 56)) { // look uniform
                if (g.getFlag('wearingUniform')) {
                    g.showMessage("You're wearing your crisp police uniform. Badge pinned, looking sharp.");
                } else if (g.getFlag('lockerOpen')) {
                    g.showMessage("Your police uniform hangs neatly in the locker. Standard-issue Oakdale PD blues.");
                } else {
                    g.showMessage("Your uniform is in your locker.");
                }
                return true;
            }
            if (p.said(7, 91) || p.said(7, 60)) { // walk south / walk door
                if (!g.hasItem('badge') || !g.hasItem('gun')) {
                    g.showMessage("You should get your equipment before heading out.");
                } else if (!g.getFlag('wearingUniform')) {
                    g.showMessage("You can't go on duty in street clothes! Put on your uniform first.");
                } else {
                    g.changeRoom('hallway', 160, 115, 3);
                }
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('gameIntro')) {
                g.setFlag('gameIntro', true);
                setTimeout(() => {
                    g.showDialog('Radio Dispatch',
                        'All units: Missing person alert. Lily Chen, age 22, daughter of ' +
                        'businessman Richard Chen. Last seen 11:45 PM at her apartment on ' +
                        'Oak Street. Signs of forced entry. Detectives report to Captain Torres ' +
                        'for briefing.', () => {
                            g.showMessage("You'd better gear up and head to the briefing room. Open your locker to get your equipment.");
                        });
                }, 500);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 2: STATION HALLWAY  
    // ════════════════════════════════════════════════════════

    G.registerRoom('hallway', {
        name: 'Police Station — Hallway',
        walkBounds: { x1: 15, y1: 100, x2: 305, y2: 185 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'bulletinBoard', x: 40, y: 40, w: 50, h: 40, name: 'Bulletin board',
              description: 'A cork bulletin board covered with notices, wanted posters, and a faded "Employee of the Month" photo.' },
            { id: 'waterCooler', x: 250, y: 70, w: 20, h: 35, name: 'Water cooler',
              description: 'The break area water cooler. Someone left a half-eaten donut beside it.' },
            { id: 'corkBoard2', x: 105, y: 42, w: 40, h: 35, name: 'Case board',
              description: 'A board with photos and red string connecting them. You see "CHEN KIDNAPPING" written at the top.' },
            { id: 'coffeeMug', x: 255, y: 60, w: 12, h: 10, name: 'Coffee',
              description: 'Someone left a mug of coffee here. Still warm.' },
        ],

        exits: [
            // North: Briefing room
            { x1: 120, y1: 98, x2: 200, y2: 105, target: 'briefingRoom', enterX: 160, enterY: 175, enterDir: 3 },
            // South: Locker room
            { x1: 140, y1: 185, x2: 180, y2: 195, target: 'lockerRoom', enterX: 160, enterY: 140, enterDir: 0 },
            // West: Parking lot
            { x1: 0, y1: 110, x2: 15, y2: 175, target: 'parkingLot', enterX: 290, enterY: 150, enterDir: 1 },
            // East: Captain's office
            { x1: 300, y1: 110, x2: 320, y2: 170, target: 'captainOffice', enterX: 40, enterY: 150, enterDir: 2 },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(100);

            // Floor
            Draw.rect(ctx, 0, 95, 320, 105, C.FLOOR_TILE);
            for (let tx = 0; tx < 320; tx += 20) {
                for (let ty = 95; ty < 200; ty += 20) {
                    Draw.rect(ctx, tx, ty, 19, 19, C.FLOOR_TILE);
                    Draw.line(ctx, tx, ty, tx + 19, ty, C.LGRAY);
                    Draw.line(ctx, tx, ty, tx, ty + 19, C.LGRAY);
                }
            }

            // Walls
            Draw.rect(ctx, 0, 0, 320, 95, C.WALL_GREEN);
            // Baseboard
            Draw.rect(ctx, 0, 90, 320, 5, C.BROWN);

            // Bulletin board (left wall)
            Draw.rect(ctx, 35, 35, 60, 48, C.DESK_BROWN);
            Draw.rect(ctx, 37, 37, 56, 44, C.BROWN);
            // Pinned notes
            for (let i = 0; i < 6; i++) {
                const nx = 40 + rng.int(0, 44);
                const ny = 40 + rng.int(0, 34);
                Draw.rect(ctx, nx, ny, rng.int(6, 12), rng.int(5, 8), rng.pick([C.WHITE, C.YELLOW, C.LRED]));
            }

            // Case board (center-left)
            Draw.rect(ctx, 100, 38, 48, 40, C.WHITE);
            Draw.rect(ctx, 101, 39, 46, 38, C.LGRAY);
            // Photos
            Draw.rect(ctx, 105, 42, 10, 12, C.SKIN_LIGHT);
            Draw.rect(ctx, 120, 42, 10, 12, C.DGRAY);
            Draw.rect(ctx, 135, 42, 10, 12, C.SKIN_DARK);
            // Red string
            Draw.line(ctx, 110, 48, 125, 48, C.RED);
            Draw.line(ctx, 125, 48, 140, 48, C.RED);
            Draw.text(ctx, 'CHEN', 108, 67, C.RED, 5);

            // Doors
            // North - briefing room
            Draw.rect(ctx, 125, 75, 70, 20, C.DOOR_BROWN);
            Draw.rect(ctx, 127, 76, 30, 18, C.DOOR_BROWN);
            Draw.rect(ctx, 163, 76, 30, 18, C.DOOR_BROWN);
            Draw.text(ctx, 'BRIEFING', 133, 88, C.WHITE, 5);

            // East - Captain's office door
            Draw.rect(ctx, 298, 55, 22, 40, C.DOOR_BROWN);
            Draw.text(ctx, 'CAPT', 300, 70, C.BADGE_GOLD, 5);
            Draw.text(ctx, 'TORRES', 298, 78, C.BADGE_GOLD, 4);

            // Water cooler
            Draw.rect(ctx, 253, 68, 14, 28, C.WINDOW_CYAN);
            Draw.rect(ctx, 256, 62, 8, 6, C.LBLUE);

            // Overhead lights
            for (let lx = 40; lx < 300; lx += 80) {
                Draw.rect(ctx, lx, 4, 60, 3, C.WHITE);
                Draw.dither(ctx, lx, 7, 60, 2, C.WHITE, C.WALL_GREEN);
            }

            // Floor shine / wax reflection
            for (let i = 0; i < 8; i++) {
                const sx = rng.int(20, 300);
                const sy = rng.int(100, 190);
                Draw.pixel(ctx, sx, sy, C.WHITE);
            }

            // Fire extinguisher on wall (left of bulletin board)
            Draw.rect(ctx, 22, 60, 6, 14, C.RED);
            Draw.rect(ctx, 23, 58, 4, 3, C.METAL_GRAY); // handle
            Draw.pixel(ctx, 25, 74, C.BLACK); // hose nozzle

            // Officers walking in background
            if (frame % 300 < 150) {
                Draw.person(ctx, 80 + (frame % 150) * 0.3, 130, 201, { uniform: true });
            }

            // Direction labels
            Draw.text(ctx, '< Parking', 5, 145, C.YELLOW, 5);
            Draw.text(ctx, 'Office >', 270, 145, C.YELLOW, 5);
            Draw.text(ctx, '^ Briefing', 138, 98, C.YELLOW, 5);
            Draw.text(ctx, 'v Locker', 143, 192, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'coffeeMug' && (verb === 'get' || verb === 'use')) {
                if (!g.getFlag('drankCoffee')) {
                    g.setFlag('drankCoffee', true);
                    g.showMessage("You take a sip of the coffee. It's terrible. But it wakes you up a bit.");
                    g.addScore(1);
                } else {
                    g.showMessage("You already drank it. It was bad enough the first time.");
                }
                return true;
            }
            if (id === 'corkBoard2' && verb === 'look') {
                g.showDialog('',
                    'The case board has three photos connected with red string:\n\n' +
                    '• Lily Chen, 22 — the victim. Last seen at her apartment.\n' +
                    '• A grainy security camera shot of a dark van.\n' +
                    '• A sketch of a heavyset man with a scar on his left cheek.\n\n' +
                    'Scribbled notes read: "Apartment 4B, 221 Oak St" and "witness at Rosie\'s?"');
                if (!g.getFlag('readCaseBoard')) {
                    g.setFlag('readCaseBoard', true);
                    g.addScore(3);
                }
                return true;
            }
            return false;
        },

        onParser(g, p) {
            if (p.said(7, 90) || p.said(7, 103)) { // go north / go briefing
                g.changeRoom('briefingRoom', 160, 175, 3);
                return true;
            }
            if (p.said(7, 91) || p.said(7, 102)) { // go south / go locker
                g.changeRoom('lockerRoom', 160, 140, 0);
                return true;
            }
            if (p.said(7, 93) || p.said(7, 104)) { // go west / go parking
                g.changeRoom('parkingLot', 290, 150, 1);
                return true;
            }
            if (p.said(7, 92) || p.said(7, 101)) { // go east / go office
                g.changeRoom('captainOffice', 40, 150, 2);
                return true;
            }
            if (p.said(1, 61)) { // look memo/paper
                g.showMessage("You notice the case board. Might be worth a closer look.");
                return true;
            }
            return false;
        },
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 3: BRIEFING ROOM
    // ════════════════════════════════════════════════════════

    G.registerRoom('briefingRoom', {
        name: 'Police Station — Briefing Room',
        walkBounds: { x1: 20, y1: 110, x2: 300, y2: 185 },
        safeSpawn: [160, 160],

        hotspots: [
            { id: 'podium', x: 130, y: 40, w: 60, h: 30, name: 'Podium',
              description: 'The briefing podium. Captain Torres stands here during briefings.' },
            { id: 'whiteboard', x: 80, y: 20, w: 160, h: 25, name: 'Whiteboard',
              description: 'A whiteboard with "CHEN CASE — PRIORITY 1" written in red marker.' },
            { id: 'captain', x: 140, y: 60, w: 40, h: 40, name: 'Captain Torres',
              description: 'Captain Maria Torres. Stern-faced, 20 years on the force. She looks worried.' },
            { id: 'chairs', x: 40, y: 120, w: 240, h: 30, name: 'Chairs',
              description: 'Rows of folding chairs. A few other officers are seated.' },
            { id: 'caseFile', x: 145, y: 72, w: 30, h: 8, name: 'Case file',
              description: 'A manila folder marked "CONFIDENTIAL — CHEN, L."' },
        ],

        exits: [
            { x1: 140, y1: 185, x2: 180, y2: 195, target: 'hallway', enterX: 160, enterY: 108, enterDir: 0 },
        ],

        draw(ctx, state, frame) {
            // Floor
            Draw.rect(ctx, 0, 105, 320, 95, C.CARPET_RED);
            // Carpet texture
            const rng = new SeededRandom(200);
            for (let i = 0; i < 150; i++) {
                const cx = rng.int(0, 319);
                const cy = rng.int(105, 199);
                Draw.pixel(ctx, cx, cy, VGA.nearest(140, 45, 45));
            }

            // Walls
            Draw.rect(ctx, 0, 0, 320, 105, C.WALL_BEIGE);
            Draw.rect(ctx, 0, 98, 320, 5, C.BROWN);

            // Whiteboard
            Draw.rect(ctx, 75, 15, 170, 30, C.DGRAY);
            Draw.rect(ctx, 78, 17, 164, 26, C.WHITE);
            Draw.text(ctx, 'CHEN CASE', 100, 30, C.RED, 7);
            Draw.text(ctx, 'PRIORITY 1', 105, 38, C.RED, 5);
            // Whiteboard markers in tray
            Draw.rect(ctx, 78, 43, 30, 2, C.DGRAY); // tray
            Draw.rect(ctx, 80, 41, 4, 3, C.RED); // red marker
            Draw.rect(ctx, 86, 41, 4, 3, C.BLUE); // blue marker
            Draw.rect(ctx, 92, 41, 4, 3, C.BLACK); // black marker

            // American flag (left side)
            Draw.rect(ctx, 30, 20, 2, 50, C.BADGE_GOLD); // pole
            Draw.rect(ctx, 32, 20, 20, 12, C.RED);
            Draw.rect(ctx, 32, 23, 20, 2, C.WHITE);
            Draw.rect(ctx, 32, 27, 20, 2, C.WHITE);
            Draw.rect(ctx, 32, 20, 8, 8, C.BLUE); // union
            // Stars (dots)
            for (let sy = 0; sy < 2; sy++) {
                for (let sx = 0; sx < 3; sx++) {
                    Draw.pixel(ctx, 34 + sx * 2, 21 + sy * 3, C.WHITE);
                }
            }

            // Wall clock (right)
            Draw.ellipse(ctx, 275, 28, 7, 7, C.WHITE);
            Draw.ellipse(ctx, 275, 28, 7, 7, C.DGRAY, false);
            Draw.line(ctx, 275, 28, 275, 23, C.BLACK);
            Draw.line(ctx, 275, 28, 279, 28, C.BLACK);
            Draw.pixel(ctx, 275, 28, C.RED);

            // Podium
            Draw.rect(ctx, 140, 50, 40, 30, C.DESK_BROWN);
            Draw.rect(ctx, 141, 51, 38, 28, C.BROWN);

            // Captain Torres (standing at podium)
            if (!state.flags.briefingDone) {
                Draw.person(ctx, 160, 85, 500, { 
                    uniform: true,
                    skin: C.SKIN_DARK,
                    hair: C.HAIR_BLACK
                });
            }

            // Case file on podium
            Draw.rect(ctx, 148, 70, 24, 8, C.YELLOW);
            Draw.text(ctx, 'CASE', 151, 76, C.RED, 4);

            // Chairs (rows)
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 7; col++) {
                    const cx = 50 + col * 35;
                    const cy = 120 + row * 20;
                    Draw.rect(ctx, cx, cy, 12, 10, C.DGRAY);
                    Draw.rect(ctx, cx + 1, cy - 8, 10, 8, C.DGRAY);
                }
            }

            // A couple officers sitting
            Draw.person(ctx, 85, 132, 301, { uniform: true });
            Draw.person(ctx, 190, 132, 302, { uniform: true });

            // Exit
            Draw.text(ctx, 'v Exit', 148, 193, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'captain' && verb === 'talk') {
                if (!g.getFlag('briefingDone')) {
                    g.setFlag('briefingDone', true);
                    g.showDialog('Captain Torres',
                        "Mercer, listen up. Lily Chen was taken from her apartment last night around midnight. " +
                        "Neighbors heard a struggle. We found signs of forced entry — her door was kicked in.\n\n" +
                        "There's a witness who claims she saw a dark van parked outside. She hangs out at Rosie's Diner on Main Street.\n\n" +
                        "I need you to:\n" +
                        "1. Check the crime scene at 221 Oak Street, Apt 4B\n" +
                        "2. Talk to the witness at Rosie's Diner\n" +
                        "3. Find that van and whoever took her\n\n" +
                        "Take the case file. And Mercer — be careful. Richard Chen has powerful friends, " +
                        "and not all of them are on the right side of the law.",
                        () => {
                            g.addScore(10);
                            g.showMessage("Captain Torres hands you the case file. Time to get to work.");
                        });
                    return true;
                } else {
                    g.showDialog('Captain Torres',
                        "Any progress, Mercer? Check the crime scene and talk to the witness at Rosie's. " +
                        "And don't forget to take the case file if you haven't already.");
                    return true;
                }
            }

            if (id === 'caseFile' && (verb === 'get' || verb === 'look' || verb === 'use')) {
                if (!g.hasItem('caseFile')) {
                    if (!g.getFlag('briefingDone')) {
                        g.showMessage("You should talk to Captain Torres first.");
                        return true;
                    }
                    g.addItem('caseFile', 'Case File', '📁', 
                        'Chen kidnapping case file. Contains apartment address (221 Oak St, 4B), ' +
                        'description of dark van, and sketch of heavyset suspect with scar.');
                    g.addScore(3);
                    g.showMessage("You take the case file. It has the apartment address and suspect description.");
                } else {
                    g.showMessage("You already have the case file.");
                }
                return true;
            }

            if (id === 'whiteboard' && verb === 'look') {
                g.showMessage("The whiteboard reads: 'CHEN CASE — PRIORITY 1. Victim: Lily Chen, 22. Location: 221 Oak St. Suspect: Unknown male, heavyset, scarred.'");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(6, 122) || p.said(6, 129)) { // talk captain/officer
                this.onInteract(g, 'talk', 'captain');
                return true;
            }
            if (p.said(3, 67)) { // get file
                this.onInteract(g, 'get', 'caseFile');
                return true;
            }
            if (p.said(1, 67)) { // look file/read file
                if (g.hasItem('caseFile')) {
                    g.showMessage("The file details the Chen kidnapping: forced entry, dark van seen, heavyset suspect. Address: 221 Oak St, Apt 4B.");
                } else {
                    g.showMessage("There's a case file on the podium.");
                }
                return true;
            }
            if (p.said(7, 91)) { // go south
                g.changeRoom('hallway', 160, 108, 0);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('briefingDone')) {
                setTimeout(() => g.showMessage("Captain Torres is at the podium. You should talk to her."), 500);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 4: CAPTAIN'S OFFICE
    // ════════════════════════════════════════════════════════

    G.registerRoom('captainOffice', {
        name: "Captain Torres' Office",
        walkBounds: { x1: 20, y1: 100, x2: 300, y2: 185 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'desk', x: 120, y: 50, w: 80, h: 30, name: "Captain's desk",
              description: 'A large mahogany desk covered in papers, a desk lamp, and a framed commendation.' },
            { id: 'phone', x: 180, y: 55, w: 15, h: 10, name: 'Phone',
              description: 'A desk phone. The light is blinking — messages waiting.' },
            { id: 'fileCabinet', x: 260, y: 40, w: 30, h: 50, name: 'File cabinet',
              description: 'A metal file cabinet. Probably locked.' },
            { id: 'flag', x: 30, y: 20, w: 25, h: 50, name: 'American flag',
              description: 'An American flag on a brass stand.' },
            { id: 'commendation', x: 140, y: 20, w: 40, h: 20, name: 'Commendation',
              description: 'A framed commendation: "Captain Maria Torres — Outstanding Service, Oakdale PD, 2018."' },
        ],

        exits: [
            { x1: 0, y1: 110, x2: 15, y2: 175, target: 'hallway', enterX: 290, enterY: 150, enterDir: 1 },
        ],

        draw(ctx, state, frame) {
            // Floor — nicer carpet
            Draw.rect(ctx, 0, 95, 320, 105, C.CARPET_RED);
            const rng = new SeededRandom(301);
            for (let i = 0; i < 100; i++) {
                Draw.pixel(ctx, rng.int(0, 319), rng.int(95, 199), VGA.nearest(120, 35, 35));
            }

            // Walls
            Draw.rect(ctx, 0, 0, 320, 95, C.WALL_BEIGE);
            Draw.rect(ctx, 0, 88, 320, 5, C.BROWN);
            // Wood paneling lower half
            for (let px = 0; px < 320; px += 12) {
                Draw.rect(ctx, px, 60, 11, 28, VGA.nearest(160, 120, 80));
                Draw.line(ctx, px, 60, px, 88, VGA.nearest(130, 95, 60));
            }

            // Flag
            Draw.rect(ctx, 38, 15, 2, 55, C.BADGE_GOLD);
            Draw.rect(ctx, 25, 18, 20, 15, C.RED);
            Draw.rect(ctx, 25, 27, 20, 6, C.WHITE);
            Draw.rect(ctx, 25, 18, 8, 10, C.BLUE);

            // Desk
            Draw.rect(ctx, 115, 50, 90, 35, C.DESK_BROWN);
            Draw.rect(ctx, 116, 51, 88, 3, VGA.nearest(140, 100, 65)); // desktop surface
            // Papers
            Draw.rect(ctx, 125, 52, 15, 10, C.WHITE);
            Draw.rect(ctx, 145, 53, 12, 8, C.WHITE);
            // Lamp
            Draw.rect(ctx, 170, 42, 3, 12, C.METAL_GRAY);
            Draw.rect(ctx, 164, 38, 15, 5, C.LGREEN);
            // Phone
            Draw.rect(ctx, 182, 52, 12, 8, C.BLACK);
            if (frame % 60 < 30) Draw.pixel(ctx, 188, 53, C.LRED); // blinking light

            // Commendation
            Draw.rect(ctx, 138, 18, 44, 22, C.DESK_BROWN);
            Draw.rect(ctx, 140, 20, 40, 18, C.YELLOW);
            Draw.text(ctx, 'TORRES', 143, 28, C.BLACK, 4);

            // File cabinet
            Draw.rect(ctx, 258, 38, 34, 52, C.LOCKER_GRAY);
            for (let d = 0; d < 3; d++) {
                Draw.rect(ctx, 260, 40 + d * 16, 30, 14, C.LOCKER_DARK);
                Draw.rect(ctx, 272, 44 + d * 16, 6, 3, C.METAL_GRAY);
            }

            // Chair behind desk
            Draw.rect(ctx, 150, 82, 20, 14, C.BLACK);
            Draw.rect(ctx, 152, 72, 16, 12, C.BLACK);

            Draw.text(ctx, '< Hall', 5, 145, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'phone' && (verb === 'use' || verb === 'look')) {
                if (g.getFlag('hasWarrant') && !g.getFlag('calledSwat')) {
                    g.setFlag('calledSwat', true);
                    g.showDialog('Phone',
                        'You call SWAT and request backup at the warehouse on Harbor Road.\n\n' +
                        '"10-4 detective. SWAT team en route. ETA 15 minutes. Proceed with caution."',
                        () => {
                            g.addScore(5);
                            g.showMessage('SWAT is on the way. Head to the warehouse!');
                        });
                    return true;
                }
                g.showMessage("You pick up the phone. No urgent messages right now.");
                return true;
            }

            if (id === 'fileCabinet') {
                if (verb === 'open' || verb === 'use') {
                    if (g.getFlag('hasEvidence') && !g.getFlag('gotWarrant')) {
                        g.setFlag('gotWarrant', true);
                        g.setFlag('hasWarrant', true);
                        g.addItem('warrant', 'Search Warrant', '📋', 'A signed search warrant for the Harbor Road warehouse.');
                        g.addScore(10);
                        g.showDialog('',
                            "You find the blank warrant forms. Given the evidence you've collected — " +
                            "the fingerprints, the witness statement, and the ransom note — " +
                            "Captain Torres signs the search warrant for the Harbor Road warehouse.\n\n" +
                            "You now have a warrant. Call SWAT from the phone, then head to the warehouse!");
                    } else if (!g.getFlag('hasEvidence')) {
                        g.showMessage("You need more evidence before you can get a warrant.");
                    } else {
                        g.showMessage("You already have the warrant.");
                    }
                    return true;
                }
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(3, 78) || p.said(1, 78)) { // get/look warrant
                this.onInteract(g, 'open', 'fileCabinet');
                return true;
            }
            if (p.said(3, 59) || p.said(15, 9999)) { // use phone / call
                this.onInteract(g, 'use', 'phone');
                return true;
            }
            if (p.said(7, 93)) { // go west
                g.changeRoom('hallway', 290, 150, 1);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (g.getFlag('hasEvidence') && !g.getFlag('gotWarrant')) {
                setTimeout(() => g.showMessage("You have enough evidence. Check the file cabinet for warrant forms."), 500);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 5: STATION PARKING LOT
    // ════════════════════════════════════════════════════════

    G.registerRoom('parkingLot', {
        name: 'Police Station — Parking Lot',
        walkBounds: { x1: 10, y1: 100, x2: 310, y2: 190 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'yourCar', x: 50, y: 115, w: 60, h: 30, name: 'Your patrol car',
              description: 'Your unmarked detective sedan. Dark blue, a bit dusty.' },
            { id: 'otherCars', x: 160, y: 120, w: 80, h: 25, name: 'Patrol cars',
              description: 'A row of black-and-white Oakdale PD patrol cars.' },
            { id: 'map', x: 60, y: 135, w: 15, h: 10, name: 'City map',
              description: 'A laminated city map tucked under the visor.' },
        ],

        exits: [
            // East: back into station
            { x1: 305, y1: 110, x2: 320, y2: 175, target: 'hallway', enterX: 25, enterY: 150, enterDir: 2 },
            // North: drives to downtown (need car keys/badge)
            { x1: 80, y1: 98, x2: 200, y2: 108, target: 'downtownStreet', enterX: 160, enterY: 180, enterDir: 3,
              condition: (g) => {
                  if (!g.getFlag('briefingDone')) {
                      g.showMessage("You should attend the briefing before heading out.");
                      return false;
                  }
                  if (!g.hasItem('caseFile')) {
                      g.showMessage("Grab the case file from the briefing room first.");
                      return false;
                  }
                  return true;
              }
            },
        ],

        draw(ctx, state, frame) {
            // Sky
            Draw.gradient(ctx, 0, 0, 320, 55, C.SKY_BLUE, C.SKY_LIGHT);

            // Clouds
            Draw.cloud(ctx, 30, 15, 500);
            Draw.cloud(ctx, 200, 20, 501);

            // Parking lot surface
            Draw.rect(ctx, 0, 55, 320, 145, C.ROAD_GRAY);
            // Parking lines
            for (let lx = 30; lx < 300; lx += 50) {
                Draw.rect(ctx, lx, 110, 2, 35, C.YELLOW);
            }
            // Speed bump
            Draw.dither(ctx, 80, 100, 140, 3, C.YELLOW, C.ROAD_GRAY);

            // Station building (background)
            Draw.rect(ctx, 220, 30, 100, 70, C.BUILDING_GRAY);
            Draw.rect(ctx, 230, 40, 20, 15, C.WINDOW_CYAN);
            Draw.rect(ctx, 260, 40, 20, 15, C.WINDOW_CYAN);
            Draw.rect(ctx, 290, 40, 20, 15, C.WINDOW_CYAN);
            Draw.rect(ctx, 265, 65, 18, 35, C.DOOR_BROWN);
            Draw.text(ctx, 'OAKDALE PD', 228, 35, C.WHITE, 5);

            // Your car — dark blue sedan
            drawCar(ctx, 55, 130, C.UNIFORM_BLUE, C.UNIFORM_DARK, false);

            // Patrol cars
            drawCar(ctx, 170, 135, C.CAR_WHITE, C.CAR_BLACK, true);
            drawCar(ctx, 230, 135, C.CAR_WHITE, C.CAR_BLACK, true);

            // Chain link fence on the left
            for (let fy = 55; fy < 98; fy += 4) {
                Draw.line(ctx, 0, fy, 50, fy, C.LGRAY);
            }

            Draw.text(ctx, 'Station >', 272, 145, C.YELLOW, 5);
            Draw.text(ctx, '^ Drive to City', 100, 100, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'yourCar') {
                if (verb === 'use' || verb === 'open') {
                    if (!g.getFlag('briefingDone')) {
                        g.showMessage("You should attend the briefing first.");
                    } else if (!g.hasItem('caseFile')) {
                        g.showMessage("Grab the case file before heading out.");
                    } else {
                        audio.carStart();
                        g.showMessage("You start the car. Where to?");
                        g.setFlag('carStarted', true);
                        // Walk to top to drive out
                    }
                    return true;
                }
                if (verb === 'look') {
                    g.showMessage("Your unmarked sedan. Needs a wash, but it runs well.");
                    if (!g.getFlag('foundMap')) {
                        g.showMessage("You notice a city map tucked under the visor.");
                    }
                    return true;
                }
            }
            if (id === 'map' && (verb === 'get' || verb === 'look')) {
                if (!g.hasItem('map')) {
                    g.addItem('map', 'City Map', '🗺️', 'Map of Oakdale. Key locations: Oak St (crime scene), Main St (Rosie\'s Diner), Harbor Rd (warehouse district), Riverside Park.');
                    g.setFlag('foundMap', true);
                    g.addScore(2);
                    g.showMessage("You take the city map. It shows the key areas of Oakdale.");
                } else {
                    g.showMessage("Map of Oakdale: Oak St (apartment), Main St (diner), Harbor Rd (warehouse), Riverside Park.");
                }
                return true;
            }
            return false;
        },

        onParser(g, p) {
            if (p.said(13, 62) || p.said(3, 62) || p.said(7, 90)) { // drive car / get car / go north
                if (!g.getFlag('briefingDone')) {
                    g.showMessage("Attend the briefing first.");
                } else if (!g.hasItem('caseFile')) {
                    g.showMessage("Get the case file from the briefing room.");
                } else {
                    audio.carStart();
                    g.changeRoom('downtownStreet', 160, 180, 3);
                }
                return true;
            }
            if (p.said(7, 92)) { // go east
                g.changeRoom('hallway', 25, 150, 2);
                return true;
            }
            if (p.said(3, 75) || p.said(1, 75)) { // get/look map
                this.onInteract(g, 'get', 'map');
                return true;
            }
            return false;
        },
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 6: DOWNTOWN STREET (Hub for city locations)
    // ════════════════════════════════════════════════════════

    G.registerRoom('downtownStreet', {
        name: 'Downtown Oakdale — Main Street',
        walkBounds: { x1: 10, y1: 130, x2: 310, y2: 190 },
        safeSpawn: [160, 165],

        hotspots: [
            { id: 'dinerSign', x: 30, y: 40, w: 70, h: 25, name: "Rosie's Diner",
              description: "A neon sign reads 'ROSIE'S DINER — Open 24 Hours'. Looks like a classic greasy spoon." },
            { id: 'dinerDoor', x: 50, y: 75, w: 25, h: 30, name: 'Diner entrance',
              description: 'Glass door with a vintage "OPEN" sign.' },
            { id: 'apartmentSign', x: 200, y: 40, w: 60, h: 15, name: '221 Oak Street',
              description: 'An apartment building. The address reads 221 Oak Street.' },
            { id: 'apartmentDoor', x: 220, y: 75, w: 20, h: 30, name: 'Apartment entrance',
              description: 'The front entrance to the apartment building.' },
            { id: 'parkSign', x: 270, y: 120, w: 40, h: 15, name: 'Park sign',
              description: '"Riverside Park — 2 blocks east"' },
        ],

        exits: [
            // South: back to station
            { x1: 140, y1: 188, x2: 180, y2: 200, target: 'parkingLot', enterX: 160, enterY: 120, enterDir: 0 },
            // Enter diner (walk to diner door)
            { x1: 30, y1: 130, x2: 80, y2: 145, target: 'diner', enterX: 160, enterY: 175, enterDir: 3 },
            // Enter apartment (walk to apartment door area)
            { x1: 200, y1: 130, x2: 250, y2: 145, target: 'crimeScene', enterX: 160, enterY: 175, enterDir: 3 },
            // East to park
            { x1: 305, y1: 140, x2: 320, y2: 185, target: 'park', enterX: 20, enterY: 160, enterDir: 2 },
            // West to warehouse district (only after getting info)
            { x1: 0, y1: 140, x2: 12, y2: 185, target: 'warehouseExterior', enterX: 290, enterY: 160, enterDir: 1,
              condition: (g) => {
                  if (!g.getFlag('knowsWarehouse')) {
                      g.showMessage("You don't know where to look in that direction yet.");
                      return false;
                  }
                  return true;
              }
            },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(600);

            // Sky
            Draw.gradient(ctx, 0, 0, 320, 40, C.SKY_BLUE, C.SKY_LIGHT);
            Draw.cloud(ctx, 50, 8, 601);
            Draw.cloud(ctx, 220, 12, 602);

            // Buildings background
            // Diner (left)
            Draw.rect(ctx, 15, 30, 100, 75, C.BUILDING_BRICK);
            Draw.rect(ctx, 20, 35, 90, 5, VGA.nearest(180, 90, 70)); // trim
            // Neon sign
            const neonFlicker = Math.sin(frame * 0.15) > -0.3;
            if (neonFlicker) {
                Draw.rect(ctx, 25, 40, 80, 22, VGA.nearest(60,20,20));
                Draw.text(ctx, "ROSIE'S", 32, 52, C.NEON_RED, 7);
                Draw.text(ctx, 'DINER', 42, 60, C.NEON_GREEN, 6);
            } else {
                Draw.rect(ctx, 25, 40, 80, 22, VGA.nearest(40,15,15));
                Draw.text(ctx, "ROSIE'S", 32, 52, VGA.nearest(150,30,30), 7);
            }
            // Diner windows
            Draw.window(ctx, 25, 70, 20, 15, true);
            Draw.window(ctx, 80, 70, 20, 15, true);
            // Diner door
            Draw.rect(ctx, 50, 72, 20, 33, C.DOOR_BROWN);
            Draw.rect(ctx, 52, 74, 16, 20, C.WINDOW_CYAN);
            Draw.text(ctx, 'OPEN', 53, 88, C.LGREEN, 4);

            // Apartment building (right)
            Draw.rect(ctx, 180, 25, 100, 80, C.BUILDING_TAN);
            // Windows grid
            for (let wy = 0; wy < 3; wy++) {
                for (let wx = 0; wx < 4; wx++) {
                    const lit = rng.next() > 0.4;
                    Draw.window(ctx, 188 + wx * 22, 32 + wy * 18, 14, 12, lit);
                }
            }
            Draw.text(ctx, '221', 225, 30, C.WHITE, 6);
            // Apartment door
            Draw.rect(ctx, 218, 72, 24, 33, C.DOOR_BROWN);
            Draw.rect(ctx, 222, 82, 6, 3, C.BADGE_GOLD); // handle

            // Sidewalk
            Draw.rect(ctx, 0, 105, 320, 25, C.SIDEWALK);
            for (let sx = 0; sx < 320; sx += 32) {
                Draw.line(ctx, sx, 105, sx, 130, C.LGRAY);
            }

            // Road
            Draw.rect(ctx, 0, 130, 320, 70, C.ROAD_GRAY);
            // Center line (dashed)
            for (let dx = 0; dx < 320; dx += 16) {
                Draw.rect(ctx, dx, 163, 8, 2, C.YELLOW);
            }

            // Streetlamps
            Draw.lamp(ctx, 120, 125);
            Draw.lamp(ctx, 260, 125);

            // Parked car
            drawCar(ctx, 140, 155, C.LRED, VGA.nearest(120,30,30), false);

            // Park sign (far right)
            Draw.rect(ctx, 285, 118, 30, 12, C.GREEN);
            Draw.text(ctx, 'PARK', 289, 126, C.WHITE, 4);
            Draw.text(ctx, '->', 290, 133, C.YELLOW, 5);

            // Direction labels
            Draw.text(ctx, 'v Station', 138, 195, C.YELLOW, 5);
            if (state.flags.knowsWarehouse) {
                Draw.text(ctx, '< Warehouse', 2, 165, C.YELLOW, 5);
            }
        },

        onInteract(g, verb, id) {
            if (id === 'dinerDoor' && (verb === 'open' || verb === 'use' || verb === 'walk')) {
                g.changeRoom('diner', 160, 175, 3);
                return true;
            }
            if (id === 'apartmentDoor' && (verb === 'open' || verb === 'use' || verb === 'walk')) {
                g.changeRoom('crimeScene', 160, 175, 3);
                return true;
            }
            return false;
        },

        onParser(g, p) {
            if (p.said(7, 108) || p.said(4, 108)) { // go/open diner
                g.changeRoom('diner', 160, 175, 3);
                return true;
            }
            if (p.said(7, 112) || p.said(7, 107)) { // go apartment/go street
                g.changeRoom('crimeScene', 160, 175, 3);
                return true;
            }
            if (p.said(7, 110)) { // go park
                g.changeRoom('park', 20, 160, 2);
                return true;
            }
            if (p.said(7, 113) || p.said(7, 93)) { // go warehouse / go west
                if (g.getFlag('knowsWarehouse')) {
                    g.changeRoom('warehouseExterior', 290, 160, 1);
                } else {
                    g.showMessage("You don't know where to go west of here.");
                }
                return true;
            }
            if (p.said(7, 91) || p.said(7, 100)) { // go south / go station
                g.changeRoom('parkingLot', 160, 120, 0);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('visitedDowntown')) {
                g.setFlag('visitedDowntown', true);
                setTimeout(() => g.showMessage("Downtown Oakdale. Rosie's Diner is to the left, the apartment building is to the right."), 500);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 7: ROSIE'S DINER
    // ════════════════════════════════════════════════════════

    G.registerRoom('diner', {
        name: "Rosie's Diner",
        walkBounds: { x1: 20, y1: 100, x2: 300, y2: 185 },
        safeSpawn: [160, 160],

        hotspots: [
            { id: 'counter', x: 10, y: 55, w: 125, h: 20, name: 'Counter',
              description: 'A long diner counter with red vinyl stools. Coffee stains and napkin dispensers.' },
            { id: 'rosie', x: 60, y: 35, w: 30, h: 25, name: 'Rosie',
              description: 'Rosie, the owner. A large woman with curly red hair, wiping glasses behind the counter.' },
            { id: 'witness', x: 220, y: 95, w: 30, h: 30, name: 'Nervous woman',
              description: 'A nervous-looking young woman in a booth, fidgeting with a coffee cup. She keeps looking at the door.' },
            { id: 'jukebox', x: 270, y: 50, w: 25, h: 40, name: 'Jukebox',
              description: 'A vintage jukebox. Currently playing some old country song.' },
            { id: 'booth1', x: 180, y: 85, w: 60, h: 20, name: 'Booth',
              description: 'A red vinyl booth. Well-worn but clean.' },
            { id: 'menuBoard', x: 45, y: 20, w: 50, h: 15, name: 'Menu board',
              description: "Today's special: Meatloaf and mashed potatoes, $6.99. Coffee, $1.50." },
        ],

        exits: [
            { x1: 140, y1: 185, x2: 180, y2: 200, target: 'downtownStreet', enterX: 55, enterY: 135, enterDir: 0 },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(700);

            // Floor — black and white checkered tile
            for (let ty = 95; ty < 200; ty += 8) {
                for (let tx = 0; tx < 320; tx += 8) {
                    const check = ((tx / 8 + ty / 8) % 2 === 0);
                    Draw.rect(ctx, tx, ty, 8, 8, check ? C.WHITE : C.BLACK);
                }
            }
            // Floor shine reflections
            for (let i = 0; i < 6; i++) {
                Draw.pixel(ctx, rng.int(10, 310), rng.int(100, 195), C.LGRAY);
            }

            // Walls — warm colors
            Draw.rect(ctx, 0, 0, 320, 95, VGA.nearest(200, 170, 130));
            Draw.rect(ctx, 0, 88, 320, 5, C.BROWN);
            // Wainscoting
            Draw.rect(ctx, 0, 70, 320, 18, VGA.nearest(170, 140, 100));
            Draw.line(ctx, 0, 70, 320, 70, VGA.nearest(140, 110, 75));

            // Ceiling fan (animated)
            const fanCx = 160;
            const fanAngle = frame * 0.2;
            Draw.pixel(ctx, fanCx, 5, C.DGRAY); // mount
            Draw.rect(ctx, fanCx - 1, 5, 2, 3, C.DGRAY); // rod
            for (let b = 0; b < 4; b++) {
                const a = fanAngle + b * (Math.PI / 2);
                const bx = fanCx + Math.cos(a) * 12;
                const by = 10 + Math.sin(a) * 3; // foreshortened
                Draw.line(ctx, fanCx, 8, Math.round(bx), Math.round(by), C.DESK_BROWN);
            }

            // Counter (left side)
            Draw.rect(ctx, 5, 55, 130, 22, VGA.nearest(170, 70, 60)); // counter top
            Draw.rect(ctx, 5, 56, 130, 3, C.METAL_GRAY); // chrome edge
            // Stools
            for (let s = 0; s < 5; s++) {
                const sx = 20 + s * 25;
                Draw.rect(ctx, sx, 77, 2, 12, C.METAL_GRAY); // pole
                Draw.ellipse(ctx, sx + 1, 76, 6, 3, C.RED); // seat
            }

            // Back wall — shelves
            Draw.rect(ctx, 5, 15, 130, 38, VGA.nearest(160, 130, 100));
            for (let sh = 0; sh < 3; sh++) {
                Draw.rect(ctx, 8, 18 + sh * 12, 124, 2, C.DESK_BROWN);
                // Bottles/cups on shelves
                for (let i = 0; i < 6; i++) {
                    const bx = 12 + i * 20;
                    const by = 10 + sh * 12;
                    const clr = rng.pick([C.RED, C.GREEN, C.BLUE, C.BROWN, C.WHITE]);
                    Draw.rect(ctx, bx, by, 4, 7, clr);
                }
            }

            // Menu board
            Draw.rect(ctx, 42, 18, 55, 18, C.BLACK);
            Draw.text(ctx, 'SPECIAL', 48, 26, C.YELLOW, 5);
            Draw.text(ctx, '$6.99', 52, 33, C.WHITE, 5);

            // Rosie behind counter
            Draw.person(ctx, 75, 55, 700, { 
                skin: C.SKIN_LIGHT,
                shirt: C.WHITE,
                hair: VGA.nearest(200, 80, 40),
                pants: C.BLACK 
            });

            // Coffee machine
            Draw.rect(ctx, 120, 40, 12, 15, C.METAL_GRAY);
            Draw.rect(ctx, 122, 42, 8, 4, C.BLACK);
            // Steam
            if (frame % 30 < 15) {
                Draw.pixel(ctx, 126, 38, C.WHITE);
                Draw.pixel(ctx, 128, 36, C.LGRAY);
            }

            // Booths (right side)
            for (let b = 0; b < 2; b++) {
                const by = 85 + b * 30;
                Draw.rect(ctx, 175, by, 65, 20, C.RED); // seat back
                Draw.rect(ctx, 180, by + 4, 55, 2, C.DESK_BROWN); // table
            }

            // Witness in booth
            if (!state.flags.witnessLeft) {
                Draw.person(ctx, 230, 108, 701, {
                    skin: C.SKIN_LIGHT,
                    shirt: VGA.nearest(80, 80, 150),
                    hair: VGA.nearest(60, 40, 20),
                    pants: C.BLUE
                });
                // Coffee cup on table
                Draw.rect(ctx, 215, 89, 5, 4, C.WHITE);
            }

            // Jukebox
            Draw.rect(ctx, 272, 48, 22, 42, C.BROWN);
            Draw.rect(ctx, 274, 50, 18, 20, VGA.nearest(200, 180, 50));
            // Jukebox lights (animated)
            for (let jl = 0; jl < 3; jl++) {
                const jc = ((frame + jl * 20) % 60 < 30) ? C.NEON_RED : C.NEON_GREEN;
                Draw.pixel(ctx, 278 + jl * 5, 72, jc);
            }

            // Napkin dispensers on counter
            Draw.rect(ctx, 35, 52, 6, 5, C.METAL_GRAY);
            Draw.rect(ctx, 85, 52, 6, 5, C.METAL_GRAY);

            Draw.text(ctx, 'v Exit', 148, 193, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'rosie' && verb === 'talk') {
                if (!g.getFlag('talkedRosie')) {
                    g.setFlag('talkedRosie', true);
                    g.showDialog('Rosie',
                        "Detective? Yeah, I heard about that poor girl. Terrible thing.\n\n" +
                        "See that woman in the booth over there? That's Sandra — she lives in the " +
                        "building across from the Chens' place. She's been here all morning, " +
                        "nervous as a cat in a room full of rocking chairs.\n\n" +
                        "Go easy on her, will ya?",
                        () => g.addScore(3));
                } else {
                    g.showDialog('Rosie', "Sandra's still over there. Buy something next time ya come in!");
                }
                return true;
            }

            if (id === 'witness' && verb === 'talk') {
                if (!g.hasItem('badge')) {
                    g.showMessage("You should show your badge when questioning people.");
                    return true;
                }
                if (!g.getFlag('talkedWitness')) {
                    g.setFlag('talkedWitness', true);
                    g.showDialog('Sandra (Witness)',
                        "Oh! You're police? I... I was hoping someone would come.\n\n" +
                        "Last night around midnight, I was walking my dog. I saw a dark van — " +
                        "black, maybe dark blue — parked outside Lily's building. Two big men " +
                        "went in. I heard a scream, and a few minutes later they came out " +
                        "carrying her. She was struggling but they...\n\n" +
                        "*she breaks down*\n\n" +
                        "One of them had a scar on his face. The van had a logo on the side — " +
                        "some kind of anchor? Like a shipping company. They headed west toward " +
                        "the waterfront... Harbor Road, I think.\n\n" +
                        "Please find her. Please.",
                        () => {
                            g.addScore(15);
                            if (g.addItem('witnessStatement', 'Witness Statement', '📝', 
                                'Sandra\'s statement: Dark van with anchor logo. Two men, one scarred. Went west toward Harbor Road.')) {
                            }
                            g.setFlag('knowsWarehouse', true);
                            g.showMessage("You got Sandra's statement. She mentioned Harbor Road — the warehouse district. That's west of downtown.");
                        });
                } else {
                    g.showDialog('Sandra', "Please... just find her. Harbor Road. The van with the anchor logo.");
                }
                return true;
            }

            if (id === 'witness' && verb === 'look') {
                g.showMessage("A nervous young woman, late 20s. She keeps glancing at the door and wringing her hands.");
                return true;
            }

            if (id === 'jukebox' && verb === 'use') {
                g.showMessage("🎵 The jukebox plays a twangy country tune about a lonesome cowboy. Not your style.");
                return true;
            }

            if (id === 'counter' && verb === 'look') {
                g.showMessage("The counter is well-worn but clean. The coffee smells decent.");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(6, 124) || p.said(6, 121)) { // talk bartender/woman (Rosie)
                this.onInteract(g, 'talk', 'rosie');
                return true;
            }
            if (p.said(6, 80) || p.said(6, 120)) { // talk witness/man
                this.onInteract(g, 'talk', 'witness');
                return true;
            }
            if (p.said(8, 52) || p.said(1, 52)) { // show badge
                g.showMessage("You flash your detective badge.");
                return true;
            }
            if (p.said(3, 68) || p.said(1, 68)) { // get/look coffee
                g.showMessage("The coffee here is actually pretty good, but you're on duty.");
                return true;
            }
            if (p.said(7, 91) || p.said(7, 95)) { // go south/outside
                g.changeRoom('downtownStreet', 55, 135, 0);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('visitedDiner')) {
                g.setFlag('visitedDiner', true);
                setTimeout(() => g.showMessage("The diner is warm and smells of coffee and bacon. A woman behind the counter eyes you. A nervous woman sits in a booth."), 800);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 8: CRIME SCENE (Apartment)
    // ════════════════════════════════════════════════════════

    G.registerRoom('crimeScene', {
        name: "Crime Scene — 221 Oak St, Apt 4B",
        walkBounds: { x1: 20, y1: 100, x2: 300, y2: 185 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'door', x: 140, y: 38, w: 25, h: 45, name: 'Apartment door',
              description: 'The apartment door. It has been forced open — the frame is splintered near the lock.' },
            { id: 'table', x: 60, y: 75, w: 40, h: 20, name: 'Overturned table',
              description: 'A small side table, knocked over. A broken vase and scattered flowers on the floor.' },
            { id: 'phone', x: 250, y: 60, w: 15, h: 10, name: 'Telephone',
              description: "Lily's phone, off the hook. The last called number is 911 — she tried to call for help." },
            { id: 'windowsill', x: 270, y: 40, w: 30, h: 20, name: 'Windowsill',
              description: 'The window is open. There are smudges on the sill — could be fingerprints.' },
            { id: 'note', x: 90, y: 90, w: 15, h: 10, name: 'Piece of paper',
              description: 'A crumpled piece of paper on the floor.' },
            { id: 'couch', x: 170, y: 80, w: 60, h: 15, name: 'Couch',
              description: 'A couch with knocked-over cushions. Signs of a struggle.' },
            { id: 'photo', x: 35, y: 30, w: 20, h: 20, name: 'Photo on wall',
              description: 'A family photo: Lily with her father Richard Chen at a charity gala. Both smiling.' },
        ],

        exits: [
            { x1: 140, y1: 185, x2: 180, y2: 200, target: 'downtownStreet', enterX: 225, enterY: 135, enterDir: 0 },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(800);

            // Floor — hardwood
            for (let ty = 95; ty < 200; ty += 3) {
                for (let tx = 0; tx < 320; tx += 20) {
                    const shade = rng.next() > 0.5 ? VGA.nearest(170, 130, 90) : VGA.nearest(160, 120, 80);
                    Draw.rect(ctx, tx, ty, 20, 3, shade);
                    Draw.line(ctx, tx, ty, tx, ty + 3, VGA.nearest(140, 100, 65));
                }
            }

            // Walls
            Draw.rect(ctx, 0, 0, 320, 95, VGA.nearest(220, 210, 195));
            Draw.rect(ctx, 0, 88, 320, 5, C.WHITE);

            // Crime scene tape
            for (let tx = 0; tx < 320; tx += 5) {
                const ty = 92 + Math.sin(tx * 0.1) * 2;
                Draw.rect(ctx, tx, ty, 5, 2, (Math.floor(tx / 5) % 2 === 0) ? C.YELLOW : C.BLACK);
            }

            // Door (center, damaged)
            Draw.rect(ctx, 135, 32, 30, 55, C.DOOR_BROWN);
            Draw.rect(ctx, 137, 34, 26, 51, VGA.nearest(140, 100, 70));
            // Splintered frame
            for (let i = 0; i < 5; i++) {
                Draw.rect(ctx, 163 + rng.int(0, 3), 50 + rng.int(0, 15), rng.int(1, 3), 1, VGA.nearest(200, 170, 120));
            }
            // Doorknob (hanging loose)
            Draw.ellipse(ctx, 160, 58, 2, 2, C.BADGE_GOLD);

            // Photo on wall
            Draw.rect(ctx, 32, 28, 24, 22, C.DESK_BROWN);
            Draw.rect(ctx, 34, 30, 20, 18, C.WHITE);
            Draw.rect(ctx, 36, 32, 7, 12, C.SKIN_LIGHT); // person 1
            Draw.rect(ctx, 45, 34, 7, 10, C.SKIN_LIGHT); // person 2

            // Overturned table
            Draw.rect(ctx, 58, 78, 35, 4, C.DESK_BROWN);
            Draw.rect(ctx, 60, 82, 4, 14, C.DESK_BROWN); // leg up
            Draw.rect(ctx, 85, 82, 4, 14, C.DESK_BROWN);
            // Broken vase pieces
            Draw.rect(ctx, 70, 95, 5, 3, C.WINDOW_CYAN);
            Draw.rect(ctx, 78, 93, 4, 4, C.WINDOW_CYAN);
            Draw.rect(ctx, 66, 96, 3, 2, VGA.nearest(80, 200, 80)); // flower remains

            // Note on floor
            Draw.rect(ctx, 88, 88, 14, 10, C.WHITE);
            Draw.text(ctx, '???', 90, 95, C.RED, 4);

            // Couch
            Draw.rect(ctx, 168, 78, 62, 18, VGA.nearest(80, 80, 120));
            Draw.rect(ctx, 170, 72, 15, 8, VGA.nearest(80, 80, 120)); // cushion tossed
            Draw.rect(ctx, 215, 74, 14, 7, VGA.nearest(80, 80, 120)); // another cushion

            // Phone (right side, off hook)
            Draw.rect(ctx, 245, 55, 20, 15, C.DESK_BROWN); // table
            Draw.rect(ctx, 250, 58, 10, 6, C.BLACK); // phone body
            Draw.rect(ctx, 248, 70, 8, 3, C.BLACK); // receiver dangling
            Draw.line(ctx, 252, 63, 250, 70, C.DGRAY); // cord

            // Window (right)
            Draw.rect(ctx, 268, 35, 35, 25, C.WHITE);
            Draw.rect(ctx, 270, 37, 31, 21, C.SKY_BLUE);
            Draw.rect(ctx, 285, 37, 1, 21, C.WHITE); // cross
            Draw.rect(ctx, 270, 47, 31, 1, C.WHITE);
            // Smudges on sill
            Draw.rect(ctx, 272, 58, 7, 3, VGA.nearest(80, 70, 60));
            Draw.rect(ctx, 290, 58, 7, 3, VGA.nearest(80, 70, 60));

            // Evidence markers (yellow triangles)
            const markers = [[70, 96], [90, 93], [250, 72], [275, 60]];
            for (let i = 0; i < markers.length; i++) {
                Draw.rect(ctx, markers[i][0] - 3, markers[i][1], 6, 6, C.YELLOW);
                Draw.text(ctx, `${i + 1}`, markers[i][0] - 1, markers[i][1] + 5, C.BLACK, 4);
            }

            Draw.text(ctx, 'v Exit', 148, 193, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'windowsill') {
                if (verb === 'look' || verb === 'use') {
                    if (!g.getFlag('gotFingerprints') && g.hasItem('caseFile')) {
                        g.setFlag('gotFingerprints', true);
                        g.addItem('fingerprints', 'Fingerprints', '🔍', 'Fingerprint samples lifted from the windowsill. Could match a suspect in the database.');
                        g.addScore(10);
                        g.showDialog('',
                            "You carefully dust the windowsill and lift two clear fingerprint samples. " +
                            "These could be matched against the criminal database back at the station.");
                    } else if (g.getFlag('gotFingerprints')) {
                        g.showMessage("You already collected the fingerprints.");
                    } else {
                        g.showMessage("Smudges on the windowsill — looks like fingerprints. You need your case file to properly document evidence.");
                    }
                    return true;
                }
            }

            if (id === 'note') {
                if (verb === 'get' || verb === 'look' || verb === 'use') {
                    if (!g.getFlag('gotNote')) {
                        g.setFlag('gotNote', true);
                        g.addItem('ransomNote', 'Ransom Note', '✉️',
                            'A crudely written note: "$2 MILLION. NO POLICE. WILL CONTACT FATHER. DISOBEY AND SHE DIES." Anchor symbol at bottom.');
                        g.addScore(10);
                        g.showDialog('',
                            "You pick up the crumpled paper. It's a ransom note!\n\n" +
                            '"$2 MILLION. NO POLICE. WILL CONTACT FATHER. DISOBEY AND SHE DIES."\n\n' +
                            "At the bottom is a crude drawing of an anchor — the same symbol the witness mentioned on the van!\n\n" +
                            "This confirms it's a kidnapping for ransom, and the anchor connects to a shipping or warehouse operation.");
                    } else {
                        g.showMessage('The note reads: "$2 MILLION. NO POLICE. WILL CONTACT FATHER. DISOBEY AND SHE DIES." with an anchor symbol.');
                    }
                    return true;
                }
            }

            if (id === 'door' && verb === 'look') {
                g.showDialog('',
                    "The door frame is shattered near the lock — they kicked it in. This was a violent entry. " +
                    "Professional too — one strong kick, right on the deadbolt. These guys knew what they were doing.");
                if (!g.getFlag('examinedDoor')) {
                    g.setFlag('examinedDoor', true);
                    g.addScore(3);
                }
                return true;
            }

            if (id === 'phone' && verb === 'look') {
                g.showDialog('',
                    "The phone receiver is dangling by its cord. The last number dialed was 911. " +
                    "She tried to call for help but they got to her first. The call log shows the " +
                    "attempt was at 11:58 PM — just two minutes before midnight.");
                if (!g.getFlag('examinedPhone')) {
                    g.setFlag('examinedPhone', true);
                    g.addScore(3);
                }
                return true;
            }

            if (id === 'photo' && verb === 'look') {
                g.showMessage("Lily and her father Richard at a charity gala. She looks happy. You'll find her.");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(1, 66) || p.said(3, 66)) { // look/get evidence
                if (!g.getFlag('gotFingerprints')) {
                    g.showMessage("Check the windowsill — those smudges might be fingerprints.");
                } else {
                    g.showMessage("You've collected the key evidence from this scene.");
                }
                return true;
            }
            if (p.said(3, 77) || p.said(1, 77)) { // get/look fingerprints
                this.onInteract(g, 'use', 'windowsill');
                return true;
            }
            if (p.said(1, 61) || p.said(3, 61)) { // look/get paper/note
                this.onInteract(g, 'get', 'note');
                return true;
            }
            if (p.said(1, 60)) { // look door
                this.onInteract(g, 'look', 'door');
                return true;
            }
            if (p.said(1, 59)) { // look phone
                this.onInteract(g, 'look', 'phone');
                return true;
            }
            if (p.said(7, 91) || p.said(7, 95)) { // go south/outside
                g.changeRoom('downtownStreet', 225, 135, 0);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('visitedCrimeScene')) {
                g.setFlag('visitedCrimeScene', true);
                g.addScore(5);
                setTimeout(() => g.showDialog('',
                    "You duck under the crime scene tape and enter apartment 4B. " +
                    "The place is a mess — overturned furniture, broken glass. " +
                    "Clear signs of a violent struggle.\n\n" +
                    "Look around carefully. Every piece of evidence matters."), 500);
            }
            // Check if we have enough evidence
            if (g.getFlag('gotFingerprints') && g.getFlag('gotNote') && g.getFlag('talkedWitness') && !g.getFlag('hasEvidence')) {
                g.setFlag('hasEvidence', true);
                g.showMessage("You now have enough evidence for a warrant. Head back to the Captain's office.");
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 9: CITY PARK
    // ════════════════════════════════════════════════════════

    G.registerRoom('park', {
        name: 'Riverside Park',
        walkBounds: { x1: 10, y1: 110, x2: 310, y2: 185 },
        safeSpawn: [160, 150],

        hotspots: [
            { id: 'bench', x: 130, y: 115, w: 40, h: 12, name: 'Park bench',
              description: 'A weathered park bench overlooking the river.' },
            { id: 'suspiciousMan', x: 250, y: 105, w: 25, h: 35, name: 'Man on phone',
              description: 'A heavyset man talking on a cell phone. He looks agitated.' },
            { id: 'river', x: 0, y: 80, w: 320, h: 20, name: 'River',
              description: 'The Oakdale River, slow and brown. A few ducks paddle near the far bank.' },
            { id: 'trashcan', x: 80, y: 115, w: 12, h: 15, name: 'Trash can',
              description: 'A green park trash can. Something is sticking out of it.' },
            { id: 'jogger', x: 60, y: 130, w: 20, h: 25, name: 'Jogger',
              description: 'A jogger running along the path, headphones in.' },
        ],

        exits: [
            { x1: 0, y1: 130, x2: 12, y2: 185, target: 'downtownStreet', enterX: 300, enterY: 165, enterDir: 1 },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(900);

            // Sky
            Draw.gradient(ctx, 0, 0, 320, 40, C.SKY_BLUE, C.SKY_LIGHT);
            Draw.cloud(ctx, 80, 10, 901);
            Draw.cloud(ctx, 250, 15, 902);

            // Far bank
            Draw.rect(ctx, 0, 40, 320, 20, C.GRASS_DARK);
            // Trees on far bank
            for (let i = 0; i < 5; i++) {
                Draw.tree(ctx, 30 + i * 65 + rng.int(-10, 10), 55, 910 + i);
            }

            // River
            Draw.gradient(ctx, 0, 60, 320, 30, C.WATER_BLUE, C.WATER_LIGHT);
            // Water shimmer
            for (let i = 0; i < 20; i++) {
                const wx = rng.int(0, 319);
                const wy = rng.int(62, 88);
                const shimmer = ((frame + wx) % 40 < 20);
                if (shimmer) Draw.pixel(ctx, wx, wy, C.WHITE);
            }

            // Riverbank
            Draw.rect(ctx, 0, 88, 320, 8, VGA.nearest(120, 100, 60));

            // Grass
            Draw.rect(ctx, 0, 96, 320, 104, C.GRASS_GREEN);
            // Grass texture
            for (let i = 0; i < 100; i++) {
                Draw.pixel(ctx, rng.int(0, 319), rng.int(96, 199), 
                    rng.next() > 0.5 ? C.GRASS_DARK : C.LGREEN);
            }

            // Path
            Draw.rect(ctx, 0, 130, 320, 12, VGA.nearest(180, 160, 130));
            Draw.dither(ctx, 0, 130, 320, 2, VGA.nearest(160, 140, 110), VGA.nearest(180, 160, 130));

            // Bench
            Draw.rect(ctx, 128, 116, 44, 4, C.DESK_BROWN);
            Draw.rect(ctx, 130, 108, 40, 10, C.DESK_BROWN);
            Draw.rect(ctx, 132, 120, 3, 8, C.DESK_BROWN);
            Draw.rect(ctx, 165, 120, 3, 8, C.DESK_BROWN);

            // Trash can
            Draw.rect(ctx, 80, 114, 14, 18, C.GREEN);
            Draw.rect(ctx, 78, 112, 18, 3, C.GREEN);
            // Something sticking out
            if (!state.flags.gotParkClue) {
                Draw.rect(ctx, 84, 110, 6, 4, C.WHITE);
            }

            // Trees
            Draw.tree(ctx, 20, 115, 920);
            Draw.tree(ctx, 300, 118, 921);
            Draw.bush(ctx, 45, 125, 922);
            Draw.bush(ctx, 280, 128, 923);

            // Suspicious man (right side, near tree)
            if (!state.flags.suspectFled) {
                Draw.person(ctx, 262, 140, 950, {
                    skin: C.SKIN_DARK,
                    shirt: C.BLACK,
                    hair: C.HAIR_BLACK,
                    pants: C.DGRAY
                });
                // Phone to ear
                Draw.rect(ctx, 266, 118, 3, 5, C.BLACK);
            }

            // Jogger (if frame is right)
            if (frame % 200 < 100) {
                const jx = 30 + (frame % 200) * 1.5;
                Draw.person(ctx, jx, 143, 960, {
                    shirt: VGA.nearest(200, 50, 50),
                    pants: C.BLACK
                });
            }

            // Streetlamp
            Draw.lamp(ctx, 200, 128);

            Draw.text(ctx, '< Downtown', 5, 160, C.YELLOW, 5);
        },

        onInteract(g, verb, id) {
            if (id === 'suspiciousMan' && !g.getFlag('suspectFled')) {
                if (verb === 'talk') {
                    if (!g.getFlag('approachedSuspect')) {
                        g.setFlag('approachedSuspect', true);
                        g.showDialog('Suspicious Man',
                            '*The man sees you approaching and quickly ends his call.*\n\n' +
                            '"What do you want? I\'m just making a phone call. Is that a crime now?"\n\n' +
                            '*He has a distinctive scar on his left cheek — matching the description from the case file!*');
                    } else {
                        g.showDialog('',
                            "He's getting more agitated. You need to decide — confront him or let him go?");
                    }
                    return true;
                }
                if (verb === 'look') {
                    g.showDialog('',
                        'A heavyset man, about 6\'2", dark clothing. He has a scar on his left cheek. ' +
                        'He matches the suspect description from the case file!');
                    if (!g.getFlag('identifiedSuspect')) {
                        g.setFlag('identifiedSuspect', true);
                        g.addScore(5);
                    }
                    return true;
                }
                if (verb === 'use' && g.state.selectedItem === 'badge') {
                    g.showDialog('Detective Mercer',
                        '*You flash your badge.*\n\n' +
                        '"Oakdale PD. I need to ask you some questions about—"\n\n' +
                        '*The man\'s eyes go wide. He shoves you and takes off running toward Harbor Road!*',
                        () => {
                            g.setFlag('suspectFled', true);
                            g.setFlag('knowsWarehouse', true);
                            g.addScore(5);
                            g.showMessage("He ran west! Toward Harbor Road — the warehouse district. You need backup and a warrant before pursuing.");
                        });
                    return true;
                }
            }

            if (id === 'trashcan') {
                if (verb === 'look' || verb === 'get' || verb === 'use') {
                    if (!g.getFlag('gotParkClue')) {
                        g.setFlag('gotParkClue', true);
                        g.addItem('receipt', 'Gas Receipt', '🧾', 
                            'A gas station receipt from "Harbor Fuel Stop" on Harbor Road. Paid cash. Timestamp: 1:15 AM.');
                        g.addScore(5);
                        g.showDialog('',
                            "You pull a crumpled receipt from the trash can. It's from 'Harbor Fuel Stop' " +
                            "on Harbor Road, timestamped 1:15 AM — about an hour after the kidnapping. Paid cash.\n\n" +
                            "This puts someone near the warehouse district shortly after the crime.");
                    } else {
                        g.showMessage("Nothing else of interest in the trash.");
                    }
                    return true;
                }
            }

            return false;
        },

        onParser(g, p) {
            if ((p.said(6, 120) || p.said(6, 79)) && !g.getFlag('suspectFled')) { // talk man/suspect
                this.onInteract(g, 'talk', 'suspiciousMan');
                return true;
            }
            if (p.said(1, 120) || p.said(1, 79)) { // look man/suspect
                if (!g.getFlag('suspectFled')) {
                    this.onInteract(g, 'look', 'suspiciousMan');
                }
                return true;
            }
            if (p.said(14, 120) || p.said(14, 79)) { // arrest man/suspect
                if (!g.getFlag('suspectFled')) {
                    g.showMessage("You don't have enough cause to arrest him yet. You need evidence and a warrant.");
                } else {
                    g.showMessage("He already fled toward Harbor Road.");
                }
                return true;
            }
            if ((p.said(1, 66) || p.has(66)) && p.verb() === 1) { // look trash/evidence
                this.onInteract(g, 'look', 'trashcan');
                return true;
            }
            if (p.said(7, 93)) { // go west
                g.changeRoom('downtownStreet', 300, 165, 1);
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('visitedPark')) {
                g.setFlag('visitedPark', true);
                setTimeout(() => g.showMessage("Riverside Park. Peaceful — but you notice a heavyset man on the phone by the trees. Something about him seems off."), 800);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 10: WAREHOUSE EXTERIOR
    // ════════════════════════════════════════════════════════

    G.registerRoom('warehouseExterior', {
        name: 'Harbor Road — Warehouse District',
        walkBounds: { x1: 10, y1: 120, x2: 310, y2: 185 },
        safeSpawn: [160, 160],

        hotspots: [
            { id: 'warehouse', x: 60, y: 25, w: 140, h: 70, name: 'Warehouse',
              description: 'A large corrugated metal warehouse. The sign reads "ANCHOR SHIPPING & STORAGE." The van from Sandra\'s description must be inside!' },
            { id: 'van', x: 40, y: 100, w: 50, h: 20, name: 'Dark van',
              description: 'A dark blue van with an anchor logo on the side. This is the van the witness described!' },
            { id: 'warehouseDoor', x: 120, y: 70, w: 30, h: 25, name: 'Warehouse door',
              description: 'A large rolling metal door. It\'s slightly ajar.' },
            { id: 'guardPost', x: 220, y: 90, w: 20, h: 20, name: 'Guard booth',
              description: 'An empty guard booth. Whoever was here left in a hurry — coffee still warm.' },
        ],

        exits: [
            { x1: 305, y1: 130, x2: 320, y2: 185, target: 'downtownStreet', enterX: 20, enterY: 165, enterDir: 2 },
            // Enter warehouse (with warrant)
            { x1: 115, y1: 120, x2: 155, y2: 135, target: 'warehouseInterior', enterX: 160, enterY: 175, enterDir: 3,
              condition: (g) => {
                  if (!g.hasItem('warrant')) {
                      g.showMessage("You can't go in without a warrant. Head back to the Captain's office.");
                      return false;
                  }
                  if (!g.getFlag('calledSwat')) {
                      g.showMessage("You need SWAT backup! Call from the Captain's office phone first.");
                      return false;
                  }
                  if (!g.getFlag('gunLoaded')) {
                      g.showMessage("You should load your weapon first. Use your gun to ready it.");
                      return false;
                  }
                  return true;
              }
            },
        ],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(1000);

            // Dusk sky
            Draw.gradient(ctx, 0, 0, 320, 25, VGA.nearest(60, 40, 100), VGA.nearest(140, 100, 60));
            // Stars
            for (let i = 0; i < 15; i++) {
                if (rng.next() > 0.5) Draw.pixel(ctx, rng.int(0, 319), rng.int(2, 22), C.WHITE);
            }

            // Warehouse building
            Draw.rect(ctx, 50, 20, 160, 80, C.LOCKER_GRAY);
            // Corrugated texture
            for (let wy = 20; wy < 100; wy += 4) {
                Draw.line(ctx, 50, wy, 210, wy, C.LOCKER_DARK);
            }
            // Sign
            Draw.rect(ctx, 80, 28, 110, 18, C.WHITE);
            Draw.text(ctx, 'ANCHOR', 95, 37, C.BLUE, 6);
            Draw.text(ctx, 'SHIPPING', 90, 43, C.BLUE, 5);
            // Anchor symbol
            Draw.text(ctx, '⚓', 170, 40, C.BLUE, 6);

            // Warehouse door
            Draw.rect(ctx, 115, 65, 38, 35, C.DGRAY);
            Draw.rect(ctx, 117, 67, 34, 31, VGA.nearest(60, 60, 65));
            // Door is ajar — dark gap
            Draw.rect(ctx, 148, 67, 3, 31, C.BLACK);

            // Windows (some lit)
            Draw.window(ctx, 60, 45, 18, 12, true);
            Draw.window(ctx, 175, 45, 18, 12, false);

            // Ground — concrete/gravel
            Draw.rect(ctx, 0, 100, 320, 100, C.ROAD_DARK);
            // Puddles
            for (let i = 0; i < 5; i++) {
                const px = rng.int(20, 300);
                const py = rng.int(130, 180);
                Draw.ellipse(ctx, px, py, rng.int(5, 12), 2, VGA.nearest(40, 40, 50));
            }

            // Van
            Draw.rect(ctx, 35, 100, 55, 22, C.UNIFORM_DARK);
            Draw.rect(ctx, 37, 102, 20, 10, C.WINDOW_CYAN); // windshield
            Draw.rect(ctx, 35, 120, 8, 4, C.BLACK); // front wheel
            Draw.rect(ctx, 82, 120, 8, 4, C.BLACK); // rear wheel
            // Anchor logo on side
            Draw.rect(ctx, 62, 105, 12, 10, C.WHITE);
            Draw.text(ctx, '⚓', 63, 112, C.BLUE, 5);

            // Guard booth
            Draw.rect(ctx, 215, 85, 24, 25, VGA.nearest(180, 170, 150));
            Draw.rect(ctx, 218, 88, 18, 10, C.WINDOW_CYAN);
            Draw.rect(ctx, 226, 98, 10, 12, C.DOOR_BROWN);

            // Chain-link fence
            for (let fy = 100; fy < 120; fy += 3) {
                Draw.line(ctx, 240, fy, 320, fy, C.LGRAY);
            }

            // Security light
            Draw.lamp(ctx, 250, 115);
            // Light cone
            if (frame % 80 < 40) {
                for (let ly = 0; ly < 15; ly++) {
                    const lw = ly * 2;
                    Draw.dither(ctx, 248 - lw, 120 + ly, lw * 2 + 4, 1, VGA.nearest(255,230,120), C.ROAD_DARK);
                }
            }

            Draw.text(ctx, 'Downtown >', 260, 160, C.YELLOW, 5);
            if (state.flags.calledSwat && state.flags.gunLoaded) {
                Draw.text(ctx, '^ Enter Warehouse', 108, 128, C.LGREEN, 5);
            }
        },

        onInteract(g, verb, id) {
            if (id === 'van' && verb === 'look') {
                g.showDialog('',
                    "Dark blue van, anchor logo on the side. License plate: OAK-5573. " +
                    "This is definitely the van Sandra described. The engine is cold — " +
                    "it's been here for a while.");
                if (!g.getFlag('examinedVan')) {
                    g.setFlag('examinedVan', true);
                    g.addScore(5);
                }
                return true;
            }

            if (id === 'warehouseDoor' && (verb === 'open' || verb === 'use')) {
                if (!g.hasItem('warrant')) {
                    g.showMessage("You need a warrant before entering. Head back to the Captain's office.");
                } else if (!g.getFlag('calledSwat')) {
                    g.showMessage("Don't go in without backup! Call SWAT from the Captain's office phone.");
                } else if (!g.getFlag('gunLoaded')) {
                    g.showMessage("Load your weapon first. This could get dangerous.");
                } else {
                    g.changeRoom('warehouseInterior', 160, 175, 3);
                }
                return true;
            }

            if (id === 'warehouse' && verb === 'look') {
                g.showMessage("'ANCHOR SHIPPING & STORAGE.' This has to be connected to the anchor on the ransom note and the van.");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (p.said(17, 51)) { // load gun
                if (!g.getFlag('gunLoaded')) {
                    g.setFlag('gunLoaded', true);
                    g.addScore(3);
                    g.showMessage("You check your pistol and load a fresh magazine. Ready.");
                    audio.handcuffs();
                } else {
                    g.showMessage("Your weapon is already loaded.");
                }
                return true;
            }
            if (p.said(18, 51)) { // draw gun
                if (g.getFlag('gunLoaded')) {
                    g.setFlag('gunDrawn', true);
                    g.showMessage("You draw your weapon and hold it at low ready.");
                } else {
                    g.showMessage("Load your weapon first.");
                }
                return true;
            }
            if (p.said(15, 9999) || p.said(3, 53)) { // use radio / call
                audio.radioStatic();
                audio.radioBeep();
                g.showMessage("Radio: \"All units, SWAT is in position near Harbor Road. Awaiting detective's entry.\"");
                return true;
            }
            if (p.said(7, 92)) { // go east
                g.changeRoom('downtownStreet', 20, 165, 2);
                return true;
            }
            if (p.said(7, 90) || p.said(4, 60)) { // go north / open door
                this.onInteract(g, 'open', 'warehouseDoor');
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('visitedWarehouse')) {
                g.setFlag('visitedWarehouse', true);
                g.addScore(5);
                setTimeout(() => g.showDialog('',
                    "Harbor Road. The warehouse district is dark and quiet. " +
                    "You spot a large warehouse with 'ANCHOR SHIPPING' on the side, and sure enough — " +
                    "a dark van with an anchor logo is parked out front.\n\n" +
                    "This is the place. But you'll need a warrant and SWAT backup before going in."), 500);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 11: WAREHOUSE INTERIOR (Final confrontation)
    // ════════════════════════════════════════════════════════

    G.registerRoom('warehouseInterior', {
        name: 'Warehouse Interior — Anchor Shipping',
        walkBounds: { x1: 20, y1: 110, x2: 300, y2: 185 },
        safeSpawn: [160, 170],

        hotspots: [
            { id: 'lily', x: 130, y: 55, w: 30, h: 35, name: 'Lily Chen',
              description: 'Lily Chen! She\'s tied to a chair, blindfolded but alive!' },
            { id: 'thug1', x: 60, y: 70, w: 25, h: 35, name: 'Armed thug',
              description: 'A large man with a gun. He hasn\'t seen you yet.' },
            { id: 'scarface', x: 230, y: 65, w: 25, h: 35, name: 'Scarfaced man',
              description: 'The scarfaced man from the park! He\'s the leader.' },
            { id: 'crates', x: 10, y: 40, w: 40, h: 30, name: 'Crates',
              description: 'Wooden shipping crates marked with anchor logos. Good cover.' },
            { id: 'table', x: 250, y: 85, w: 40, h: 15, name: 'Folding table',
              description: 'A folding table with a phone, some cash, and maps.' },
        ],

        exits: [],

        draw(ctx, state, frame) {
            const rng = new SeededRandom(1100);

            // Dark interior
            Draw.rect(ctx, 0, 0, 320, 200, VGA.nearest(25, 25, 30));

            // Walls — corrugated
            Draw.rect(ctx, 0, 0, 320, 40, VGA.nearest(40, 40, 50));
            for (let wy = 0; wy < 40; wy += 4) {
                Draw.line(ctx, 0, wy, 320, wy, VGA.nearest(35, 35, 42));
            }

            // Roof beams
            for (let bx = 0; bx < 320; bx += 80) {
                Draw.rect(ctx, bx, 38, 5, 170, VGA.nearest(50, 45, 40));
            }

            // Concrete floor
            Draw.rect(ctx, 0, 100, 320, 100, VGA.nearest(65, 65, 70));
            for (let i = 0; i < 30; i++) {
                Draw.pixel(ctx, rng.int(0, 319), rng.int(100, 199), VGA.nearest(55, 55, 60));
            }

            // Hanging light (swinging)
            const lightSwing = Math.sin(frame * 0.05) * 10;
            const lightX = 160 + lightSwing;
            Draw.rect(ctx, lightX - 1, 40, 2, 15, C.DGRAY);
            Draw.ellipse(ctx, lightX, 57, 6, 4, C.LAMP_YELLOW);
            // Light pool on floor
            for (let r = 0; r < 20; r++) {
                const alpha = 1 - r / 20;
                const w = r * 4;
                Draw.dither(ctx, lightX - w / 2, 110 + r, w, 1, 
                    VGA.nearest(Math.floor(80 * alpha), Math.floor(75 * alpha), Math.floor(50 * alpha)),
                    VGA.nearest(65, 65, 70));
            }

            // Crates (left side - cover)
            for (let c = 0; c < 3; c++) {
                const cx = 8 + c * 18;
                const cy = 40 + c * 8;
                Draw.rect(ctx, cx, cy, 22, 20, C.DESK_BROWN);
                Draw.rect(ctx, cx + 1, cy + 1, 20, 18, VGA.nearest(160, 120, 70));
                Draw.line(ctx, cx + 4, cy + 4, cx + 18, cy + 16, C.DESK_BROWN);
                Draw.line(ctx, cx + 18, cy + 4, cx + 4, cy + 16, C.DESK_BROWN);
            }

            // Lily Chen (center, tied to chair)
            if (!state.flags.lilyFreed) {
                // Chair
                Draw.rect(ctx, 137, 60, 16, 20, VGA.nearest(80, 60, 40));
                Draw.rect(ctx, 139, 50, 12, 12, VGA.nearest(80, 60, 40));
                // Lily
                Draw.ellipse(ctx, 145, 48, 3, 4, C.SKIN_LIGHT);
                Draw.rect(ctx, 143, 45, 5, 3, C.HAIR_BLACK); // hair
                Draw.rect(ctx, 141, 52, 8, 12, VGA.nearest(180, 80, 80)); // red top
                Draw.rect(ctx, 141, 64, 8, 10, C.BLUE); // pants
                // Blindfold
                Draw.rect(ctx, 141, 47, 8, 2, C.WHITE);
                // Ropes
                Draw.rect(ctx, 139, 55, 12, 1, C.BROWN);
                Draw.rect(ctx, 139, 60, 12, 1, C.BROWN);
            } else {
                // Lily freed, standing
                Draw.person(ctx, 145, 85, 1150, {
                    skin: C.SKIN_LIGHT,
                    shirt: VGA.nearest(180, 80, 80),
                    hair: C.HAIR_BLACK,
                    pants: C.BLUE
                });
            }

            // Thugs (if not arrested)
            if (!state.flags.thugsDown) {
                // Thug 1 (left)
                Draw.person(ctx, 72, 105, 1160, {
                    skin: C.SKIN_DARK,
                    shirt: C.BLACK,
                    hair: C.HAIR_BLACK,
                    pants: C.DGRAY
                });
                // Gun in hand
                Draw.rect(ctx, 76, 88, 4, 2, C.DGRAY);

                // Scarface (right) 
                Draw.person(ctx, 242, 100, 1170, {
                    skin: C.SKIN_DARK,
                    shirt: VGA.nearest(60, 30, 30),
                    hair: C.HAIR_BLACK,
                    pants: C.BLACK
                });
                // Scar
                Draw.line(ctx, 239, 77, 243, 82, C.LRED);
            } else {
                // Thugs on ground (arrested)
                Draw.rect(ctx, 60, 105, 20, 5, C.BLACK);
                Draw.ellipse(ctx, 70, 104, 3, 3, C.SKIN_DARK);
                Draw.rect(ctx, 230, 100, 20, 5, VGA.nearest(60, 30, 30));
                Draw.ellipse(ctx, 240, 99, 3, 3, C.SKIN_DARK);
            }

            // Table (right)
            Draw.rect(ctx, 248, 83, 42, 4, C.METAL_GRAY);
            Draw.rect(ctx, 250, 87, 3, 12, C.METAL_GRAY);
            Draw.rect(ctx, 285, 87, 3, 12, C.METAL_GRAY);
            // Phone and cash on table
            Draw.rect(ctx, 255, 80, 8, 4, C.BLACK);
            Draw.rect(ctx, 270, 80, 12, 4, C.LGREEN); // cash

            // Oil barrels
            Draw.ellipse(ctx, 290, 60, 8, 10, C.DGRAY);
            Draw.ellipse(ctx, 306, 65, 8, 10, C.DGRAY);
            // Barrel labels
            Draw.rect(ctx, 286, 58, 8, 2, C.YELLOW);
            Draw.rect(ctx, 302, 63, 8, 2, C.YELLOW);

            // Dripping pipe (atmospheric)
            Draw.rect(ctx, 50, 38, 80, 2, VGA.nearest(70, 65, 55)); // pipe
            Draw.rect(ctx, 90, 38, 2, 6, VGA.nearest(70, 65, 55)); // pipe elbow
            if (frame % 50 < 20) {
                const dripY = 44 + (frame % 50) * 2;
                if (dripY < 100) Draw.pixel(ctx, 91, dripY, C.WATER_LIGHT);
            }
            // Puddle under drip
            Draw.ellipse(ctx, 91, 102, 5, 2, VGA.nearest(45, 45, 55));

            // Exposed wiring on wall
            Draw.line(ctx, 280, 10, 280, 38, C.YELLOW);
            Draw.line(ctx, 280, 10, 310, 10, C.YELLOW);
            Draw.pixel(ctx, 310, 10, C.RED); // exposed end

            // Grime and stains on floor
            for (let i = 0; i < 15; i++) {
                Draw.pixel(ctx, rng.int(5, 315), rng.int(105, 195), VGA.nearest(50, 48, 45));
            }

            // Dust motes in light beam (animated)
            for (let d = 0; d < 4; d++) {
                const dx = lightX - 10 + ((frame * 0.5 + d * 17) % 30);
                const dy = 60 + ((frame * 0.3 + d * 23) % 40);
                if (dy > 55 && dy < 108) {
                    Draw.pixel(ctx, dx, dy, VGA.nearest(120, 115, 80));
                }
            }

            // Spider web in corner
            Draw.line(ctx, 0, 0, 15, 15, C.LGRAY);
            Draw.line(ctx, 15, 0, 0, 15, C.LGRAY);
            Draw.line(ctx, 0, 7, 15, 7, C.LGRAY);
            Draw.line(ctx, 7, 0, 7, 15, C.LGRAY);

            if (state.flags.thugsDown && !state.flags.lilyFreed) {
                Draw.text(ctx, 'Free Lily!', 120, 95, C.LGREEN, 6);
            }
        },

        onInteract(g, verb, id) {
            if (!g.getFlag('warehouseEntry')) {
                // First interaction triggers the confrontation
                g.setFlag('warehouseEntry', true);
                g.showDialog('Detective Mercer',
                    '*You burst through the door, weapon drawn.*\n\n' +
                    '"OAKDALE PD! NOBODY MOVE!"\n\n' +
                    '*SWAT breaches from the side entrance simultaneously. The armed thug drops his weapon immediately. ' +
                    'The scarfaced man hesitates...*');
                return true;
            }

            if (id === 'scarface' && !g.getFlag('thugsDown')) {
                if (verb === 'talk' || verb === 'use') {
                    g.showDialog('Detective Mercer',
                        '"It\'s over, Vasquez. Drop the weapon and get on the ground. NOW."\n\n' +
                        '*The scarfaced man — Vasquez — glares at you defiantly, but with SWAT ' +
                        'rifles trained on him, he slowly lowers his gun and kneels.*\n\n' +
                        '"You don\'t know who you\'re messing with, detective..."',
                        () => {
                            g.setFlag('thugsDown', true);
                            g.addScore(20);
                            audio.handcuffs();
                            g.showMessage("SWAT secures both suspects. Now free Lily!");
                        });
                    return true;
                }
            }

            if (id === 'thug1' && !g.getFlag('thugsDown')) {
                if (verb === 'talk') {
                    g.showDialog('Armed Thug',
                        '*The thug has already dropped his weapon and has his hands up.*\n\n' +
                        '"Don\'t shoot! I give up! It was all Vasquez\'s idea!"');
                    return true;
                }
            }

            if (id === 'lily') {
                if (g.getFlag('thugsDown') && !g.getFlag('lilyFreed')) {
                    if (verb === 'use' || verb === 'talk' || verb === 'open') {
                        g.setFlag('lilyFreed', true);
                        g.addScore(25);
                        g.showDialog('',
                            '*You cut the ropes and gently remove Lily\'s blindfold.*\n\n' +
                            '"You\'re safe now, Lily. I\'m Detective Mercer, Oakdale PD. Your father\'s been worried sick."\n\n' +
                            '*Lily breaks down in tears of relief.*\n\n' +
                            '"Thank you... thank you so much. I thought... I thought nobody was coming."\n\n' +
                            '"We\'ve got you. Let\'s get you home."',
                            () => {
                                g.addScore(20);
                                audio.victory();
                                g.showDialog('',
                                    'CASE CLOSED.\n\n' +
                                    'Lily Chen has been safely recovered. Suspects Miguel "Scarface" Vasquez ' +
                                    'and his associate are in custody.\n\n' +
                                    'Evidence recovered from the warehouse connects them to three other ' +
                                    'kidnappings across the state.\n\n' +
                                    `You earned ${g.state.score} out of ${g.state.maxScore} points.\n\n` +
                                    'Captain Torres is waiting for your report.',
                                    () => {
                                        g.changeRoom('captainOffice', 160, 150, 3);
                                        g.setFlag('gameWon', true);
                                        g.state.won = true;
                                    });
                            });
                        return true;
                    }
                } else if (!g.getFlag('thugsDown')) {
                    g.showMessage("You need to neutralize the suspects first!");
                    return true;
                }
            }

            if (id === 'crates' && verb === 'look') {
                g.showMessage("Wooden shipping crates with anchor logos. They provide good cover during the breach.");
                return true;
            }

            if (id === 'table' && verb === 'look') {
                g.showDialog('',
                    "On the table: a burner phone, stacks of cash (the ransom payment was being arranged), " +
                    "and maps of Oakdale with several locations circled — including the Chen residence.");
                return true;
            }

            return false;
        },

        onParser(g, p) {
            if (!g.getFlag('warehouseEntry')) {
                g.setFlag('warehouseEntry', true);
                g.showDialog('Detective Mercer',
                    '"OAKDALE PD! NOBODY MOVE!"\n\n' +
                    'SWAT breaches from the side entrance. One thug surrenders immediately.');
                return true;
            }
            if ((p.said(6, 130) || p.said(6, 79) || p.said(14, 130)) && !g.getFlag('thugsDown')) { // talk/arrest criminal
                this.onInteract(g, 'talk', 'scarface');
                return true;
            }
            if ((p.said(3, 81) || p.said(6, 81) || p.has(81)) && g.getFlag('thugsDown')) { // get/talk victim (Lily)
                this.onInteract(g, 'use', 'lily');
                return true;
            }
            if (p.said(23, 9999)) { // shoot
                g.die("You discharged your weapon unnecessarily! The suspect's lawyer will have a field day, and Internal Affairs wants a word. Your career is over.");
                return true;
            }
            return false;
        },

        onEnter(g) {
            if (!g.getFlag('enteredWarehouse')) {
                g.setFlag('enteredWarehouse', true);
                g.addScore(10);
                audio.siren(0.5);
                setTimeout(() => {
                    g.showDialog('',
                        "*You signal SWAT. Breaching in 3... 2... 1...*\n\n" +
                        "You kick open the warehouse door. Inside, you see Lily Chen tied to a chair " +
                        "in the center of the room. Two men — one armed, one the scarfaced man from the park — " +
                        "spin toward you in shock.\n\n" +
                        "SWAT pours in from the side entrance. The armed thug immediately drops his weapon.");
                }, 300);
            }
        }
    });


    // ════════════════════════════════════════════════════════
    //  ROOM 12: CAPTAIN'S OFFICE (Victory / End Game)
    //  (Reuse captainOffice but with victory state)
    // ════════════════════════════════════════════════════════

    // Already registered above — the victory state is handled in the onEnter


    // ══════════════════════════════════════════════
    // HELPER: Draw a simple car
    // ══════════════════════════════════════════════
    function drawCar(ctx, x, y, bodyColor, accentColor, hasLightbar) {
        // Body
        Draw.rect(ctx, x, y, 50, 16, bodyColor);
        // Roof/cabin
        Draw.rect(ctx, x + 10, y - 8, 25, 10, bodyColor);
        // Windshield & rear window
        Draw.rect(ctx, x + 11, y - 7, 10, 8, C.WINDOW_CYAN);
        Draw.rect(ctx, x + 24, y - 7, 10, 8, C.WINDOW_CYAN);
        // Windshield glare
        Draw.pixel(ctx, x + 12, y - 6, C.WHITE);
        Draw.pixel(ctx, x + 13, y - 5, C.WHITE);
        // Pillar between windows
        Draw.rect(ctx, x + 22, y - 7, 1, 8, bodyColor);
        // Door line
        Draw.rect(ctx, x + 22, y, 1, 14, accentColor);
        // Door handle
        Draw.rect(ctx, x + 24, y + 5, 3, 1, C.METAL_GRAY);
        Draw.rect(ctx, x + 15, y + 5, 3, 1, C.METAL_GRAY);
        // Side trim / stripe
        Draw.rect(ctx, x, y + 6, 50, 2, accentColor);
        // Bumpers
        Draw.rect(ctx, x - 2, y + 12, 3, 3, C.METAL_GRAY);
        Draw.rect(ctx, x + 49, y + 12, 3, 3, C.METAL_GRAY);
        // Headlights
        Draw.rect(ctx, x + 48, y + 2, 3, 3, C.YELLOW);
        Draw.pixel(ctx, x + 49, y + 3, C.WHITE); // glint
        // Taillights
        Draw.rect(ctx, x - 1, y + 2, 3, 3, C.LRED);
        // Side mirror
        Draw.rect(ctx, x + 9, y - 1, 2, 2, bodyColor);
        // Wheels with hubcaps
        Draw.ellipse(ctx, x + 10, y + 16, 5, 3, VGA.nearest(20, 20, 20));
        Draw.ellipse(ctx, x + 40, y + 16, 5, 3, VGA.nearest(20, 20, 20));
        Draw.ellipse(ctx, x + 10, y + 16, 2, 1, C.METAL_GRAY); // hubcap
        Draw.ellipse(ctx, x + 40, y + 16, 2, 1, C.METAL_GRAY); // hubcap
        // Wheel well shadow
        Draw.rect(ctx, x + 5, y + 14, 10, 1, VGA.nearest(20, 20, 20));
        Draw.rect(ctx, x + 35, y + 14, 10, 1, VGA.nearest(20, 20, 20));
        if (hasLightbar) {
            Draw.rect(ctx, x + 15, y - 10, 15, 3, C.WHITE);
            Draw.rect(ctx, x + 15, y - 10, 5, 3, C.BLUE);
            Draw.rect(ctx, x + 25, y - 10, 5, 3, C.LRED);
            // Light bar chrome edge
            Draw.rect(ctx, x + 15, y - 11, 15, 1, C.METAL_GRAY);
        }
    }
}
