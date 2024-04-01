import { truncate } from "lodash";

export const removeComments = (query: string) => {
  return query.replace(/\/\*.*?\*\//g, "");
};

export const TRUNCATE_LENGTH = 20;

export const truncateArr = (_arr: string[]) => {
  const arr = _arr.filter((a) => a != "");
  return truncate(arr.join(", "), {
    length: TRUNCATE_LENGTH,
    omission: "...",
  }).padEnd(TRUNCATE_LENGTH, " ");
};

export const makeQueryNice = (query: string) => {
  query = query.replace(/"public"\./g, "");
  return query;
};
