/* ── Badge of Honor: Streets of Oakdale — Game Initialization ──
 * Sets up the game engine, registers all rooms, and starts the game.
 */

'use strict';

(function () {

    // Wait for DOM
    window.addEventListener('DOMContentLoaded', () => {

        // ── Create the game engine ──
        const engine = new GameEngine();

        // ── Set max score ──
        engine.state.maxScore = 225;

        // ── Register all rooms ──
        registerAllRooms(engine);

        // ── Intro sequence ──
        showIntro(engine);
    });


    function showIntro(engine) {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const C = VGA.C;

        // Draw title screen
        ctx.fillStyle = VGA.toCSS(C.BLACK);
        ctx.fillRect(0, 0, 640, 400);

        // Starfield
        const rng = new SeededRandom(777);
        for (let i = 0; i < 80; i++) {
            const sx = rng.int(0, 639);
            const sy = rng.int(0, 399);
            const bright = rng.pick([VGA.C.WHITE, VGA.C.LGRAY, VGA.C.YELLOW]);
            ctx.fillStyle = VGA.toCSS(bright);
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Title badge shape (large star)
        drawTitleBadge(ctx, 320, 120);

        // Title text
        drawTitleText(ctx, 'BADGE OF HONOR', 320, 228, VGA.C.BADGE_GOLD, 4);
        drawTitleText(ctx, 'Streets of Oakdale', 320, 262, VGA.C.WHITE, 3);

        // Credits
        drawTitleText(ctx, 'An original Sierra-inspired adventure', 320, 300, VGA.C.LGRAY, 2);
        drawTitleText(ctx, 'Procedurally generated — No external assets', 320, 320, VGA.C.LGRAY, 2);

        // Prompt
        let blinkOn = true;
        const blinkInterval = setInterval(() => {
            const promptText = 'Click or press any key to begin...';
            ctx.fillStyle = VGA.toCSS(C.BLACK);
            ctx.fillRect(120, 352, 400, 30);
            if (blinkOn) {
                drawTitleText(ctx, promptText, 320, 370, VGA.C.LGREEN, 2);
            }
            blinkOn = !blinkOn;
        }, 600);

        // Wait for input
        const startGame = () => {
            clearInterval(blinkInterval);
            canvas.removeEventListener('click', startGame);
            document.removeEventListener('keydown', startGame);
            
            // Dissolve to first room
            engine.start('lockerRoom');
        };

        canvas.addEventListener('click', startGame);
        document.addEventListener('keydown', startGame);
    }


    function drawTitleBadge(ctx, cx, cy) {
        // Draw a procedural police badge (star shape)
        const gold = VGA.toCSS(VGA.C.BADGE_GOLD);
        const darkGold = VGA.toCSS(VGA.nearest(160, 130, 40));
        const blueCenter = VGA.toCSS(VGA.C.UNIFORM_BLUE);

        // Star points
        const points = 7;
        const outerR = 70;
        const innerR = 35;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const r = (i % 2 === 0) ? outerR : innerR;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = gold;
        ctx.fill();
        ctx.strokeStyle = darkGold;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.fillStyle = blueCenter;
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Badge number
        drawTitleText(ctx, '1247', cx, cy + 5, VGA.C.BADGE_GOLD, 2.5);
    }


    function drawTitleText(ctx, text, x, y, colorIndex, scale) {
        ctx.save();
        ctx.font = `bold ${Math.floor(14 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Shadow
        ctx.fillStyle = VGA.toCSS(VGA.C.BLACK);
        ctx.fillText(text, x + 2 * scale / 2, y + 2 * scale / 2);

        // Main text
        ctx.fillStyle = VGA.toCSS(colorIndex);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

})();
