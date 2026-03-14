const MONEY_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export const moneyToCents = (value: string | number): number => {
  const normalized = String(value).trim();

  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error(`Invalid money value: ${value}`);
  }

  const isNegative = normalized.startsWith("-");
  const unsignedValue = isNegative ? normalized.slice(1) : normalized;
  const [wholePart, fractionalPart = ""] = unsignedValue.split(".");
  const cents =
    Number(wholePart) * 100 + Number(`${fractionalPart}00`.slice(0, 2));

  return isNegative ? cents * -1 : cents;
};

export const centsToMoneyString = (value: number): string => {
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const wholePart = Math.floor(absoluteValue / 100);
  const fractionalPart = String(absoluteValue % 100).padStart(2, "0");

  return `${isNegative ? "-" : ""}${wholePart}.${fractionalPart}`;
};
