/**
 * Formula helpers for the final teaching challenge. Illustrative game units.
 * The initial velocity is horizontal, +x right, screen +y downward.
 */
import { FIELD_SCALE } from './physics.js';
export function speedFromEnergy(energy, mass) {
  if (!Number.isFinite(energy) || energy < 0 || !Number.isFinite(mass) || mass <= 0) throw new RangeError('Kinetic energy must be nonnegative and mass positive');
  return Math.sqrt(2 * energy / mass);
}
export function radiusThroughTarget(deltaX, deltaY) {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || deltaY === 0) throw new RangeError('A finite circular radius requires a nonzero vertical target displacement');
  return (deltaX ** 2 + deltaY ** 2) / (2 * Math.abs(deltaY));
}
export function signedFieldForTarget({ energy, mass, charge, deltaX, deltaY }) {
  if (!Number.isFinite(charge) || charge === 0) throw new RangeError('Charge must be nonzero');
  const speed = speedFromEnergy(energy, mass);
  const radius = radiusThroughTarget(deltaX, deltaY);
  const magnitude = mass * speed / (FIELD_SCALE * Math.abs(charge) * radius);
  return -Math.sign(deltaY) * Math.sign(charge) * magnitude;
}
export function isEnergyConsistent(speed, energy, mass, relativeTolerance=0.02) {
  if (!Number.isFinite(speed) || speed <= 0) return false;
  if (!Number.isFinite(relativeTolerance) || relativeTolerance < 0) return false;
  const expected = speedFromEnergy(energy, mass);
  return expected > 0 && Math.abs(speed - expected) <= expected * relativeTolerance;
}
