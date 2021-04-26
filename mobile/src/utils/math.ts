const roundHundreths = (number: number) =>
  Number(Math.round(number * 100) / 100);
const roundHundrethsString = (number: number) =>
  Number(Math.round(number * 100) / 100).toFixed(2);

export { roundHundreths, roundHundrethsString };
