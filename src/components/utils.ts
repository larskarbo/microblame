import { isNumber, toNumber } from "lodash";
import { z } from "zod";

export const zodStringNumber = z.string().refine((numberString) => {
  return isNumber(toNumber(numberString));
});

export const zodStringOrNumberToNumber = z
  .union([zodStringNumber, z.number()])
  .transform((val) => toNumber(val));

export const getErrorMessage = (error: unknown) => {
  let message;

  const hasMessageInObj =
    typeof error === "object" && error !== null && (error as Error).message;

  if (error instanceof Error || hasMessageInObj) {
    message = (error as Error).message;
  } else {
    message = String(error);
  }

  return message;
};
