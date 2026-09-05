/** Rolls a six-sided die and returns the result.
 * @returns Random integer from 1 to 6
 */
export const d6 = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

/**
 * Makes a Shadowrun 5E test with a given dice pool and returns the number of hits.
 *
 * A hit is defined as a roll greater than or equal to 5. Supports a custom rolling function, but
 * assumes that function returns a number between 1 and 6.
 *
 * @param pool - The number of dice in the pool
 * @param rollingFunction - The function to use to roll the dice. Defaults to a random d6.
 * @returns The number of hits
 */
export const getTestHits = (
  pool: number,
  rollingFunction: () => number = d6
): number => {
  return Array.from({ length: pool }, rollingFunction).filter(
    result => result >= 5
  ).length;
};
