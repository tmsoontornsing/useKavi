// Draws Kavi, the mason jar mascot, and writes it out twice:
//   assets/mascot/<pose>.svg                      light-mode files for design tools and docs
//   src/components/mascotPoses.generated.ts       SVG strings with color tokens, rendered by <Mascot>
// Edit the drawing here, then run: node scripts/build-mascot.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Color tokens. <Mascot> swaps these for the light or dark palette at render time.
const INK = '__INK__'; // outlines and the face
const G = '__G__'; // jar contents and the K
const TINT = '__TINT__'; // lid band, drips, caps
const GLASS = '__GLASS__'; // jar glass
const W = '#fff'; // paper-white fills: label, hands, lid top, cards (becomes __W__ below)

const LIGHT = { INK: '#13241A', G: '#3DAA84', TINT: '#CFE8DA', GLASS: '#E8F3EC', W: '#FFFFFF' };

const JAR = 'M74 52 H126 V64 Q126 70 134 76 Q146 84 146 98 V142 Q146 160 128 160 H72 Q54 160 54 142 V98 Q54 84 66 76 Q74 70 74 64 Z';

const S = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const P = (d, w = 3.5, fill = 'none') => `<path d="${d}" fill="${fill}" ${S(w)}/>`;
const C = (x, y, r, fill = W, w = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${S(w)}/>`;
const legs = () => P('M84 156 V184 h-9', 4) + P('M116 156 V184 h9', 4);

// The glass is drawn a few pixels off its outline, like a misregistered print. `t` is the contents' top edge:
// lower numbers mean a fuller jar, so it can double as a budget gauge.
const jar = (dy = 0, t = 118) =>
  `<g transform="translate(0 ${dy})">` +
  `<path d="${JAR}" transform="translate(3 3)" fill="${GLASS}"/>` +
  `<path d="M57 ${t} Q78 ${t - 6} 100 ${t} T143 ${t} V142 Q143 157 128 157 H72 Q57 157 57 142 Z" transform="translate(3 3)" fill="${G}"/>` +
  `<path d="${JAR}" fill="none" ${S(3.5)}/>` +
  `<path d="M63 94 v12" stroke="${W}" stroke-width="4" stroke-linecap="round"/>` +
  `<rect x="76" y="126" width="48" height="26" rx="3" fill="${W}" ${S(3)}/>` +
  `<path d="M93 131 v16 M93 139 l13 -8 M93 139 l13 8" fill="none" stroke="${G}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
  `</g>`;

const lid = (tx = 0, ty = 0, rot = 0) =>
  `<g transform="translate(${tx} ${ty}) rotate(${rot} 100 46)">` +
  `<rect x="68" y="40" width="64" height="16" rx="3" fill="${TINT}" ${S(3.5)}/>` +
  P('M78 45 v6 M88 45 v6 M98 45 v6 M108 45 v6 M118 45 v6', 2) +
  `<rect x="72" y="32" width="56" height="10" rx="3" fill="${W}" ${S(3.5)}/></g>`;

const dots = (dx = 0, dy = 0, ry = 6.5) =>
  `<ellipse cx="${82 + dx}" cy="${92 + dy}" rx="5" ry="${ry}" fill="${INK}"/>` +
  `<ellipse cx="${118 + dx}" cy="${92 + dy}" rx="5" ry="${ry}" fill="${INK}"/>`;
const smile = P('M90 104 Q100 114 110 104', 3.5);

const poses = {
  wave: {
    label: 'Wave',
    use: 'Welcome and sign-in',
    art:
      legs() + P('M56 112 Q38 128 40 150', 4) + P('M144 112 Q168 104 168 74', 4) + jar() + lid() + dots() +
      P('M88 102 Q100 122 112 102 Z', 2.5, INK) + C(40, 152, 6) + C(168, 68, 6) +
      P('M180 62 q6 6 0 14', 3) + P('M187 57 q9 11 0 24', 3),
  },
  think: {
    label: 'Thinking',
    use: 'Diet, household and kitchen questions',
    art:
      legs() + P('M56 112 Q38 128 40 150', 4) + jar() + lid() + P('M144 126 Q128 150 112 120', 4) + dots(4, -3) +
      P('M72 80 l16 -2', 3.5) + P('M112 74 q10 -8 18 -2', 3.5) + P('M88 108 q5 -4 10 0', 3.5) +
      C(40, 152, 6) + C(111, 118, 6) + C(148, 54, 3) + C(160, 42, 5) + C(174, 26, 12) +
      P('M170 23 q0 -6 5 -6 q5 0 5 5 q0 3 -5 5 v2', 2.5) + `<circle cx="175" cy="32.5" r="1.7" fill="${INK}"/>`,
  },
  cook: {
    label: 'Cooking',
    use: 'Building your week, recipe steps',
    art:
      legs() + P('M56 112 Q36 104 36 84', 4) + P('M144 114 Q154 130 152 142', 4) + jar() + lid() + dots() +
      P('M72 80 l16 4', 3.5) + P('M112 84 l16 -4', 3.5) + smile +
      C(86, 24, 9) + C(100, 19, 10) + C(114, 24, 9) +
      `<circle cx="86" cy="24" r="7.5" fill="${W}"/><circle cx="100" cy="19" r="8.5" fill="${W}"/><circle cx="114" cy="24" r="7.5" fill="${W}"/>` +
      `<rect x="80" y="30" width="40" height="9" rx="3" fill="${W}" ${S(3)}/>` +
      P('M36 78 L30 54', 3) + `<ellipse cx="29" cy="46" rx="6" ry="9" transform="rotate(-10 29 46)" fill="${W}" ${S(3)}/>` + C(36, 80, 6) +
      C(172, 133, 4.5, G, 2.5) + C(184, 132, 4, TINT, 2.5) +
      `<path d="M164 136 H194 V142 a10 10 0 0 1 -10 10 H174 a10 10 0 0 1 -10 -10 Z" fill="${W}" ${S(3)}/>` +
      P('M152 142 H164', 4) + C(152, 142, 6) +
      P('M171 124 q-4 -5 0 -10 q4 -5 0 -10', 2.5) + P('M184 122 q-4 -5 0 -10 q4 -5 0 -10', 2.5),
  },
  shop: {
    label: 'Shopping',
    use: 'Grocery list, items in the cart',
    art:
      legs() + P('M56 112 Q40 124 40 136', 4) + P('M144 114 Q164 118 170 134', 4) + jar() + lid() + dots() + smile +
      `<g transform="rotate(-6 39 158)"><rect x="28" y="144" width="22" height="28" rx="2" fill="${W}" ${S(3)}/>` +
      P('M33 152 h12 M33 159 h12 M33 166 h7', 2) + '</g>' + C(40, 138, 6) +
      '<g transform="translate(8 0)">' + P('M146 150 Q162 118 178 150', 3.5) +
      `<path d="M154 150 q-7 -16 1 -23 q9 8 -1 23z" fill="${G}" ${S(2.5)}/>` +
      `<path d="M168 150 q8 -16 19 -15 q-1 12 -19 15z" fill="${G}" ${S(2.5)}/>` +
      `<path d="M142 150 h40 l-5 24 h-30 Z" fill="${W}" ${S(3)}/>` + P('M146 160 h32 M148 168 h28', 2) + '</g>' + C(170, 134, 6),
  },
  cheer: {
    label: 'Cheering',
    use: 'Under budget, plan saved',
    art:
      P('M84 156 L76 182 h-9', 4) + P('M116 156 L124 182 h9', 4) + P('M56 108 Q32 94 28 66', 4) + P('M144 108 Q168 94 172 66', 4) +
      jar(0, 112) + lid(8, -16, 14) + P('M74 94 q8 -10 16 0', 3.5) + P('M110 94 q8 -10 16 0', 3.5) +
      P('M86 102 Q100 128 114 102 Z', 2.5, INK) + C(28, 62, 6) + C(172, 62, 6) +
      C(98, 30, 3.5, G, 2.5) + C(86, 22, 3, TINT, 2) + P('M46 40 l5 -7', 3) + P('M150 36 l-5 -7', 3) +
      C(60, 20, 3, G, 2) + C(142, 14, 3, TINT, 2) +
      `<rect x="44" y="54" width="7" height="7" fill="${G}" transform="rotate(20 47 57)"/>` +
      `<rect x="150" y="52" width="7" height="7" fill="${G}" transform="rotate(-20 153 55)"/>`,
  },
  oops: {
    label: 'Oops',
    use: 'Errors, offline, over budget',
    art:
      legs() + P('M56 114 Q34 122 26 110', 4) + P('M144 114 Q166 122 174 110', 4) + jar(0, 138) + lid(-34, 30, -38) +
      C(96, 36, 3.5, G, 2.5) + C(108, 26, 3.5, G, 2.5) + C(104, 42, 3, G, 2) + dots(0, 0, 6) +
      P('M70 82 l16 -7', 3.5) + P('M114 75 l16 7', 3.5) + P('M88 108 q4 -6 8 0 t8 0 t8 0', 3.5) +
      C(24, 107, 6) + C(176, 107, 6) + `<path d="M160 62 q-7 11 0 16 q7 -5 0 -16z" fill="${TINT}" ${S(2.5)}/>`,
  },
  sleep: {
    label: 'Napping',
    use: 'Nothing planned yet',
    art:
      legs() + P('M56 118 Q44 140 48 156', 4) + P('M144 118 Q156 140 152 156', 4) + jar() + lid() +
      P('M74 92 q8 8 16 0', 3.5) + P('M110 92 q8 8 16 0', 3.5) + `<ellipse cx="100" cy="108" rx="3.5" ry="4.5" fill="${INK}"/>` +
      C(48, 158, 6) + C(152, 158, 6) + `<path d="M70 34 Q82 6 128 14 Q120 26 126 34 Z" fill="${TINT}" ${S(3)}/>` + C(130, 14, 6) +
      P('M150 74 h12 l-12 14 h12', 3) + P('M164 46 h16 l-16 18 h16', 3),
  },
  peek: {
    label: 'Peeking',
    use: 'Empty lists and pantry',
    art:
      jar(36) + lid(0, 36, 0) + `<g transform="translate(0 36)">${dots(5, 0, 6.5)}${P('M92 104 q8 5 16 0', 3.5)}</g>` +
      `<rect x="22" y="152" width="156" height="46" rx="3" fill="${W}" ${S(3.5)}/>` + P('M40 170 h56 M40 182 h36', 2.5) +
      C(64, 150, 6) + C(136, 150, 6),
  },
};

const wrap = (art) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${art}</svg>`.replaceAll('#fff', '__W__');
const tokens = (svg) => svg.replace(/__([A-Z]+)__/g, (_, k) => LIGHT[k]);

mkdirSync(join(root, 'assets/mascot'), { recursive: true });
for (const [name, { art }] of Object.entries(poses)) {
  writeFileSync(join(root, `assets/mascot/${name}.svg`), tokens(wrap(art)) + '\n');
}

const body = Object.entries(poses)
  .map(([name, { art }]) => `  ${name}: ${JSON.stringify(wrap(art))},`)
  .join('\n');
const meta = Object.entries(poses)
  .map(([name, { label, use }]) => `  ${name}: { label: ${JSON.stringify(label)}, use: ${JSON.stringify(use)} },`)
  .join('\n');

writeFileSync(
  join(root, 'src/components/mascotPoses.generated.ts'),
  `// Generated by scripts/build-mascot.mjs. Edit the script, not this file.\n` +
    `// Colors are __TOKENS__ that <Mascot> fills in for light or dark mode.\n\n` +
    `export const MASCOT_POSES = {\n${body}\n} as const;\n\n` +
    `export type MascotPose = keyof typeof MASCOT_POSES;\n\n` +
    `export const MASCOT_INFO: Record<MascotPose, { label: string; use: string }> = {\n${meta}\n};\n`,
);

console.log(`Wrote ${Object.keys(poses).length} poses.`);
