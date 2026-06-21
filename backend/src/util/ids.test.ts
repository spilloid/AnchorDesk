import { parseId } from './ids';

describe('parseId', () => {
  it('accepts positive integer route parameters', () => {
    expect(parseId('42')).toBe(42);
  });

  it.each([undefined, '', 'time', 'NaN', '1.5', '0', '-1'])('rejects invalid id %p', (value) => {
    expect(parseId(value)).toBeNull();
  });
});
