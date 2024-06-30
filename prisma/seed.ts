import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const truncateAll = async (prisma: PrismaClient) => {
  // from: https://www.prisma.io/docs/concepts/components/prisma-client/crud#deleting-all-data-with-raw-sql--truncate

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
        );
      } catch (error) {
        console.log({ error });
      }
    }
  }
};

async function main() {
  await truncateAll(prisma);
  console.log(`Start seeding ...`);

  // Users
  const user = await prisma.user.create({
    data: {
      email: process.env.DEFAULT_SEED_EMAIL || undefined,
      name: "Default User",
      Team: {
        create: {
          name: "Default Team",
          Projects: {
            create: {
              name: "Default Project",
              PgInstances: {
                create: {
                  name: "Default PgInstance",
                  // PG_READ_DATABASE_URI=postgresql://lars@localhost:5432/layer3
                  pgDatabase: "layer3",
                  pgHost: "localhost",
                  pgPasswordEncrypted: "",
                  pgPort: 5432,
                  pgUser: "lars",
                  ssl: false,
                },
              },
            },
          },
        },
      },
    },
  });

  if (user.id !== 1) {
    throw new Error(`Expected user.id to be 1, but got ${user.id}`);
  }

  console.log(`Seeding finished.`);
}

// @ts-ignore
await main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
