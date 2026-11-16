export const WORLD = Object.freeze({ width: 900, height: 540 });

// The targets follow the ideal circular-orbit geometry for a horizontal launch.
export const LEVELS = [
  {
    id: 'first-orbit', number: '01', title: 'Find the orbit', difficulty: 'Training',
    brief: 'Fire a positive ion into a magnetic field. Adjust the field and launch speed until its orbit passes through the green detector.',
    concept: 'Magnetic fields change direction, not speed. A tighter curve means a smaller Larmor radius.',
    hint: 'With launch speed 240, try a magnetic field near +1.1.',
    world: WORLD, start: { x: 115, y: 440, angle: 0 },
    target: { x: 390, y: 190, radius: 24 }, obstacles: [],
    defaults: { field: 0.55, speed: 240, charge: 1 }, maxTime: 7,
  },
  {
    id: 'reactor-pass', number: '02', title: 'Reactor pass', difficulty: 'Intermediate',
    brief: 'Your beam must reach the detector without grazing either reactor wall. Too little deflection can be just as dangerous as too much.',
    concept: 'To hit the target, the full trajectory must avoid obstacles — not just the endpoint.',
    hint: 'With speed 240, try a positive field near +0.7 and watch the wall clearance.',
    world: WORLD, start: { x: 115, y: 445, angle: 0 },
    target: { x: 520, y: 145, radius: 23 },
    obstacles: [
      { x: 340, y: 410, width: 115, height: 80, label: 'Service hatch' },
      { x: 445, y: 315, width: 75, height: 40, label: 'Shielding' },
    ],
    defaults: { field: 0.32, speed: 240, charge: 1 }, maxTime: 7,
  },
  {
    id: 'reverse-field', number: '03', title: 'Calculate the rescue', difficulty: 'Final calculation',
    brief: 'No sliders this time. Use the given energy and target coordinates to calculate the launch speed and signed magnetic field, then enter both values to guide a positive ion to the detector.',
    concept: 'For a horizontal launch, geometry determines the orbit radius; kinetic energy determines speed. The Lorentz force then fixes the required field magnitude and direction.',
    hint: 'First find v from K = ½mv². Next calculate the radius of the circle passing through the target. Which sign of B bends a positive ion downward?',
    calculation: { mass: 1, charge: 1, kineticEnergy: 28800, speedTolerance: 0.02 },
    world: WORLD, start: { x: 115, y: 150, angle: 0 },
    target: { x: 420, y: 415, radius: 24 },
    obstacles: [
      { x: 300, y: 65, width: 140, height: 70, label: 'Restricted zone' },
      { x: 455, y: 230, width: 175, height: 100, label: 'Reactor housing' },
    ],
    defaults: { field: 0.9, speed: 240, charge: 1 }, maxTime: 7,
  },
];
