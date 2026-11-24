  // =====================================================================
  //  RUSH ISLAND - the hub of the Pangolin Rush Collection
  // =====================================================================
  var STEP = 1000 / 60, GRAV = 0.022, ISR = 60;
  var GNAME = ["PANGOLIN RUSH", "PANGOLIN RUSH 2", "PANGOLIN RUSH 3", "PANGOLIN RUSH 4"];
  var GSTYLE = ["2D CLASSIC", "3D ADVENTURE", "2D CLASSIC", "3D ADVENTURE"];
  var GCOL = [hex(0x1fb5a5), hex(0xffb030), hex(0x7c6cff), hex(0x40d0ff)];
  var GCSS = ["#1fb5a5", "#ffb030", "#9a8cff", "#40d0ff"];

  // ---------------------------------------------------------------- save
  function ld(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  var medals = (parseInt(ld("prc_medals", "0"), 10) || 0) & 4095;
  var trophy = [0, 0, 0, 0]; try { var tj = JSON.parse(ld("prc_trophy", "[0,0,0,0]")); if (tj && tj.length === 4) trophy = tj; } catch (e) {}
  var raceBest = parseFloat(ld("prc_race", "0")) || 0, omegaDone = ld("prc_omega", "0") === "1", goldOn = false, nightOn = false;
  var ch = Math.max(0, Math.min(6, parseInt(ld("prc_ch", "1"), 10) || 0));
  function medalCount() { var n = 0; for (var i = 0; i < 12; i++) if (medals & (1 << i)) n++; return n; }
  function trophyCount() { var n = 0; for (var i = 0; i < 4; i++) if (trophy[i]) n++; return n; }
  function saveTrophy() { sv("prc_trophy", JSON.stringify(trophy)); }

  // ---------------------------------------------------------------- input
  var keys = {}, pressed = {}, codeBuf = "", drag = false, gameOpen = -1;
  var MAP = { ArrowLeft: "tl", ArrowRight: "tr", KeyA: "l", KeyD: "r", ArrowUp: "u", KeyW: "u", ArrowDown: "dn", KeyS: "dn",
    Space: "j", KeyJ: "j", KeyZ: "j", Enter: "e", ShiftLeft: "roll", ShiftRight: "roll", ControlLeft: "roll", ControlRight: "roll", KeyC: "roll",
    KeyX: "x", KeyK: "x", KeyQ: "cl", KeyE: "cr", KeyM: "m", KeyP: "p", Escape: "esc", KeyG: "g", KeyN: "n", Tab: "tab",
    Digit1: "d1", Digit2: "d2", Digit3: "d3", Digit4: "d4", Digit5: "d5", Digit6: "d6", Digit7: "d7" };
  // HARD MODE: H on the title or pause screen; saved in localStorage "pr_hard" and handed to each game in PRC.hard
  var HARD = false; try { HARD = localStorage.getItem("pr_hard") === "1"; } catch (e) {}
  function setHard(v) { HARD = !!v; try { localStorage.setItem("pr_hard", HARD ? "1" : "0"); } catch (e) {} }
  addEventListener("keydown", function (e) {
    if (gameOpen >= 0) return;
    unlockAudio();
    if (e.code === "KeyH" && !e.repeat && (state === "title" || paused)) { setHard(!HARD); snd("tick"); e.preventDefault(); return; }
    if (state === "title" && /^Key[A-Z]$/.test(e.code) && !e.repeat) {
      codeBuf = (codeBuf + e.code.charAt(3)).slice(-6);
      if (codeBuf === "ISLAND") { codeBuf = ""; medals = 4095; sv("prc_medals", medals); cheatMsg = 150; snd("item"); }
    }
    var m = MAP[e.code]; if (!m) return;
    e.preventDefault(); if (!keys[m]) pressed[m] = true; keys[m] = true;
  });
  addEventListener("keyup", function (e) { var m = MAP[e.code]; if (m) { keys[m] = false; e.preventDefault(); } });
  addEventListener("blur", function () { keys = {}; });
  addEventListener("pointerdown", function () { unlockAudio(); drag = true; try { cv.focus(); } catch (e) {} });
  addEventListener("pointerup", function () { drag = false; });
  addEventListener("pointermove", function (e) { if (drag && e.buttons && gameOpen < 0) cam.yaw -= (e.movementX || 0) * 0.006; });

  // ---------------------------------------------------------------- the island
  var boxes = [], flowers = [], medalO = [], signs = [], palms = [], gates = [], parts = [], popups = [];
  function box(x0, x1, z0, z1, y0, y1, col, kind) { var b = { x0: x0, x1: x1, z0: z0, z1: z1, y0: y0, y1: y1, col: col, kind: kind || "rock" }; boxes.push(b); return b; }
  var C_ROCK = hex(0x9a8670), C_DARK = hex(0x6f5f50), C_WHITE = hex(0xf2f0ea), C_RED = hex(0xe23b3b), C_GOLD = [1, 0.82, 0.2];
  // obelisk with the 12 medal slots
  box(-1.2, 1.2, -1.2, 1.2, 0, 5, hex(0xd8cfb8), "obelisk");
  // runner pads ring
  var PADS = []; for (var pi = 0; pi < 7; pi++) { var pa = (pi + 0.5) / 7 * Math.PI * 2 + Math.PI; PADS.push({ x: Math.sin(pa) * 8.5, z: Math.cos(pa) * 8.5, a: pa, i: pi }); }
  PADS.forEach(function (q) { box(q.x - Math.sin(q.a) * 1.6 - 0.7, q.x - Math.sin(q.a) * 1.6 + 0.7, q.z - Math.cos(q.a) * 1.6 - 0.7, q.z - Math.cos(q.a) * 1.6 + 0.7, 0, 1.1, hex(0xc8bfa8), "ped"); });
  // portals
  var PORT = [{ x: 0, z: 30 }, { x: 30, z: 0 }, { x: 0, z: -30 }, { x: -30, z: 0 }];
  PORT.forEach(function (o, i) { o.h = Math.atan2(-o.x, -o.z); o.i = i; var tx = o.x + Math.cos(o.h) * 4.2, tz = o.z - Math.sin(o.h) * 4.2; o.tx = tx; o.tz = tz; box(tx - 0.8, tx + 0.8, tz - 0.8, tz + 0.8, 0, 1.4, hex(0xb8ae98), "ped"); });
  // lighthouse with a spiral of steps
  var LH = { x: 38, z: 38 };
  box(LH.x - 1.6, LH.x + 1.6, LH.z - 1.6, LH.z + 1.6, 0, 11, C_WHITE, "tower");
  for (var si = 0; si < 6; si++) { var sa = si / 6 * Math.PI * 2 * 0.95 + Math.PI * 1.25, sx = LH.x + Math.sin(sa) * 3.1, sz = LH.z + Math.cos(sa) * 3.1; box(sx - 1.1, sx + 1.1, sz - 1.1, sz + 1.1, 0, 1.6 * (si + 1), si & 1 ? C_RED : C_WHITE, "step"); }
  var SPRING = { x: LH.x, z: LH.z, y: 11, t: 0 };
  // tall pillar (double jump or tongue)
  box(-19, -17, 17, 19, 0, 6.5, C_ROCK, "pillar");
  flowers.push({ x: -18, y: 9.5, z: 18 });
  // mesa (tongue only)
  box(-43, -37, -37, -31, 0, 12, C_DARK, "mesa");
  flowers.push({ x: -33, y: 6, z: -28 }, { x: -39.5, y: 14.5, z: -33.5 });
  // far islet and its spring home
  var ISLET = { x: 62, z: -62 };
  box(ISLET.x - 4, ISLET.x + 4, ISLET.z - 4, ISLET.z + 4, -3, 0.4, hex(0xe8d49a), "islet");
  flowers.push({ x: 51, y: 6, z: -51 });
  var ISPRING = { x: ISLET.x + 2, z: ISLET.z + 2, y: 0.4, t: 0 };
  // cracked rocks (a heavy landing breaks them)
  var ROCKS = [box(15, 17, -15, -13, 0, 1.6, hex(0xa89a88), "crack"), box(-47, -45, 5, 7, 0, 1.6, hex(0xa89a88), "crack")];
  ROCKS[0].medal = 6; ROCKS[1].medal = 7;
  // speed pad and the high ledge it launches to
  var SPAD = { x: 44, z: -20, t: 0 }, LEDGE = { x: 56, z: -27 };
  box(LEDGE.x - 2.2, LEDGE.x + 2.2, LEDGE.z - 2.2, LEDGE.z + 2.2, -3, 7, C_DARK, "ledge");
  // waterfall rock with a hidden cave
  box(-58, -46, 18, 23.5, 0, 10, C_ROCK, "rock"); box(-58, -46, 26.5, 32, 0, 10, C_ROCK, "rock");
  box(-58, -46, 23.5, 26.5, 3.5, 10, C_ROCK, "rock"); box(-60, -57.5, 23.5, 26.5, -2, 10, C_ROCK, "rock");
  box(-57.5, -46, 23.5, 26.5, -2, 0.01, hex(0x6a5a4a), "floor");
  // palms (decor only)
  [[12, 22], [-10, 36], [22, -8], [-26, -10], [44, 12], [-36, 38], [8, -46], [-14, -48], [30, 48], [-48, -14], [52, -20], [-6, 52]].forEach(function (q, i) { palms.push({ x: q[0], z: q[1], h: 5 + (i % 3), a: i * 1.7 }); });
  // the 12 Gold Medals
  var MPOS = [
    { x: 6, y: 1.2, z: -15, hint: "" },                      // 0 plaza
    { x: 10, y: 1.2, z: 40, hint: "" },                      // 1 north beach
    { x: LH.x, y: 12.4, z: LH.z, hint: "" },                 // 2 lighthouse top
    { x: -20, y: 1.2, z: -6, hint: "" },                     // 3 by the palms
    { x: -18, y: 7.8, z: 18, hint: "" },                     // 4 pillar top
    { x: ISLET.x, y: 1.6, z: ISLET.z, hint: "" },            // 5 far islet
    { x: 16, y: 1.2, z: -14, hint: "", hid: true },          // 6 under cracked rock A
    { x: -46, y: 1.2, z: 6, hint: "", hid: true },           // 7 under cracked rock B
    { x: -40, y: 13.3, z: -34, hint: "" },                   // 8 mesa top
    { x: LEDGE.x, y: 8.3, z: LEDGE.z, hint: "" },            // 9 high ledge
    { x: -53, y: 1.2, z: 25, hint: "" },                     // 10 waterfall cave
    { x: 22, y: 28, z: 22, hint: "" }                        // 11 sky
  ];
  MPOS.forEach(function (m, i) { medalO.push({ x: m.x, y: m.y, z: m.z, i: i, hid: !!m.hid }); });
  signs.push({ x: -14, z: 14, t: ["TOO HIGH TO JUMP?", "A DOUBLE JUMP OR A LONG TONGUE", "MIGHT GET YOU UP THERE."] });
  signs.push({ x: 43, z: -23, t: ["SPEED PAD", "HIT IT AT FULL BOOST", "TO REACH THE LEDGE."] });
  signs.push({ x: 39, z: -39, t: [] });
  signs.push({ x: 38, z: -34, t: ["SEE THAT ISLET?", "GLIDE, DASH, HOP OR BOOST", "TO CROSS THE WATER."] });
  signs.push({ x: -31, z: -24, t: ["GRAPPLE FLOWERS", "ONLY A CHAMELEON'S TONGUE", "CAN GRAB THEM."] });
  signs.push({ x: 18.5, z: -11, t: ["CRACKED ROCK", "SOMETHING HEAVY LANDING", "ON IT MIGHT CRACK IT."] });
  signs.push({ x: 0, z: -18, t: ["RING RACE", "4 MEDALS OPENS THE RACE.", "STEP ON THE PAD TO START."] });
  signs.push({ x: 33, z: 33.5, t: ["LIGHTHOUSE", "THE SPRING ON TOP AIMS SKY-HIGH.", "FLOATERS FIND MORE UP THERE."] });
  signs = signs.filter(function (s) { return s.t.length; });
  // ring race gates
  for (var gi = 0; gi < 10; gi++) { var ga = (18 + gi * 36) * Math.PI / 180; gates.push({ x: Math.sin(ga) * 44, z: Math.cos(ga) * 44, a: ga }); }
  var RPAD = { x: 0, z: -21 }, race = null, GOLD_T = 14.5, SILV_T = 20;

  // ---------------------------------------------------------------- the runner
  var p, cam = { x: 0, y: 6, z: -24, yaw: 0, ty: 0, tv: 0 }, lastSafe = { x: 0, y: 0, z: -14, h: 0 };
  function newRunner(x, y, z, h) {
    return { x: x, y: y, z: z, h: h, s: 0, vy: 0, side: 0, tv: 0, ground: true, jumping: false, roll: false, dash: 0, dashUsed: false, hopUsed: false,
      glide: false, dive: false, pound: false, heat: 0, lock: 0, boosting: false, zip: null, zcd: 0, tongue: 0, anim: 0, spin: 0, launch: null, inv: 0, qT: 0, qcd: 0, pad: -1 };
  }
  p = newRunner(0, 0, -14, 0);
  function inBox(b, x, z, m) { return x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m; }
  function floorAt(x, z, y) {
    var best = -1e9, i, b;
    if (scene === "boss") return Math.hypot(x, z) < 16 ? 0 : -1e9;
    if (Math.hypot(x, z) < ISR + 2) best = 0;
    for (i = 0; i < boxes.length; i++) { b = boxes[i]; if (b.gone || !inBox(b, x, z, 0.05)) continue; if (b.y1 <= y + 0.55 && b.y1 > best) best = b.y1; }
    return best;
  }
  function sideBlock(q) {
    if (scene === "boss") return;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]; if (b.gone || b.kind === "floor") continue;
      if (!inBox(b, q.x, q.z, 0.45) || q.y >= b.y1 - 0.5 || q.y + 1.3 <= b.y0) continue;
      var dl = q.x - (b.x0 - 0.45), dr = (b.x1 + 0.45) - q.x, dn = q.z - (b.z0 - 0.45), df = (b.z1 + 0.45) - q.z, m = Math.min(dl, dr, dn, df);
      if (m === dl) q.x = b.x0 - 0.45; else if (m === dr) q.x = b.x1 + 0.45; else if (m === dn) q.z = b.z0 - 0.45; else q.z = b.z1 + 0.45;
    }
  }
  function ceilHit(q, ny) {
    if (scene === "boss") return false;
    for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (b.gone || !inBox(b, q.x, q.z, 0.2)) continue; if (b.y0 > q.y + 1.2 && ny + 1.4 > b.y0) return true; }
    return false;
  }
  function attacking() { return p.jumping || p.roll || p.dash > 0 || p.boosting || p.dive || p.pound || !!p.zip || p.qT > 0; }
  function popup(s, col) { popups.push({ s: s, t: 90, col: col || "#ffd23f" }); }
  function burst(x, y, z, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, b = Math.random() * 0.25; parts.push({ x: x, y: y, z: z, vx: Math.cos(a) * b, vy: 0.05 + Math.random() * 0.2, vz: Math.sin(a) * b, t: 30 + (i % 10), col: col, s: 0.12 }); } }
  function setRunner(i) { if (i === ch) return; ch = i; sv("prc_ch", i); snd("ok"); popup(CH[i].n + "!", "#ffffff"); burst(p.x, p.y + 1, p.z, [1, 1, 1], 14); p.heat = 0; p.lock = 0; }

  function stepRunner() {
    var c = CH[ch], q = p;
    if (q.inv > 0) q.inv--; if (q.qT > 0) q.qT--; if (q.qcd > 0) q.qcd--;
    if (q.launch) {
      var L = q.launch; L.t++; var u = Math.min(1, L.t / L.n);
      q.x = L.x0 + (L.x1 - L.x0) * u; q.z = L.z0 + (L.z1 - L.z0) * u; q.y = L.y0 + (L.y1 - L.y0) * u + Math.sin(u * Math.PI) * L.arc;
      q.h = Math.atan2(L.x1 - L.x0, L.z1 - L.z0); q.spin += 0.4; q.jumping = true;
      if (u >= 1) { q.launch = null; q.vy = 0; q.s = 0.15; q.ground = false; }
      return;
    }
    var top = c.top, tIn = (keys.tl ? 1 : 0) - (keys.tr ? 1 : 0), iz = (keys.u ? 1 : 0) - (keys.dn ? 1 : 0), ix = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    // steering: arrows turn the runner, the camera follows (same feel as Pangolin Rush 4)
    var tRate = !q.ground ? 0.05 : q.roll ? 0.045 : 0.075 - 0.025 * Math.min(1, q.s / top);
    q.tv += (tIn * tRate - q.tv) * (tIn ? 0.35 : 0.5); if (Math.abs(q.tv) < 0.0005) q.tv = 0;
    q.h += q.tv;
    // boosters
    q.boosting = false;
    if (ch === 5 || ch === 6) {
      if (q.lock > 0) { q.lock--; q.heat = Math.max(0, q.heat - 1 / 120); }
      else if (keys.x) { q.boosting = true; q.heat += 1 / 110; if (q.heat >= 1) { q.heat = 1; q.lock = 120; q.boosting = false; snd("heat"); popup("OVERHEAT!", "#ff6040"); } }
      else q.heat = Math.max(0, q.heat - 1 / 40);
      if (q.boosting) { q.s = Math.max(q.s, top * (ch === 5 ? 2.0 : 2.4)); q.roll = false; q.dive = false; if (tick % 6 === 0) snd("boost"); if (ch === 5 && !q.ground) q.vy = Math.max(q.vy, 0); }
    }
    // KAI: tongue zip onto grapple flowers (and the boss when it is down)
    if (ch === 4) {
      if (q.zcd > 0) q.zcd--; if (q.tongue > 0) q.tongue = Math.max(0, q.tongue - 0.1);
      if (pressed.x) q.zbuf = 10; else if (q.zbuf > 0) q.zbuf--;
      if (q.zbuf > 0 && !q.zcd && !q.zip) {
        q.zbuf = 0; var best = null, bd = 12.5;
        var cand = function (x, y, z) { var d = Math.hypot(x - q.x, z - q.z, (y - q.y) * 0.5); if (d > 2 && d < bd && Math.abs(y - q.y) < 10.5) { bd = d; best = { x: x, y: y, z: z }; } };
        if (scene === "island") flowers.forEach(function (f) { cand(f.x, f.y, f.z); });
        if (scene === "boss" && OM && OM.ph === "down") cand(OM.x, 1.6, OM.z);
        // TONGUE GRAPPLE: no flower in reach, so grab the nearest ledge or box top ahead/above
        var gr = false;
        if (!best) {
          var h0 = q.h;
          for (var ga = -2; ga <= 2; ga++) {
            var gan = h0 + ga * 0.22, grx = Math.sin(gan), grz = Math.cos(gan), gpv = floorAt(q.x, q.z, q.y);
            for (var gd = 2; gd <= 11; gd += 0.5) {
              var gx = q.x + grx * gd, gz = q.z + grz * gd, gt = floorAt(gx, gz, q.y + 6.5);
              if (gt > -1e8 && gt > gpv + 0.8) {
                if (gt > q.y - 1.5) { var gx2 = gx + grx * 1.2, gz2 = gz + grz * 1.2, gt2 = floorAt(gx2, gz2, gt);
                  if (gt2 > -1e8 && Math.abs(gt2 - gt) < 0.5) { gx = gx2; gz = gz2; }
                  var gdd = Math.hypot(gx - q.x, gz - q.z, gt - q.y); if (gdd < bd) { bd = gdd; best = { x: gx, y: gt + 1.3, z: gz }; gr = true; } break; }
              }
              gpv = gt;
            }
          }
        }
        q.zcd = 6; q.tongue = 1; snd("dash");
        if (best) { if (gr) popup("GRAB!", "#7fff8a"); q.zip = { x: best.x, y: best.y, z: best.z, t: 0, gr: gr }; q.h = Math.atan2(best.x - q.x, best.z - q.z); q.ground = false; q.jumping = true; q.roll = false; q.dive = false; q.pound = false; }
      }
      if (q.zip) {
        var Zp = q.zip; Zp.t++;
        var zx = Zp.x - q.x, zy = Zp.y - 0.6 - q.y, zz = Zp.z - q.z, zd = Math.hypot(zx, zy, zz);
        if (zd < 0.9 || Zp.t > 34) { q.zip = null; q.vy = Zp.gr ? 0.16 : 0.22; q.s = Math.min(q.s, Zp.gr ? 0.06 : 0.2); }
        else { var zs = Math.min(0.85, zd); q.x += zx / zd * zs; q.y += zy / zd * zs; q.z += zz / zd * zs; q.vy = 0; q.spin += 0.5; q.tongue = 1; return; }
      }
    }
    // speed
    if (iz > 0) { if (q.s < top) q.s = Math.min(top, q.s + (q.ground ? c.acc : c.acc * 0.6)); }
    else if (iz < 0) q.s = Math.max(0, q.s - (q.ground ? 0.03 : 0.05));
    else if (q.ground && !q.roll && !q.boosting) q.s = Math.max(0, q.s - 0.014);
    if (!q.ground && !q.boosting && !q.dash && q.s > top * 1.05) q.s = Math.max(top, q.s - 0.012);
    if (q.ground && !q.roll && !q.boosting && q.s > top) q.s = Math.max(top, q.s - 0.01);
    if (q.roll) { q.s = Math.max(0, q.s - 0.004); if (q.s < 0.06 && q.ground) q.roll = false; }
    q.side += ((ix * 0.17) - q.side) * 0.3;
    if (pressed.roll && q.ground && q.s > 0.12 && !q.roll) { q.roll = true; snd("dash"); }
    // jump and air moves
    if (pressed.j && q.ground) { q.vy = c.jump; q.ground = false; q.jumping = true; q.roll = false; q.dashUsed = false; q.hopUsed = false; q.sprung = false; snd("jump"); }
    else if (pressed.j && !q.ground) {
      if (ch === 0 && !q.dashUsed) { q.dashUsed = true; q.dash = 14; snd("dash"); }
      if (ch === 3 && !q.hopUsed) { q.hopUsed = true; q.vy = c.jump * 0.88; q.sprung = false; snd("heart"); burst(q.x, q.y + 0.3, q.z, [1, 0.3, 0.5], 6);
        for (var hj = 0; hj < 10; hj++) { var ha = hj / 10 * 6.283; parts.push({ x: q.x, y: q.y - 0.2, z: q.z, vx: Math.cos(ha) * 0.1, vy: -0.03, vz: Math.sin(ha) * 0.1, t: 20, col: [1, 0.45, 0.7], s: 0.14, heart: true }); } }
    }
    if (ch === 0 && pressed.x && !q.ground && !q.dashUsed) { q.dashUsed = true; q.dash = 14; snd("dash"); }
    if (q.dash > 0) { q.dash--; q.s = Math.max(q.s, 0.75); q.vy = 0; }
    if (!keys.j && q.jumping && !q.sprung && q.vy > 0.2) q.vy = 0.2;
    q.glide = ch === 1 && !q.ground && keys.j && q.vy < 0 && !q.dive;
    if (ch === 5) {
      if (q.ground) q.hov = 0;
      else if (keys.j && q.vy < 0 && (q.hov || 0) < 80 && !q.boosting) { q.hov = (q.hov || 0) + 1; q.vy = 0.018; if (tick % 4 === 0) burst(q.x, q.y - 0.2, q.z, [1, 0.88, 0.35], 1); }
    }
    if (q.glide) q.s = Math.max(q.s, 0.36);
    if (ch === 1 && !q.ground && pressed.roll && !q.dive) { q.dive = true; q.s += 0.1; }
    if (q.dive) q.vy = -0.9;
    if (ch === 2 && !q.ground && pressed.roll && !q.pound) { q.pound = true; snd("dash"); }
    if (q.pound) { q.s = 0; q.vy = -1.0; }
    if (ch === 2 && pressed.x && !q.qcd) { q.qcd = 90; q.qT = 16; snd("dash"); }
    // gravity
    if (!q.ground && !q.dash) { q.vy -= GRAV; if (q.glide && q.vy < -0.05) q.vy = -0.05; if (q.vy < -1.1) q.vy = -1.1; }
    // move
    var fx = Math.sin(q.h), fz = Math.cos(q.h), rx = Math.cos(q.h), rz = -Math.sin(q.h);
    q.x += fx * q.s + rx * q.side; q.z += fz * q.s + rz * q.side;
    if (scene === "boss") { var bd0 = Math.hypot(q.x, q.z); if (bd0 > 17.5) { q.x *= 17.5 / bd0; q.z *= 17.5 / bd0; } }
    sideBlock(q);
    if (q.s > 0.02 && q.ground) q.anim += q.s * 0.9;
    if (!q.ground || q.roll) q.spin += 0.25 + q.s * 0.4;
    // vertical
    var fl = floorAt(q.x, q.z, q.y);
    if (q.ground) {
      if (fl > -1e8 && fl <= q.y + 0.55 && fl >= q.y - 0.6) q.y = fl;
      else { q.ground = false; q.vy = 0; }
    } else {
      var ny = q.y + q.vy;
      if (q.vy > 0 && ceilHit(q, ny)) { q.vy = 0; ny = q.y; }
      if (q.vy <= 0 && fl > -1e8 && ny <= fl && q.y >= fl - 0.6) { q.y = fl; land(); }
      else q.y = ny;
    }
    if (q.ground && scene === "island") {
      if (Math.hypot(q.x, q.z) < ISR - 2) { lastSafe.x = q.x; lastSafe.y = q.y; lastSafe.z = q.z; lastSafe.h = q.h; }
    }
    if (q.y < -4) splash();
  }
  function land() {
    var q = p, wasPound = q.pound, wasDive = q.dive && ch === 1;
    q.ground = true; q.jumping = false; q.dive = false; q.dashUsed = false; q.hopUsed = false; q.glide = false; q.dash = 0; q.vy = 0;
    if (wasPound) {
      q.pound = false; snd("pound"); shake = 8;
      for (var i = 0; i < 14; i++) { var a = i / 14 * 6.28; parts.push({ x: q.x, y: q.y + 0.2, z: q.z, vx: Math.cos(a) * 0.25, vy: 0.05, vz: Math.sin(a) * 0.25, t: 18, col: [0.85, 0.75, 0.55], s: 0.18 }); }
      if (scene === "island") ROCKS.forEach(function (r) { if (!r.gone && inBox(r, q.x, q.z, 0.3) && Math.abs(q.y - r.y1) < 0.3) { r.gone = true; snd("pop"); burst((r.x0 + r.x1) / 2, 1, (r.z0 + r.z1) / 2, [0.65, 0.6, 0.55], 30); popup("CRACK!"); medalO[r.medal].hid = false; q.y = floorAt(q.x, q.z, q.y); } });
    }
    // JUNO: DIVE BOUNCE, a dive that lands springs her back up, ready to glide again
    if (wasDive && !wasPound) { q.ground = false; q.jumping = true; q.sprung = true; q.vy = CH[1].jump * 0.92; popup("BOUNCE!", "#ffb060"); snd("spring"); burst(q.x, q.y + 0.2, q.z, [1, 0.75, 0.4], 10); }
  }
  function splash() {
    burst(p.x, -0.5, p.z, [0.6, 0.8, 1], 20); snd("no");
    if (scene === "boss") { hurtP(true); p.x = 0; p.z = -8; p.y = 0; p.vy = 0; p.s = 0; p.ground = true; return; }
    popup("SPLASH!", "#9ee0ff"); var h = lastSafe.h; p = newRunner(lastSafe.x, lastSafe.y, lastSafe.z, h); p.inv = 60; cam.yaw = h;
    if (race) { race = null; popup("RACE OVER: YOU FELL IN", "#ff8080"); }
  }

  // ---------------------------------------------------------------- island logic
  var state = "title", scene = "island", tick = 0, titleT = 0, cheatMsg = 0, shake = 0, near = null, paused = false, flash = 0, endT = 0;
  function collectMedal(i) {
    if (medals & (1 << i)) return;
    medals |= 1 << i; sv("prc_medals", medals); snd("item"); var n = medalCount(); flash = 10;
    popup("GOLD MEDAL " + n + "/12", "#ffd23f");
    if (n === 4) popup("RING RACE OPEN!", "#9ee0ff");
    if (n === 8) popup("MEDAL RADAR ON!", "#9ee0ff");
    if (n === 12) popup("THE OBELISK AWAKENS...", "#ff9ae0");
  }
  function stepIsland() {
    stepRunner();
    near = null;
    // runner pads
    var onPad = -1;
    PADS.forEach(function (q) { if (Math.hypot(p.x - q.x, p.z - q.z) < 1.2 && p.y < 0.6) onPad = q.i; });
    if (onPad >= 0 && p.pad !== onPad) setRunner(onPad);
    p.pad = onPad;
    for (var d = 1; d <= 7; d++) if (pressed["d" + d]) setRunner(d - 1);
    if (pressed.tab) setRunner((ch + 1) % 7);
    // portals
    PORT.forEach(function (o) { if (Math.hypot(p.x - o.x, p.z - o.z) < 2.6 && p.y < 4) near = { k: "portal", i: o.i }; });
    // vault warp
    if (medalCount() === 12 && Math.hypot(p.x, p.z + 3.2) < 1.6 && p.y < 1) near = { k: "vault" };
    if (near && pressed.e) {
      if (near.k === "portal") { openGame(near.i); return; }
      if (near.k === "vault") { startBoss(); return; }
    }
    // signs
    signs.forEach(function (s) { if (Math.hypot(p.x - s.x, p.z - s.z) < 3 && !near) near = { k: "sign", s: s }; });
    // medals
    medalO.forEach(function (m) { if (!m.hid && !(medals & (1 << m.i)) && Math.hypot(p.x - m.x, p.z - m.z) < (m.i === 11 ? 2 : 1.4) && Math.abs(p.y + 0.7 - m.y) < (m.i === 11 ? 2 : 1.5)) { collectMedal(m.i); burst(m.x, m.y, m.z, [1, 0.85, 0.2], 24); } });
    // lighthouse spring, islet spring, speed pad
    if (SPRING.t) SPRING.t--; if (ISPRING.t) ISPRING.t--; if (SPAD.t) SPAD.t--;
    if (Math.hypot(p.x - SPRING.x, p.z - SPRING.z) < 1 && Math.abs(p.y - SPRING.y) < 0.4 && p.vy <= 0) { p.vy = 1.0; p.ground = false; p.jumping = true; p.sprung = true; p.dashUsed = false; p.hopUsed = false; SPRING.t = 15; snd("spring"); }
    if (Math.hypot(p.x - ISPRING.x, p.z - ISPRING.z) < 1 && Math.abs(p.y - ISPRING.y) < 0.4) { p.launch = { x0: p.x, y0: p.y, z0: p.z, x1: 40, y1: 0, z1: -40, arc: 14, t: 0, n: 80 }; ISPRING.t = 15; snd("spring"); }
    if (Math.hypot(p.x - SPAD.x, p.z - SPAD.z) < 1.5 && p.ground && !SPAD.t) {
      if (p.s >= 0.8) { p.launch = { x0: p.x, y0: p.y, z0: p.z, x1: LEDGE.x, y1: 7, z1: LEDGE.z, arc: 6, t: 0, n: 45 }; snd("spring"); popup("FULL BOOST!", "#ffb030"); SPAD.t = 30; }
      else if (p.s > 0.05) { popup("TOO SLOW!", "#ff8080"); snd("no"); SPAD.t = 60; }
    }
    // ring race
    if (!race && medalCount() >= 4 && Math.hypot(p.x - RPAD.x, p.z - RPAD.z) < 1.6 && p.y < 0.6) { race = { t: -180, g: 0 }; snd("ok"); p.s = 0; p.h = gates[0] ? Math.atan2(gates[0].x - p.x, gates[0].z - p.z) : 0; cam.yaw = p.h; }
    if (race) {
      if (race.t < 0) { race.t++; p.s = 0; if (race.t % 60 === 0) snd(race.t === 0 ? "post" : "tick"); }
      else {
        race.t++;
        var gt = gates[race.g];
        if (Math.hypot(p.x - gt.x, p.z - gt.z) < 3 && p.y < 6) { race.g++; snd("spark"); if (race.g >= gates.length) finishRace(); }
        if (race && race.t > 60 * 60) { race = null; popup("TIME UP", "#ff8080"); }
      }
    }
  }
  function finishRace() {
    var t = race.t / 60; race = null;
    var nb = !raceBest || t < raceBest; if (nb) { raceBest = t; sv("prc_race", t.toFixed(2)); }
    popup((t <= GOLD_T ? "GOLD! " : t <= SILV_T ? "SILVER! " : "FINISH! ") + t.toFixed(2) + "s" + (nb ? "  NEW BEST" : ""), t <= GOLD_T ? "#ffd23f" : "#ffffff"); snd("goal");
  }

  // ---------------------------------------------------------------- the games
  var gw = document.getElementById("gw"), gf = document.getElementById("gf"), backB = document.getElementById("back");
  function prelude(i) {
    return "<script>window.PRC={ch:" + JSON.stringify(CH[ch].n) + ",game:" + (i + 1) + ",hard:" + (HARD ? "true" : "false") + ",setHard:function(v){try{parent.postMessage({prc:'hard',v:!!v},'*')}catch(x){}}," + "report:function(e){try{parent.postMessage({prc:'report',g:" + i + ",e:e},'*')}catch(x){}}};" +
      "addEventListener('keydown',function(e){if(e.code==='Backspace'){e.preventDefault();e.stopPropagation();try{parent.postMessage({prc:'hub'},'*')}catch(x){}}},true);<\/script>";
  }
  var GAMES = [], loading = -1;
  function unpack(i, done) {
    if (GAMES[i]) return done(GAMES[i]);
    try {
      var b = document.getElementById("z" + i).textContent.replace(/\s+/g, ""), bin = atob(b), u = new Uint8Array(bin.length);
      for (var j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
      var ds = new DecompressionStream("gzip");
      new Response(new Blob([u]).stream().pipeThrough(ds)).text().then(function (t) { GAMES[i] = t; done(t); }, function () { done(null); });
    } catch (e) { done(null); }
  }
  function openGame(i) {
    if (loading >= 0) return;
    loading = i; popup("LOADING " + GNAME[i] + "...", "#9ee0ff");
    unpack(i, function (t) { loading = -1; if (!t) { popup("THIS BROWSER CAN'T UNPACK THE GAME", "#ff8080"); return; } openGame2(i, t); });
  }
  function openGame2(i, src) {
    var hi = src.search(/<head[^>]*>/i);
    if (hi >= 0) { var he = src.indexOf(">", hi) + 1; src = src.slice(0, he) + prelude(i) + src.slice(he); } else src = prelude(i) + src;
    gameOpen = i; keys = {}; pressed = {}; snd("goal");
    gw.style.display = "block"; gf.srcdoc = src;
    gf.onload = function () { try { gf.focus(); gf.contentWindow.focus(); } catch (e) {} };
  }
  function closeGame() {
    if (gameOpen < 0) return;
    var o = PORT[gameOpen]; gameOpen = -1; gf.onload = null; gf.srcdoc = "<html><body style='background:#000'></body></html>"; gw.style.display = "none";
    p = newRunner(o.x + Math.sin(o.h) * 4.5, 0, o.z + Math.cos(o.h) * 4.5, o.h); cam.yaw = o.h; keys = {}; pressed = {};
    try { cv.focus(); } catch (e) {} last = 0;
  }
  if (backB) backB.addEventListener("click", function () { closeGame(); });
  addEventListener("message", function (e) {
    var d = e.data; if (!d || !d.prc) return;
    if (d.prc === "hub") closeGame();
    if (d.prc === "hard") setHard(d.v);
    if (d.prc === "report" && d.g >= 0 && d.g < 4) {
      var lvl = d.e === "true" ? 2 : 1;
      if (lvl > (trophy[d.g] || 0)) { trophy[d.g] = lvl; saveTrophy(); newTrophy = 240; newTrophyG = d.g; }
    }
  });
  var newTrophy = 0, newTrophyG = 0;

  // ---------------------------------------------------------------- GEARBOLT OMEGA (secret boss)
  var OM = null, hearts = 3;
  function startBoss() {
    scene = "boss"; state = "boss"; hearts = 3; race = null; snd("goal");
    p = newRunner(0, 0, -10, 0); cam.yaw = 0; cam.x = 0; cam.z = -18; cam.y = 6;
    OM = { x: 0, y: 7, z: 6, hp: 8, ph: "intro", t: 0, a: 0, bombs: [], wave: null, inv: 0, dead: 0, tx: 0, tz: 0 };
    parts = []; popup("GEARBOLT OMEGA!", "#ff6060");
  }
  function hurtP(fall) {
    if (!fall && (p.inv > 0 || OM && OM.dead)) return;
    if (!fall && ch === 6 && p.boosting) { p.inv = 30; popup("CLANG!", "#c8d0d8"); return; }
    hearts--; p.inv = 100; snd("lose"); shake = 10;
    if (!fall) { p.vy = 0.3; p.ground = false; p.s = 0; }
    if (hearts <= 0) { state = "bosslose"; endT = 0; snd("die"); }
  }
  function stepBoss() {
    var B = OM;
    stepRunner();
    if (B.inv) B.inv--;
    B.t++;
    if (B.dead) {
      B.dead++; B.y -= 0.03; if (B.dead % 6 === 0) { burst(B.x + (Math.random() - 0.5) * 3, B.y + Math.random() * 3, B.z + (Math.random() - 0.5) * 3, [1, 0.6, 0.2], 10); snd("pop"); shake = 6; }
      if (B.dead > 180) { state = "omegawin"; endT = 0; omegaDone = true; sv("prc_omega", "1"); goldOn = true; snd("goal"); }
      return;
    }
    if (B.ph === "intro") { B.y = 7 + Math.sin(B.t * 0.05); if (B.t > 120) { B.ph = "hover"; B.t = 0; } }
    else if (B.ph === "hover") {
      B.a += 0.012 + (8 - B.hp) * 0.002; B.x = Math.sin(B.a) * 10; B.z = Math.cos(B.a) * 10; B.y = 7 + Math.sin(B.t * 0.08) * 0.6;
      if (B.t % Math.round(Math.max(30, 55 - (8 - B.hp) * 4) / (HARD ? 1.3 : 1)) === 0) B.bombs.push({ x: p.x, z: p.z, y: B.y, t: 60 });
      if (B.t > 240) { B.ph = "aim"; B.t = 0; }
    } else if (B.ph === "aim") {
      if (B.t < 45) { B.x += (p.x - B.x) * 0.05; B.z += (p.z - B.z) * 0.05; } B.y += (8 - B.y) * 0.1;
      if (B.t > 70) { B.ph = "slam"; B.t = 0; B.tx = B.x; B.tz = B.z; }
    } else if (B.ph === "slam") {
      B.y -= 0.6; if (B.y <= 1.2) { B.y = 1.2; B.ph = "down"; B.t = 0; shake = 12; snd("pound"); B.wave = { x: B.x, z: B.z, r: 2.2, d: 15 }; burst(B.x, 0.3, B.z, [0.9, 0.8, 0.6], 24); }
    } else if (B.ph === "down") {
      if (B.t > 170) { B.ph = "rise"; B.t = 0; }
    } else if (B.ph === "rise") { B.y += 0.12; if (B.y >= 7) { B.ph = "hover"; B.t = 0; } }
    // shockwave: jump over it
    if (B.wave) {
      var w = B.wave;
      if (w.d > 0) w.d--;
      else {
        w.r += HARD ? 0.31 : 0.24;
        var dr = Math.hypot(p.x - w.x, p.z - w.z) - w.r;
        if (Math.abs(dr) < 0.4 && p.y < 0.35 && !p.launch) hurtP(false);
      }
      if (w.r > 26) B.wave = null;
    }
    // bombs
    for (var i = B.bombs.length - 1; i >= 0; i--) {
      var bb = B.bombs[i]; bb.t--; bb.y = Math.max(0.4, bb.y - (bb.y - 0.4) * 0.06);
      if (bb.t <= 0) { B.bombs.splice(i, 1); burst(bb.x, 0.6, bb.z, [1, 0.5, 0.15], 16); snd("pop"); if (Math.hypot(p.x - bb.x, p.z - bb.z) < 2.3 && p.y < 2.5) hurtP(false); }
    }
    // body contact
    var dx = p.x - B.x, dz = p.z - B.z, dy = p.y + 0.7 - (B.y + 0.6), dd = Math.hypot(dx, dz);
    if (dd < 2.4 && Math.abs(dy) < 2.2) {
      if (B.ph === "down" && attacking() && !B.inv) {
        if (HARD && (B.hc = (B.hc || 0) + 1) % 3 === 2) popup("CLANG! ARMOR HELD", "#ff8080"); else B.hp--; B.inv = 40; snd("pop"); shake = 8; burst(B.x, B.y + 1, B.z, [1, 0.9, 0.3], 20);
        if (p.dive && ch === 1) { p.vy = CH[1].jump * 0.92; p.sprung = true; popup("BOUNCE!", "#ffb060"); } else p.vy = 0.38;
        p.zip = null; p.ground = false; p.jumping = true; p.pound = false; p.dive = false; p.s = 0.3; p.h = Math.atan2(dx, dz);
        popup(B.hp > 0 ? "HIT! " + B.hp + " TO GO" : "GEARBOLT OMEGA IS DONE!", "#ffd23f");
        if (B.hp <= 3 && B.hp > 0) B.t = Math.max(B.t, 100);
        if (B.hp <= 0) { B.dead = 1; B.bombs = []; B.wave = null; }
      } else if (B.ph === "slam" || B.ph === "hover" || B.ph === "aim") { hurtP(false); p.h = Math.atan2(dx, dz); p.s = 0.35; }
      if (dd < 1.8) { p.x = B.x + dx / (dd || 1) * 1.8; p.z = B.z + dz / (dd || 1) * 1.8; }
    }
  }

  // ---------------------------------------------------------------- camera
  function stepCam() {
    var oIn = (keys.cl ? 1 : 0) - (keys.cr ? 1 : 0);
    cam.tv += ((oIn * 0.06) - cam.tv) * 0.2; if (Math.abs(cam.tv) < 0.0005) cam.tv = 0;
    cam.yaw += cam.tv;
    if (!drag && !oIn && !p.zip) { var cdf = angDiff(p.h, cam.yaw); if (Math.abs(cdf) < 2.6 || p.s > 0.08) cam.yaw += cdf * (0.08 + Math.min(0.08, p.s * 0.1)); }
    cam.ty += (p.y - cam.ty) * 0.15;
    var fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), d = 8 + p.s * 3;
    cam.x += (p.x - fx * d - cam.x) * 0.3; cam.z += (p.z - fz * d - cam.z) * 0.3; cam.y += (cam.ty + 3.6 - cam.y) * 0.2;
    if (shake) shake--;
  }

  // ---------------------------------------------------------------- update
  function update() {
    tick++;
    if (cheatMsg) cheatMsg--; if (flash) flash--; if (newTrophy) newTrophy--;
    if (pressed.m) muted = !muted;
    for (var i = parts.length - 1; i >= 0; i--) { var q = parts[i]; q.x += q.vx; q.y += q.vy; q.z += q.vz; q.vy -= 0.01; if (--q.t <= 0) parts.splice(i, 1); }
    for (i = popups.length - 1; i >= 0; i--) if (--popups[i].t <= 0) popups.splice(i, 1);
    if (state === "title") { titleT++; if (pressed.e || pressed.j) { state = "play"; snd("ok"); cam.yaw = p.h; } return; }
    if (state === "omegawin" || state === "bosslose") {
      endT++;
      if (endT > 60 && pressed.e) { scene = "island"; state = "play"; OM = null; p = newRunner(0, 0, -5, 0); cam.yaw = 0; popups = []; if (omegaDone) popup("GOLDEN RUNNERS UNLOCKED: PRESS G", "#ffd23f"); }
      return;
    }
    if (pressed.p) paused = !paused;
    if (paused) return;
    if (pressed.g && omegaDone) { goldOn = !goldOn; snd("tick"); }
    if (pressed.n && trophyCount() === 4) { nightOn = !nightOn; snd("tick"); }
    if (state === "boss") stepBoss(); else stepIsland();
    stepCam();
  }

  // ---------------------------------------------------------------- render
  var VPM = null, last = 0, acc2 = 0;
  function project(x, y, z) {
    var M = VPM, cx0 = M[0] * x + M[4] * y + M[8] * z + M[12], cy0 = M[1] * x + M[5] * y + M[9] * z + M[13], cw = M[3] * x + M[7] * y + M[11] * z + M[15];
    if (cw <= 0.1) return null; return { x: (cx0 / cw * 0.5 + 0.5) * VW, y: (1 - (cy0 / cw * 0.5 + 0.5)) * 240, d: cw };
  }
  function drawMedal(x, y, z, a, sc) {
    sc = sc || 1;
    draw(TOR, X(T(x, y, z), RY(a), S(0.55 * sc, 0.55 * sc, 0.9 * sc)), C_GOLD, 0, 0.45);
    draw(SPH, X(T(x, y, z), RY(a), S(0.42 * sc, 0.42 * sc, 0.12 * sc)), [1, 0.92, 0.45], 0, 0.5);
  }
  function drawPalm(o) {
    for (var i = 0; i < 6; i++) draw(CUBE, X(T(o.x + Math.sin(i * 0.3) * 0.3 * i * 0.2, i * o.h / 6 + o.h / 12, o.z), S(0.5, o.h / 6 + 0.05, 0.5)), i & 1 ? [0.55, 0.38, 0.22] : [0.48, 0.32, 0.18]);
    var tx = o.x + Math.sin(1.5) * 0.36, ty = o.h;
    for (i = 0; i < 6; i++) { var a = o.a + i / 6 * 6.28 + Math.sin(tick * 0.02 + i) * 0.05; draw(CUBE, X(T(tx, ty, o.z), RY(a), RX(0.35), T(0, 0, 1.4), S(0.7, 0.12, 2.8)), [0.2, 0.62, 0.25]); }
    draw(SPH, X(T(tx, ty - 0.2, o.z), S(0.45)), [0.45, 0.3, 0.15]);
  }
  function drawIsland() {
    var night = nightOn;
    gl.uniform3fv(U.uFog, night ? [0.03, 0.04, 0.12] : [0.62, 0.84, 1]); gl.uniform1f(U.uFN, 60); gl.uniform1f(U.uFF, 190);
    gl.uniform3fv(U.uG1, night ? [0.15, 0.34, 0.2] : [0.36, 0.78, 0.36]); gl.uniform3fv(U.uG2, night ? [0.12, 0.3, 0.17] : [0.31, 0.7, 0.32]);
    gl.uniform3fv(U.uW1, [0.6, 0.55, 0.45]); gl.uniform3fv(U.uW2, [0.52, 0.47, 0.4]);
    // sea, sand, grass
    draw(CUBE, X(T(0, -1.2, 0), S(600, 0.5, 600)), night ? [0.05, 0.12, 0.3] : [0.15, 0.45, 0.85], 0, 0.1);
    for (var w = 0; w < 3; w++) { var wr = ISR + 2 + ((tick * 0.03 + w * 4) % 12); draw(TOR, X(T(0, -0.93, 0), RX(Math.PI / 2), S(wr, wr, 0.4)), [0.85, 0.95, 1], 0, 0.3); }
    draw(SPH, X(T(0, -0.04, 0), S(ISR + 3, 0.02, ISR + 3)), [0.93, 0.85, 0.6]);
    draw(SPH, X(T(0, 0, 0), S(ISR, 0.02, ISR)), [0.36, 0.78, 0.36], 1);
    // plaza
    draw(SPH, X(T(0, -0.15, 0), S(13, 0.2, 13)), [0.88, 0.82, 0.68]);
    draw(TOR, X(T(0, 0.02, 0), RX(Math.PI / 2), S(12, 12, 1)), [0.75, 0.68, 0.52]);
    // boxes
    boxes.forEach(function (b) {
      if (b.gone || b.kind === "floor") return;
      var cx0 = (b.x0 + b.x1) / 2, cz0 = (b.z0 + b.z1) / 2, cy0 = (b.y0 + b.y1) / 2;
      var col = b.col;
      if (b.kind === "crack") col = shade(b.col, 0.9 + Math.sin(tick * 0.1) * 0.05);
      draw(CUBE, X(T(cx0, cy0, cz0), S(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0)), col, b.kind === "mesa" || b.kind === "rock" || b.kind === "pillar" ? 1 : 0);
      if (b.kind === "crack") for (var k2 = 0; k2 < 3; k2++) draw(CUBE, X(T(cx0 - 0.4 + k2 * 0.4, b.y1 + 0.01, cz0), RY(k2 * 0.9), S(0.08, 0.04, 1.6)), [0.3, 0.25, 0.2]);
      if (b.kind === "islet") draw(SPH, X(T(cx0, 0.4, cz0), S(5, 0.6, 5)), [0.93, 0.85, 0.6]);
    });
    // obelisk slots and the vault warp
    var mc = medalCount();
    for (var i = 0; i < 12; i++) { var side = i % 4, row = Math.floor(i / 4), sx = [0, 0, -1.22, 1.22][side], sz = [-1.22, 1.22, 0, 0][side];
      draw(SPH, X(T(sx, 1.2 + row * 1.3, sz), S(0.28)), medals & (1 << i) ? C_GOLD : [0.3, 0.28, 0.25], 0, medals & (1 << i) ? 0.6 : 0); }
    draw(CONE, X(T(0, 5, 0), S(1.3, 1.6, 1.3)), mc === 12 ? [1, 0.6, 0.9] : [0.85, 0.8, 0.68], 0, mc === 12 ? 0.5 + Math.sin(tick * 0.1) * 0.3 : 0);
    if (mc === 12) { for (i = 0; i < 3; i++) draw(TOR, X(T(0, 0.3 + i * 0.6 + Math.sin(tick * 0.06 + i) * 0.2, -3.2), RX(Math.PI / 2), RZ(tick * 0.05 * (i & 1 ? -1 : 1)), S(1.3 - i * 0.25)), [1, 0.5, 0.9], 0, 0.9); }
    // runner pads and statues
    PADS.forEach(function (q) {
      var on = q.i === ch;
      draw(CUBE, X(T(q.x, 0.05, q.z), RY(q.a), S(1.9, 0.12, 1.9)), on ? [1, 0.85, 0.3] : [0.55, 0.5, 0.42], 0, on ? 0.4 : 0);
      var sx2 = q.x - Math.sin(q.a) * 1.6, sz2 = q.z - Math.cos(q.a) * 1.6;
      drawChar(q.i, sx2, 1.1, sz2, q.a + (on ? Math.sin(tick * 0.04) * 0.4 : 0), { run: 0, sc: 0.8, gold: goldOn && omegaDone });
    });
    // portals
    PORT.forEach(function (o) {
      var c = GCOL[o.i], B0 = X(T(o.x, 3.1, o.z), RY(o.h));
      draw(TOR, X(B0, S(2.8, 2.8, 3)), c, 0, 0.35);
      draw(TOR, X(B0, RZ(tick * 0.02), S(2.2, 2.2, 1.6)), shade(c, 1.2), 0, 0.55);
      for (var k3 = 0; k3 < 6; k3++) { var aa = tick * 0.04 + k3 * 1.047; draw(SPH, X(B0, T(Math.cos(aa) * 1.5, Math.sin(aa) * 1.5, 0), S(0.18)), [1, 1, 1], 0, 0.9); }
      draw(SPH, X(B0, S(2.2, 2.2, 0.08)), shade(c, 0.6), 0, 0.6 + Math.sin(tick * 0.08) * 0.2);
      draw(CUBE, X(T(o.x, 0.1, o.z), RY(o.h), S(7, 0.2, 2.4)), [0.6, 0.55, 0.48]);
      // number blocks
      for (var nb = 0; nb <= o.i; nb++) draw(CUBE, X(B0, T((nb - o.i / 2) * 0.7, 3.6, 0), S(0.5, 0.5, 0.5)), [1, 0.85, 0.25], 0, 0.4);
      // trophy
      var tl = trophy[o.i] || 0;
      if (tl) { var tc = tl === 2 ? C_GOLD : [0.82, 0.85, 0.9]; draw(CONE, X(T(o.tx, 1.4, o.tz), S(0.35, 0.5, 0.35)), tc, 0, 0.4); draw(SPH, X(T(o.tx, 2.1, o.tz), S(0.45, 0.45, 0.45)), tc, 0, 0.5); draw(TOR, X(T(o.tx, 2.2, o.tz), RY(tick * 0.03), S(0.4)), tc, 0, 0.4); }
    });
    // lighthouse top, springs, pads
    draw(CONE, X(T(LH.x, 11, LH.z), S(2.4, 2.2, 2.4)), C_RED);
    draw(SPH, X(T(LH.x, 12.6, LH.z), S(0.5)), [1, 1, 0.7], 0, 1);
    [SPRING, ISPRING].forEach(function (s) { draw(CUBE, X(T(s.x, s.y + 0.15 + (s.t ? 0.25 : 0), s.z), S(1, 0.3, 1)), [1, 0.25, 0.25], 0, 0.3); draw(CUBE, X(T(s.x, s.y + 0.05, s.z), S(0.8, 0.12, 0.8)), [0.7, 0.7, 0.75]); });
    draw(CUBE, X(T(SPAD.x, 0.06, SPAD.z), S(2.6, 0.12, 2.6)), [1, 0.6, 0.1], 0, 0.4 + ((tick >> 3) & 1) * 0.3);
    for (i = 0; i < 3; i++) draw(CONE, X(T(SPAD.x, 0.15, SPAD.z), RY(Math.atan2(LEDGE.x - SPAD.x, LEDGE.z - SPAD.z)), RX(Math.PI / 2), T(0, -0.6 + i * 0.6, 0), S(0.4, 0.5, 0.1)), [1, 1, 0.8], 0, 0.6);
    // sky trail
    for (i = 0; i < 3; i++) { var u = (i + 1) / 4; draw(TOR, X(T(LH.x + (22 - LH.x) * u, 22 + i * 2.5, LH.z + (22 - LH.z) * u), RY(Math.atan2(22 - LH.x, 22 - LH.z)), S(1.3)), [1, 0.85, 0.3], 0, 0.5); }
    // waterfall
    for (i = 0; i < 18; i++) { var wy = 10 - ((tick * 0.15 + i * 0.62) % 10.5); draw(CUBE, X(T(-45.8, wy, 23.6 + (i % 6) * 0.55), S(0.25, 1.2, 0.5)), [0.75, 0.9, 1], 0, 0.5); }
    draw(CUBE, X(T(-45.6, 5, 25), S(0.15, 10, 3)), [0.55, 0.78, 1], 0, 0.25);
    // flowers
    flowers.forEach(function (f) { draw(CUBE, X(T(f.x, f.y - 1.2, f.z), S(0.12, 2.4, 0.12)), [0.2, 0.6, 0.25]); for (var k4 = 0; k4 < 5; k4++) draw(SPH, X(T(f.x, f.y, f.z), RY(k4 * 1.26 + tick * 0.02), T(0, 0, 0.45), S(0.3, 0.12, 0.4)), [1, 0.4, 0.7], 0, 0.3); draw(SPH, X(T(f.x, f.y, f.z), S(0.25)), [1, 0.9, 0.3], 0, 0.5); });
    palms.forEach(drawPalm);
    signs.forEach(function (s) { draw(CUBE, X(T(s.x, 0.6, s.z), S(0.15, 1.2, 0.15)), [0.5, 0.35, 0.2]); draw(CUBE, X(T(s.x, 1.35, s.z), RY(Math.atan2(-s.x, -s.z)), S(1.2, 0.7, 0.12)), [0.8, 0.62, 0.38]); });
    // race pad and gates
    var rOpen = medalCount() >= 4;
    draw(CUBE, X(T(RPAD.x, 0.05, RPAD.z), S(2.6, 0.1, 2.6)), rOpen ? [0.3, 0.8, 1] : [0.4, 0.4, 0.45], 0, rOpen ? 0.4 : 0);
    if (rOpen) gates.forEach(function (g, gi) {
      var lit = race && race.g === gi, done = race && race.g > gi;
      if (done) return;
      draw(TOR, X(T(g.x, 2.2, g.z), RY(g.a + Math.PI / 2), S(2.4)), lit ? [1, 0.9, 0.2] : [0.3, 0.8, 1], 0, lit ? 0.7 : 0.25);
    });
    // medals
    medalO.forEach(function (m) { if (m.hid || medals & (1 << m.i)) return; drawMedal(m.x, m.y + Math.sin(tick * 0.06 + m.i) * 0.15, m.z, tick * 0.05 + m.i); });
    // fireworks for a full trophy shelf
    if (trophyCount() === 4 && tick % 40 === 0) burst((Math.random() - 0.5) * 60, 22 + Math.random() * 10, (Math.random() - 0.5) * 60, [Math.random(), Math.random() * 0.5 + 0.5, 1], 26);
  }
  function drawBoss() {
    gl.uniform3fv(U.uFog, [0.1, 0.04, 0.16]); gl.uniform1f(U.uFN, 40); gl.uniform1f(U.uFF, 120);
    gl.uniform3fv(U.uG1, [0.32, 0.3, 0.38]); gl.uniform3fv(U.uG2, [0.26, 0.24, 0.32]);
    draw(SPH, X(T(0, -1, 0), S(16, 1, 16)), [0.3, 0.28, 0.36], 1);
    draw(TOR, X(T(0, 0.02, 0), RX(Math.PI / 2), S(15.5, 15.5, 1.5)), [1, 0.4, 0.2], 0, 0.5);
    for (var i = 0; i < 40; i++) { var a = i * 2.4; draw(SPH, X(T(Math.cos(a) * (40 + i % 5 * 6), 5 + Math.sin(i * 1.3) * 18, Math.sin(a) * (40 + i % 5 * 6)), S(0.3)), [1, 1, 1], 0, 1); }
    var B = OM; if (!B) return;
    if (B.dead > 150) return;
    var hit = B.inv && (tick >> 1) & 1, body = hit ? [1, 1, 1] : [0.55, 0.58, 0.65], E = hit ? 0.8 : 0;
    var M0 = X(T(B.x, B.y, B.z), RY(Math.atan2(p.x - B.x, p.z - B.z)));
    draw(SPH, X(M0, T(0, 1, 0), S(2, 1.6, 2)), body, 0, E);
    draw(TOR, X(M0, T(0, 1, 0), RX(Math.PI / 2), RZ(tick * 0.05), S(2.4, 2.4, 2)), [0.85, 0.65, 0.2], 0, E + 0.2);
    for (i = 0; i < 8; i++) { var ga = tick * 0.05 + i * 0.785; draw(CUBE, X(M0, T(Math.cos(ga) * 2.6, 1, Math.sin(ga) * 2.6), RY(-ga), S(0.4, 0.5, 0.4)), [0.85, 0.65, 0.2], 0, E); }
    draw(SPH, X(M0, T(0, 1.4, 1.6), S(0.6)), B.ph === "down" ? [1, 0.2, 0.2] : [0.3, 0.9, 1], 0, B.ph === "down" ? 0.6 + Math.sin(tick * 0.3) * 0.4 : 0.6);
    [-1, 1].forEach(function (s) { draw(CONE, X(M0, T(s * 1.2, 2.5, 0), RZ(-s * 0.5), S(0.35, 1, 0.35)), [0.9, 0.2, 0.2], 0, E); });
    if (B.ph === "hover" || B.ph === "aim" || B.ph === "rise") for (i = 0; i < 3; i++) draw(CONE, X(M0, T((i - 1) * 0.8, -0.2, 0), RX(Math.PI), S(0.25, 0.6 + Math.random() * 0.5, 0.25)), [1, 0.6, 0.1], 0, 1);
    if (B.ph === "aim") draw(TOR, X(T(B.x, 0.05, B.z), RX(Math.PI / 2), S(2.2, 2.2, 0.5)), [1, 0.2, 0.2], 0, 0.8);
    if (B.wave) draw(TOR, X(T(B.wave.x, 0.2, B.wave.z), RX(Math.PI / 2), S(B.wave.r, B.wave.r, B.wave.d > 0 ? 0.4 : 1.2)), B.wave.d > 0 && (tick >> 1) & 1 ? [1, 1, 1] : [1, 0.5, 0.2], 0, 0.8);
    B.bombs.forEach(function (b) { draw(SPH, X(T(b.x, b.y, b.z), S(0.5)), (b.t >> 3) & 1 ? [1, 0.2, 0.2] : [0.15, 0.15, 0.2], 0, 0.3); draw(TOR, X(T(b.x, 0.05, b.z), RX(Math.PI / 2), S(2.3 * (1 - b.t / 60) + 0.2, 2.3 * (1 - b.t / 60) + 0.2, 0.4)), [1, 0.2, 0.2], 0, 0.6); });
  }
  function drawRunner() {
    if (p.inv > 0 && (tick >> 2) & 1) return;
    var ball = (p.jumping || p.roll || p.dash > 0 || p.zip || p.launch) && !p.glide && !p.boosting && !p.pound && !(ch === 1 && p.dive);
    drawChar(ch, p.x, p.y, p.z, p.h, { tongue: ch === 4 ? p.tongue : 0, run: p.anim, ball: ball, spin: p.spin, glide: p.glide, boost: p.boosting, gold: goldOn && omegaDone });
    if (p.zip) draw(CUBE, X(T((p.x + p.zip.x) / 2, (p.y + 1.2 + p.zip.y) / 2, (p.z + p.zip.z) / 2), RY(Math.atan2(p.zip.x - p.x, p.zip.z - p.z)), RX(-Math.atan2(p.zip.y - p.y - 1.2, Math.hypot(p.zip.x - p.x, p.zip.z - p.z))), S(0.08, 0.08, Math.hypot(p.zip.x - p.x, p.zip.y - p.y - 1.2, p.zip.z - p.z))), [1, 0.35, 0.5], 0, 0.3);
    if (p.qT > 0) { var rr = 0.6 + (16 - p.qT) * 0.12; for (var i = 0; i < 12; i++) { var a = i / 12 * 6.28; draw(CONE, X(T(p.x + Math.sin(a) * rr, p.y + 0.8, p.z + Math.cos(a) * rr), RY(a), RX(Math.PI / 2), S(0.08, 0.5, 0.08)), [0.95, 0.92, 0.8]); } }
    // shadow
    var fl = floorAt(p.x, p.z, p.y + 0.1); if (fl > -1e8 && p.y - fl < 20) draw(SPH, X(T(p.x, fl + 0.03, p.z), S(0.6, 0.02, 0.6)), [0.05, 0.05, 0.05]);
  }
  function render() {
    if (W !== innerWidth || H !== innerHeight) fit();
    gl.viewport(0, 0, W, H);
    var sky = scene === "boss" ? [0.1, 0.04, 0.16] : nightOn ? [0.03, 0.04, 0.12] : [0.55, 0.8, 1];
    gl.clearColor(sky[0], sky[1], sky[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    var eye, tgt, sx = shake ? (Math.random() - 0.5) * shake * 0.04 : 0;
    if (state === "title") { var a = titleT * 0.004; eye = [Math.sin(a) * 75, 34, Math.cos(a) * 75]; tgt = [0, 2, 0]; }
    else { eye = [cam.x + sx, cam.y + sx, cam.z]; tgt = [p.x, cam.ty + 1.4, p.z]; }
    VPM = mul(persp(1.05, W / H, 0.1, 600), lookAt(eye, tgt, [0, 1, 0]));
    gl.uniformMatrix4fv(U.uVP, false, new Float32Array(VPM)); gl.uniform3fv(U.uCam, eye);
    if (scene === "boss") drawBoss(); else drawIsland();
    if (state !== "title") drawRunner();
    parts.forEach(function (q) { draw(SPH, X(T(q.x, q.y, q.z), S(q.s)), q.col, 0, 1); });
    drawUI();
  }

  // ---------------------------------------------------------------- UI
  // txt that shrinks its font to fit maxW (narrow windows)
  function txtF(s, x, y, size, col, align, maxW) {
    cx.font = "bold " + size + "px monospace"; var w = cx.measureText(s).width;
    if (maxW > 0 && w > maxW) size = Math.max(4, Math.floor(size * maxW / w * 4) / 4);
    txt(s, x, y, size, col, align);
  }
  function txt(s, x, y, size, col, align) {
    cx.font = "bold " + size + "px monospace"; cx.textAlign = align || "left";
    cx.fillStyle = "rgba(0,0,0,0.75)"; cx.fillText(s, x + 1, y + 1); cx.fillStyle = col; cx.fillText(s, x, y);
  }
  function panel(x, y, w, h, a) { cx.fillStyle = "rgba(10,8,36," + (a || 0.72) + ")"; cx.beginPath(); cx.moveTo(x + 8, y); cx.lineTo(x + w, y); cx.lineTo(x + w - 8, y + h); cx.lineTo(x, y + h); cx.closePath(); cx.fill(); }
  function medalIcon(x, y, r, on) { cx.fillStyle = on ? "#ffd23f" : "rgba(255,255,255,0.2)"; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); if (on) { cx.fillStyle = "#fff6c0"; cx.beginPath(); cx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); cx.fill(); } }
  function drawUI() {
    drawUI0();
    var hmx = VW / 2;
    if (gameOpen >= 0) return;
    if (state === "title") txt("H: HARD MODE " + (HARD ? "ON" : "OFF"), VW - 6, 12, 9, HARD ? "#ff5050" : "#c8d0e0", "right");
    else if (paused) txt("H: HARD MODE " + (HARD ? "ON" : "OFF"), hmx, 142, 9, HARD ? "#ff5050" : "#c8d0e0", "center");
    if (HARD && state !== "title") { cx.fillStyle = "#c81e1e"; cx.fillRect(VW - 40, 32, 34, 13); txt("HARD", VW - 23, 42, 9, "#ffffff", "center"); }
  }
  function drawUI0() {
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, W, H); cx.setTransform(k, 0, 0, k, 0, 0);
    var mx = VW / 2, blink = (tick >> 5) & 1;
    if (state === "title") {
      cx.fillStyle = "rgba(0,0,40,0.35)"; cx.fillRect(0, 0, VW, 240);
      var bob = Math.sin(titleT * 0.05) * 2;
      txt("PANGOLIN RUSH", mx, 58 + bob, 30, "#ffd23f", "center");
      txt("C O L L E C T I O N", mx, 80 + bob, 14, "#ffffff", "center");
      for (var i = 0; i < 4; i++) { var bx = mx - 66 + i * 44; cx.fillStyle = GCSS[i]; cx.fillRect(bx - 16, 92, 32, 22); txt(String(i + 1), bx, 109, 16, "#ffffff", "center"); txt(i % 2 ? "3D" : "2D", bx, 124, 7, "#d8e8ff", "center"); }
      txt("4 GAMES  \u2022  7 RUNNERS  \u2022  1 ISLAND FULL OF SECRETS", mx, 146, 8, "#ffffff", "center");
      if (blink) txt("PRESS ENTER", mx, 178, 14, "#ffd23f", "center");
      txtF("Arrows steer  \u2022  Space jump  \u2022  X ability  \u2022  Shift roll  \u2022  Enter play a portal", mx, 204, 7, "#d8e8ff", "center", VW - 12);
      txtF("Inside a game, BACKSPACE returns to the island.  Click the game first if keys don't work.", mx, 218, 7, "#d8e8ff", "center", VW - 12);
      if (cheatMsg) txt("ALL 12 MEDALS!", mx, 232, 9, "#ff9ae0", "center");
      return;
    }
    // portal labels
    if (scene === "island") {
      PORT.forEach(function (o) {
        var s = project(o.x, 6.6, o.z); if (!s || s.d > 70) return;
        var sz = Math.max(6, Math.min(11, 260 / s.d));
        txt(GNAME[o.i], s.x, s.y, sz, GCSS[o.i], "center"); txt(GSTYLE[o.i] + (trophy[o.i] === 2 ? "  \u2605 PERFECT" : trophy[o.i] ? "  \u2605 CLEARED" : ""), s.x, s.y + sz, Math.max(5, sz * 0.65), "#ffffff", "center");
      });
      PADS.forEach(function (q) { var s = project(q.x, 2.6, q.z); if (!s || s.d > 22) return; txt(CH[q.i].n, s.x, s.y, 7, q.i === ch ? "#ffd23f" : "#ffffff", "center"); });
    }
    // HUD
    panel(6, 6, 150, 40);
    txt(CH[ch].n + (goldOn && omegaDone ? "  GOLD" : ""), 14, 20, 10, "#ffd23f");
    if (scene === "island") {
      txt("MEDALS " + medalCount() + "/12", 14, 34, 9, "#ffffff");
      for (i = 0; i < 12; i++) medalIcon(96 + (i % 6) * 9, 28 + Math.floor(i / 6) * 9, 3.2, medals & (1 << i));
      panel(VW - 112, 6, 106, 22);
      for (i = 0; i < 4; i++) { var tl = trophy[i] || 0; txt(tl === 2 ? "\u2605" : tl ? "\u2606" : "\u00b7", VW - 96 + i * 22, 22, 12, tl ? (tl === 2 ? "#ffd23f" : "#e0e6f0") : "#667", "center"); txt(String(i + 1), VW - 88 + i * 22, 24, 6, GCSS[i], "center"); }
    } else {
      for (i = 0; i < 3; i++) { cx.fillStyle = i < hearts ? "#ff4a7a" : "rgba(255,255,255,0.2)"; cx.beginPath(); var hx = 18 + i * 14, hy = 34; cx.moveTo(hx, hy + 4); cx.bezierCurveTo(hx - 7, hy - 2, hx - 3, hy - 7, hx, hy - 3); cx.bezierCurveTo(hx + 3, hy - 7, hx + 7, hy - 2, hx, hy + 4); cx.fill(); }
      if (OM) { panel(mx - 100, 6, 200, 22); txt("GEARBOLT OMEGA", mx - 90, 16, 7, "#ff8080"); cx.fillStyle = "rgba(255,255,255,0.15)"; cx.fillRect(mx - 90, 19, 180, 5); cx.fillStyle = "#ff5050"; cx.fillRect(mx - 90, 19, 180 * Math.max(0, OM.hp) / 8, 5); if (OM.ph === "down" && !OM.dead && blink) txt("HIT THE CORE!", mx, 44, 10, "#ffd23f", "center"); }
    }
    if (ch === 5 || ch === 6) {
      var hx2 = VW - 88, hy2 = 222;
      txt(p.lock ? "OVERHEAT" : "HEAT", hx2, hy2 - 4, 8, p.lock && blink ? "#ff3030" : "#ffffff");
      cx.fillStyle = "rgba(0,0,0,0.6)"; cx.fillRect(hx2, hy2, 80, 7);
      cx.fillStyle = p.lock ? (blink ? "#ff2020" : "#801010") : p.heat > 0.7 ? "#ff8a20" : "#40d0ff"; cx.fillRect(hx2 + 1, hy2 + 1, 78 * p.heat, 5);
    }
    // medal radar
    if (scene === "island" && medalCount() >= 8 && medalCount() < 12) {
      var bestM = null, bdm = 1e9; medalO.forEach(function (m) { if (medals & (1 << m.i)) return; var d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bdm) { bdm = d; bestM = m; } });
      if (bestM) { var ra = angDiff(Math.atan2(bestM.x - p.x, bestM.z - p.z), cam.yaw); cx.save(); cx.translate(mx, 30); cx.rotate(-ra); cx.fillStyle = "#ffd23f"; cx.beginPath(); cx.moveTo(0, -9); cx.lineTo(6, 5); cx.lineTo(0, 2); cx.lineTo(-6, 5); cx.closePath(); cx.fill(); cx.restore(); txt(Math.round(bdm) + "m", mx, 48, 7, "#ffd23f", "center"); }
    }
    // race
    if (race) {
      panel(mx - 60, 196, 120, 26);
      if (race.t < 0) txt(String(Math.ceil(-race.t / 60)), mx, 216, 18, "#ffd23f", "center");
      else { txt((race.t / 60).toFixed(2) + "s", mx - 50, 214, 12, "#ffffff"); txt("RING " + (race.g + 1) + "/10", mx + 52, 214, 8, "#9ee0ff", "right"); }
    }
    // prompts
    if (near && state === "play") {
      if (near.k === "portal") { panel(mx - 110, 172, 220, 36); txt(GNAME[near.i], mx, 186, 11, GCSS[near.i], "center"); txt("ENTER  play as " + CH[ch].n + "   (" + GSTYLE[near.i] + ")", mx, 200, 8, blink ? "#ffd23f" : "#ffffff", "center"); }
      else if (near.k === "vault") { panel(mx - 110, 172, 220, 36); txt("THE VAULT IS OPEN", mx, 186, 11, "#ff9ae0", "center"); txt("ENTER  face what's inside", mx, 200, 8, blink ? "#ffd23f" : "#ffffff", "center"); }
      else if (near.k === "sign") { panel(mx - 120, 160, 240, 46); near.s.t.forEach(function (l, j) { txt(l, mx, 175 + j * 12, j ? 8 : 10, j ? "#ffffff" : "#ffd23f", "center"); }); }
    }
    if (scene === "island" && Math.hypot(p.x - RPAD.x, p.z - RPAD.z) < 3 && !race) {
      txt(medalCount() >= 4 ? "RING RACE  \u2022  GOLD " + GOLD_T + "s  \u2022  BEST " + (raceBest ? raceBest.toFixed(2) + "s" : "--") : "RING RACE: NEEDS 4 MEDALS", mx, 232, 8, "#9ee0ff", "center");
    }
    // popups
    popups.forEach(function (u, j) { var a = Math.min(1, u.t / 20); cx.globalAlpha = a; txt(u.s, mx, 80 + j * 16 - (90 - u.t) * 0.15, 12, u.col, "center"); cx.globalAlpha = 1; });
    if (newTrophy) { panel(mx - 110, 54, 220, 24); txt((trophy[newTrophyG] === 2 ? "PERFECT TROPHY: " : "TROPHY: ") + GNAME[newTrophyG], mx, 70, 9, "#ffd23f", "center"); }
    if (flash) { cx.fillStyle = "rgba(255,240,180," + flash * 0.03 + ")"; cx.fillRect(0, 0, VW, 240); }
    if (scene === "island" && !near && !race && tick < 600 && state === "play") txt("Step on a pad to switch runner (or 1-7)  \u2022  Q/E look around  \u2022  P pause", mx, 232, 7, "#ffffff", "center");
    if (paused) { panel(mx - 80, 100, 160, 30); txt("PAUSED", mx, 120, 14, "#ffd23f", "center"); }
    if (state === "omegawin") {
      cx.fillStyle = "rgba(0,0,30,0.65)"; cx.fillRect(0, 0, VW, 240);
      txt("COLLECTION COMPLETE!", mx, 70, 20, "#ffd23f", "center");
      ["Gearbolt Omega is scrap metal.", "Rush Island is safe, and every runner is a legend.", "", "GOLDEN RUNNERS UNLOCKED  (press G on the island)", trophyCount() < 4 ? "Clear all 4 games for one more surprise." : "All 4 trophies too. Press N on the island for night mode!"].forEach(function (l, j) { txt(l, mx, 100 + j * 14, 9, j === 3 ? "#ffd23f" : "#ffffff", "center"); });
      if (endT > 60 && blink) txt("PRESS ENTER", mx, 200, 12, "#9ee0ff", "center");
    }
    if (state === "bosslose") {
      cx.fillStyle = "rgba(30,0,0,0.6)"; cx.fillRect(0, 0, VW, 240);
      txt("KNOCKED OUT!", mx, 100, 20, "#ff6060", "center"); txt("The vault stays open. Try again anytime.", mx, 124, 9, "#ffffff", "center");
      if (endT > 60 && blink) txt("PRESS ENTER", mx, 160, 12, "#9ee0ff", "center");
    }
    if (trophyCount() === 4 && scene === "island" && state === "play" && tick % 1200 < 200) txt("ALL 4 GAMES CLEARED!  N: NIGHT MODE", mx, 60, 8, "#ffd23f", "center");
  }

  // ---------------------------------------------------------------- loop
  function loop(now) {
    if (gameOpen < 0) {
      if (!last) last = now;
      acc2 += Math.min(100, now - last); last = now;
      while (acc2 >= STEP) { update(); pressed = {}; acc2 -= STEP; }
      render();
    } else last = 0;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
