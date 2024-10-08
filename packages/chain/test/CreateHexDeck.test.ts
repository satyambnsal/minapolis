import { Field, UInt64 } from 'o1js';
import {
  createTrihexDeckBySeed,
  generateTileMapBySeed,
} from '../src/runtime/GameContext';
import { GRID_SIZE } from '../src/constants';

describe.skip('Generate ', () => {
  test('Trihex deck with seed', async () => {
    const deck = createTrihexDeckBySeed(Field(5));
    expect(deck.trihexes.length).toEqual(25);
  });
  test('Tilemap with seed', async () => {
    const tilemap = generateTileMapBySeed(Field(5));
    expect(tilemap.size).toEqual(UInt64.from(GRID_SIZE));
  });
});
