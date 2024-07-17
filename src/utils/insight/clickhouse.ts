// @ts-ignore
import { createClient } from "@clickhouse/client-web";
import type { createClient as createClientNodejs } from "@clickhouse/client";
import { getEnv } from "@larskarbo/get-env";
import crypto from "node:crypto";
// @ts-ignore
globalThis.crypto ??= crypto.webcrypto;

export const clickhouseClient = createClient({
  host: getEnv("CLICKHOUSE_URI"),
  clickhouse_settings: {
    // Allows to insert serialized JS Dates (such as '2023-12-06T10:54:48.000Z')
    date_time_input_format: "best_effort",
  },
}) as unknown as ReturnType<typeof createClientNodejs>;

interface Meta {
  name: string;
  type: string;
}

interface Statistics {
  elapsed: number;
  rows_read: number;
  bytes_read: number;
}

export interface DataObject<
  T extends { [key: string]: string | number } = { [key: string]: string }
> {
  meta: Meta[];
  data: T[];
  rows: number;
  statistics: Statistics;
}

export const clickhouseQuery = async <Item extends { [key: string]: any }>(
  query: string
) => {
  return await clickhouseClient
    .query({
      query,
    })
    .then((res) => res.json())
    .then((res) => (res as DataObject<Item>).data);
};
