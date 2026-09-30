import assert from 'node:assert/strict';
import test from 'node:test';
import { matchOption, moveOption } from '../src/components/ui/select-navigation.ts';

const options = [
  { value: 'a', label: 'Стол' },
  { value: 'b', label: 'Стена', disabled: true },
  { value: 'c', label: 'Стул' },
  { value: 'd', label: 'Шкаф' },
];
test('select navigation skips unavailable items and clamps both ends and page jumps', () => {
  assert.equal(moveOption(options, 'a', 1), 'c');
  assert.equal(moveOption(options, 'c', -1), 'a');
  assert.equal(moveOption(options, 'a', -1), 'a');
  assert.equal(moveOption(options, 'd', 10), 'd');
  assert.equal(moveOption(options, 'd', -10), 'a');
  assert.equal(moveOption([], null, 1), null);
  assert.equal(moveOption([{ value: 'x', label: 'X', disabled: true }], null, -1), null);
});
test('typeahead supports Cyrillic prefixes, repeated-letter cycling and missing matches', () => {
  assert.equal(matchOption(options, 'a', 'с'), 'c');
  assert.equal(matchOption(options, 'c', 'сс'), 'a');
  assert.equal(matchOption(options, 'a', 'сту'), 'c');
  assert.equal(matchOption(options, 'a', 'ШК'), 'd');
  assert.equal(matchOption(options, 'a', 'сте'), 'a');
  assert.equal(matchOption([], null, 'с'), null);
});
