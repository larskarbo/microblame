import { Prisma } from "@prisma/client";

type CheckSelectKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : never;
};

export function createSelect<K>() {
  return <T extends K>(arg: CheckSelectKeys<T, K>) => arg;
}

export const pgInstanceBaseSelect = createSelect<Prisma.PgInstanceSelect>()({
  id: true,
  name: true,
	uuid: true,
  teamId: true,
});

// type Payload = Prisma.PgInstanceGetPayload<{
//   select: typeof pgInstanceBaseSelect;
// }>;
