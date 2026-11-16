import test from 'node:test';
import assert from 'node:assert/strict';
import { speedFromEnergy, radiusThroughTarget, signedFieldForTarget, isEnergyConsistent } from '../src/calculation.js';
import { LEVELS } from '../src/levels.js';
import { simulateFlight } from '../src/physics.js';

test('speed is determined by the stated kinetic energy', () => {
  assert.equal(speedFromEnergy(28800, 1), 240);
  assert.ok(isEnergyConsistent(240, 28800, 1));
  assert.ok(isEnergyConsistent(242, 28800, 1));
  assert.equal(isEnergyConsistent(260, 28800, 1), false);
  assert.equal(isEnergyConsistent(NaN, 28800, 1), false);
});
test('radius for target follows horizontal-launch circle geometry', () => {
  const r = radiusThroughTarget(305, 265);
  assert.ok(Math.abs(r - 308.0188679245283) < 1e-9);
  assert.equal(radiusThroughTarget(-305, -265), r);
  assert.throws(() => radiusThroughTarget(305, 0), RangeError);
});
test('signed B bends positive charge towards target below launch', () => {
  const level = LEVELS[2], info = level.calculation;
  const deltaX = level.target.x - level.start.x;
  const deltaY = level.target.y - level.start.y;
  const field = signedFieldForTarget({ energy:info.kineticEnergy, mass:info.mass, charge:info.charge, deltaX, deltaY });
  assert.ok(field < 0);
  assert.ok(Math.abs(field + 0.9739663) < 1e-5);
  const launch = { field:Number(field.toFixed(3)), speed:speedFromEnergy(info.kineticEnergy,info.mass), charge:info.charge };
  assert.equal(simulateFlight(level, launch).outcome.kind, 'success');
  const reversed = signedFieldForTarget({ energy:info.kineticEnergy, mass:info.mass, charge:-1, deltaX, deltaY });
  assert.ok(reversed > 0);
});
test('final mission has a required calculation while first two use sliders', () => {
  assert.equal(LEVELS[0].calculation, undefined);
  assert.equal(LEVELS[1].calculation, undefined);
  assert.equal(LEVELS[2].calculation.charge, 1);
});
