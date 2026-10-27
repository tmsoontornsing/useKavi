@AGENTS.md

## Mascot

Pip is Kavi's mascot, a mason jar. Use `<Mascot pose="wave" />` from `src/components/Mascot.tsx`. The 13 poses are wave, think, cook, shop, cheer, oops, sleep, peek, love, yum, save, point and read; each pose's `use` in `mascotPoses.generated.ts` says where it belongs. Each pose plays its own idle animation, which Reduce Motion or `animate={false}` turns off. Draw and edit poses in `scripts/build-mascot.mjs`, then run `node scripts/build-mascot.mjs` to regenerate `assets/mascot/*.svg` and `src/components/mascotPoses.generated.ts`. Do not edit the generated files by hand. In development, `/dev/mascot` shows every pose animating.
