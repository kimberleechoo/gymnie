// Run with: npm test   (Node 18+). These cover the pure logic: no browser needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan, suggestion } from '../src/lib/training.js';
import { milestoneState, newlyAchieved } from '../src/lib/milestones.js';
import { normalize, defaultState, mergeStates, stateForAccount } from '../src/lib/state.js';
import { EX, EXMAP, cleanCustom, syncCustom } from '../src/data/exercises.js';

const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(18, 0, 0, 0); return d.toISOString(); };
const session = (id, ago, items = []) => ({ id, date: daysAgo(ago), focus: 'Back', durationSec: 2700, pbs: [], items });
const lat = (reps, w = 30) => ({ exId: 'lat-pulldown', name: 'Lat pulldown', group: 'back', setsPlanned: 3, skipped: false, sets: reps.map(r => ({ w, r })) });
const builder = (over = {}) => ({ ...defaultState().builder, ...over });

test('generatePlan: needs at least one muscle group', () => {
  assert.ok(generatePlan(builder({ groups: [] }), []).error);
});

test('generatePlan: 30 minutes gives a short session, 60 gives a longer one', () => {
  const short = generatePlan(builder({ time: 30 }), []).plan.length;
  const long = generatePlan(builder({ time: 60 }), []).plan.length;
  assert.ok(short <= 3 && long > short);
});

test('generatePlan: low energy means 2 sets and no heavy lifts', () => {
  const { plan } = generatePlan(builder({ energy: 'low' }), []);
  assert.ok(plan.every(p => p.sets === 2));
  assert.ok(plan.every(p => !EXMAP[p.id].heavy));
});

test('generatePlan: respects avoided equipment and exercises', () => {
  const { plan } = generatePlan(builder({ avoidEquip: ['cable'], avoidEx: ['dead-bug'] }), []);
  assert.ok(plan.every(p => !EXMAP[p.id].tags.includes('cable') && p.id !== 'dead-bug'));
});

test('generatePlan: arms-only focus selects arm exercises', () => {
  const { plan } = generatePlan(builder({ groups: ['arms'] }), []);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(p => EXMAP[p.id].g === 'arms'));
});

test('generatePlan: includes arms when all muscle groups are selected', () => {
  const { plan } = generatePlan(builder(), []);
  assert.ok(plan.some(p => EXMAP[p.id].g === 'arms'));
});

test('arm exercises respect avoided equipment', () => {
  const { plan } = generatePlan(builder({ groups: ['arms'], avoidEquip: ['dumbbell'] }), []);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(p => EXMAP[p.id].g === 'arms' && !EXMAP[p.id].tags.includes('dumbbell')));
});

test('generatePlan: shoulders-only focus selects shoulder exercises', () => {
  const { plan } = generatePlan(builder({ groups: ['shoulders'] }), []);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(p => EXMAP[p.id].g === 'shoulders'));
});

test('shoulder exercises respect avoided equipment', () => {
  const { plan } = generatePlan(builder({ groups: ['shoulders'], avoidEquip: ['machine', 'cable'] }), []);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(p => EXMAP[p.id].g === 'shoulders' && EXMAP[p.id].tags.includes('dumbbell')));
});

test('suggestion: first time suggests a light start', () => {
  assert.equal(suggestion('lat-pulldown', []).kind, 'start');
});

test('suggestion: only suggests an increase once established and at the top of the range', () => {
  const established = [lat([12, 12, 12]), lat([12, 12, 12]), lat([12, 12, 12])].map((it, i) => session('s' + i, 2 + i * 3, [it]));
  const s = suggestion('lat-pulldown', established);
  assert.equal(s.kind, 'up');
  assert.equal(s.w, 32.5);
});

test('suggestion: holds the weight while returning from a break', () => {
  const returning = [session('a', 30, [lat([12, 12, 12])])];
  assert.equal(suggestion('lat-pulldown', returning).kind, 'hold');
});

test('suggestion: never raises weight when reps fall short', () => {
  const struggling = [lat([9, 8, 8]), lat([10, 9, 9]), lat([10, 10, 9])].map((it, i) => session('s' + i, 2 + i * 3, [it]));
  assert.notEqual(suggestion('lat-pulldown', struggling).kind, 'up');
});

test('milestones: first workout unlocks and ignores example sessions', () => {
  const real = [session('r1', 1, [lat([10, 10, 10])])];
  assert.ok(milestoneState(real, 3).items.find(i => i.id === 'first').done);
  const example = [{ ...real[0], sample: true }];
  assert.equal(milestoneState(example, 3).items.find(i => i.id === 'first').done, false);
});

test('milestones: reaching the weekly goal is announced once', () => {
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); // this Monday
  const mk = (id, offset) => { const d = new Date(mon); d.setDate(mon.getDate() + offset); d.setHours(10, 0, 0, 0); return { ...session(id, 0, [lat([10])]), date: d.toISOString() }; };
  const prev = [mk('a', 0), mk('b', 0)];
  const next = [...prev, mk('c', 0)];
  assert.ok(newlyAchieved(prev, next, 3).some(m => m.title === 'Weekly goal reached'));
  assert.ok(!newlyAchieved(next, next, 3).some(m => m.title === 'Weekly goal reached'));
});

test('normalize: bad saved data falls back to defaults', () => {
  const s = normalize('not an object');
  assert.deepEqual(s.sessions, []);
  assert.equal(s.profile.targetKg, 51);
});

test('mergeStates: keeps unique local sessions and uses settings from the newer remote state', () => {
  const local = { ...defaultState(), updatedAt: 1, sessions: [session('local', 1)], profile: { ...defaultState().profile, weightKg: 55 } };
  const remote = { ...defaultState(), updatedAt: 2, sessions: [session('remote', 2)], profile: { ...defaultState().profile, weightKg: 54 } };
  const merged = mergeStates(local, remote);
  assert.deepEqual(new Set(merged.sessions.map(s => s.id)), new Set(['local', 'remote']));
  assert.equal(merged.profile.weightKg, 54);
});

test('mergeStates: uses locally changed settings when the local state is newer', () => {
  const local = { ...defaultState(), updatedAt: 2, profile: { ...defaultState().profile, weightKg: 55 } };
  const remote = { ...defaultState(), updatedAt: 1, profile: { ...defaultState().profile, weightKg: 54 } };
  assert.equal(mergeStates(local, remote).profile.weightKg, 55);
});

test('stateForAccount: imports unowned local data once without mixing a different account', () => {
  const local = { ...defaultState(), sessions: [session('local', 1)] };
  const remote = { ...defaultState(), sessions: [session('remote', 2)] };
  assert.equal(stateForAccount(local, null, null, 'user-a').sessions[0].id, 'local');
  assert.deepEqual(stateForAccount(local, remote, 'user-a', 'user-b').sessions.map(s => s.id), ['remote']);
  assert.deepEqual(stateForAccount(local, null, 'user-a', 'user-b').sessions, []);
});

test('custom exercises: validated, then available everywhere through EXMAP', () => {
  assert.equal(cleanCustom({ id: 'x', name: '', g: 'back', reps: [8, 12] }), null);
  const ok = cleanCustom({ id: 'c-1', name: 'Dumbbell row', g: 'back', reps: [8, 12], sets: 3, tags: ['dumbbell'] });
  syncCustom([ok]);
  assert.ok(EXMAP['c-1'] && EX.some(e => e.id === 'c-1'));
  syncCustom([]);
  assert.equal(EXMAP['c-1'], undefined);
});
