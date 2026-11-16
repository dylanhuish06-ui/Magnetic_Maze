# Magnetic Maze · DUNFS FusionSim Challenge

A zero-dependency, phone-friendly browser game introducing students to **charged-particle motion in a magnetic field**. Built for Durham University Nuclear Fusion Society (DUNFS) Session 1.

Three missions: **Find the orbit**, **Reactor pass**, and **Reverse the field**. Change magnetic field magnitude and direction, particle speed, and charge to steer an ideal test particle through a detector without hitting the chamber walls.

## Run locally

You only need a modern browser. ES modules require a local HTTP server rather than `file://`:

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

Or `npm run dev`. There is no installation/build step.

## Tests

Requires Node.js 20+:

```bash
npm test
```

Tests cover analytical gyro-orbits, conservation of speed, charge/field reversal, obstacle collisions, and solvability of all three levels.

## Publish to GitHub Pages

1. Upload these files to the repository's `main` branch.
2. Open **Settings → Pages → Build and deployment**.
3. Select **Deploy from a branch**, then choose **main** and **/(root)**. Save.
4. Open the Pages URL shown in GitHub Settings. For a repository called `Magnetic_Maze` it will typically end in `/Magnetic_Maze/`.

The test workflow runs on pushes and pull requests. The game itself is static and has no backend or user accounts; high scores live only in that browser's local storage.

## Physics

With `x` rightward, screen `y` downward, and positive magnetic field directed **out of the screen**, the ideal nonrelativistic equations are

\[
\dot v_x = (qB/m)v_y,\qquad \dot v_y = -(qB/m)v_x.
\]

`src/physics.js` integrates this exactly for a spatially uniform, time-independent magnetic field. Collision detection samples the trajectory at 2.5 px or smaller intervals. Positive ions initially moving right curve upward when B is positive, and their speed is conserved.

The game uses illustrative field, mass, speed and distance units. It is **not** a realistic tokamak or self-consistent plasma simulation. The trajectory is an accurate example of the underlying ideal Lorentz-force model under the stated assumptions.

## Session 1 format (8 minutes)

- 2 min: Predict whether a stronger field bends the particle more or less.
- 4 min: In groups, complete the first two missions.
- 2 min: Explain results using the Larmor radius; attempt the reverse-field bonus.

An accompanying **[Remote Rescue](remote-rescue.html)** activity is provided for the ReMORA team, demonstrating open-loop versus closed-loop feedback control without blindfolded walking.

## Contribute

Change the scenarios in `src/levels.js`, the physics in `src/physics.js`, and the interface in `src/game.js` and `style.css`. Please include tests when changing the physics; avoid claiming model validity outside its assumptions.

Made for education by DUNFS. MIT License.