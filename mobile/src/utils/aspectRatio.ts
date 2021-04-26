export interface Ratio {
  numerator: number;
  denominator: number;
}

export const ACCEPTED_RATIOS_STRING_ENUM = {
  "7:8": "7:8",
};

export const ACCEPTED_RATIOS_OBJECT_ENUM = {
  RATIO_7_8_OBJECT: {
    numerator: 7,
    denominator: 8,
  },
};

interface CalculateDimensionsArgs {
  width: number;
  ratio: keyof typeof ACCEPTED_RATIOS_STRING_ENUM;
}

export const calculateDimensions = ({
  width,
  ratio,
}: CalculateDimensionsArgs) => {
  const ratioObject = resolveRatioStringToObject(ratio);
  return {
    width,
    height: width * (ratioObject.denominator / ratioObject.numerator),
  };
};

export const resolveRatioObjectToNumber = (ratio: Ratio) =>
  ratio.numerator / ratio.denominator;

export const resolveRatioStringToObject = (
  ratio: keyof typeof ACCEPTED_RATIOS_STRING_ENUM
) => {
  switch (ratio) {
    case ACCEPTED_RATIOS_STRING_ENUM["7:8"]:
      return ACCEPTED_RATIOS_OBJECT_ENUM.RATIO_7_8_OBJECT;
    default:
      return { numerator: 1, denominator: 1 };
  }
};

export const resolveRatioStringToNumber = (
  ratio: keyof typeof ACCEPTED_RATIOS_STRING_ENUM
) => {
  switch (ratio) {
    case ACCEPTED_RATIOS_STRING_ENUM["7:8"]:
      return resolveRatioObjectToNumber(
        ACCEPTED_RATIOS_OBJECT_ENUM.RATIO_7_8_OBJECT
      );
    default:
      return 1;
  }
};
