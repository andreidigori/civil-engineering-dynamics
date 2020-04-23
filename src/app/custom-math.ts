import { factory, create, all } from 'mathjs';

const phi1 = factory('phi1', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v ^ 2 * tan(v) / 3 / (tan(v) - v)', { v });
});
const phi2 = factory('phi2', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v * (tan(v) - v) / 8 / tan(v) / (tan(v / 2) - v / 2)', { v });
});
const phi3 = factory('phi3', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v * (v - sin(v)) / 4 / sin(v) / (tan(v / 2) - v / 2)', { v });
});
const phi4 = factory('phi4', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v ^ 2 * tan(v / 2) / 12 / (tan(v / 2) - v / 2)', { v });
});
const eta1 = factory('eta1', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v ^ 3 / 3 / (tan(v) - v)', { v });
});
const eta2 = factory('eta2', ['evaluate'], ({ evaluate }) => {
  return (v: number) => evaluate('v ^ 3 / 24 / (tan(v / 2) - v / 2)', { v });
});

export const math = create({ ...all, phi1, phi2, phi3, phi4, eta1, eta2 }, null);
