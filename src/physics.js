/**
 * Ideal 2D Lorentz-force motion in a uniform, constant perpendicular B field.
 * Positive B points out of screen, and screen +y is down.
 * Numerical values are teaching units, NOT SI.
 */
export const FIELD_SCALE = 0.8;
export const PARTICLE_RADIUS = 7;

export function angularFrequency(field, charge = 1, mass = 1) {
  if (!Number.isFinite(field) || !Number.isFinite(charge) || !(mass > 0)) {
    throw new RangeError('Magnetic field and charge must be finite, and mass must be positive');
  }
  return FIELD_SCALE * field * charge / mass;
}

export function larmorRadius(speed, field, charge = 1, mass = 1) {
  const omega = angularFrequency(field, charge, mass);
  return omega === 0 ? Infinity : Math.abs(speed / omega);
}

export function advanceParticle({ x, y, vx, vy }, dt, field, charge = 1, mass = 1) {
  if (!(dt >= 0) || !Number.isFinite(dt)) throw new RangeError('dt must be finite and nonnegative');
  const omega = angularFrequency(field, charge, mass);
  if (Math.abs(omega) < 1e-12) return { x: x + vx * dt, y: y + vy * dt, vx, vy };
  const a = omega * dt;
  const s = Math.sin(a);
  const c = Math.cos(a);
  return {
    x: x + (vx * s + vy * (1 - c)) / omega,
    y: y + (vy * s - vx * (1 - c)) / omega,
    vx: vx * c + vy * s,
    vy: vy * c - vx * s,
  };
}

export function kineticSpeed(state) {
  return Math.hypot(state.vx, state.vy);
}

export function intersectsBox(x, y, r, box) {
  const cx = Math.max(box.x, Math.min(x, box.x + box.width));
  const cy = Math.max(box.y, Math.min(y, box.y + box.height));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

export function detectOutcome(state, level, radius = PARTICLE_RADIUS) {
  const { x, y } = state;
  const { width, height } = level.world;
  if (x < radius || y < radius || x > width - radius || y > height - radius) {
    return { kind: 'escaped', label: 'The particle left the chamber.' };
  }
  if (level.obstacles.some(obstacle => intersectsBox(x, y, radius, obstacle))) {
    return { kind: 'collision', label: 'The particle hit a reactor wall.' };
  }
  if (Math.hypot(x - level.target.x, y - level.target.y) <= radius + level.target.radius) {
    return { kind: 'success', label: 'Target reached!' };
  }
  return null;
}

/** Sample a trajectory in at most 2.5-pixel steps for collision tests. */
export function simulateFlight(level, { field, speed, charge = 1 }) {
  if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('speed must be positive');
  const angle = level.start.angle ?? 0;
  let state = {
    x: level.start.x, y: level.start.y,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
  };
  const dt = Math.min(1 / 180, 2.5 / speed);
  const maxTime = level.maxTime ?? 8;
  const frames = [{ ...state, time: 0 }];
  let outcome = detectOutcome(state, level);
  for (let t = 0; t < maxTime - 1e-10 && !outcome;) {
    const step = Math.min(dt, maxTime - t);
    state = advanceParticle(state, step, field, charge, level.mass ?? 1);
    t += step;
    frames.push({ ...state, time: t });
    outcome = detectOutcome(state, level);
  }
  return {
    frames,
    outcome: outcome ?? { kind: 'timeout', label: 'The particle did not reach the target in time.' },
    elapsed: frames.at(-1).time,
  };
}
