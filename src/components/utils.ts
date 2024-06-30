import { isNumber, toNumber } from "lodash";
import { z } from "zod";

export const zodStringNumber = z.string().refine((numberString) => {
  return isNumber(toNumber(numberString));
});

export const zodStringOrNumberToNumber = z
  .union([zodStringNumber, z.number()])
  .transform((val) => toNumber(val));
