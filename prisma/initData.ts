import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding with initial data...`);

  const user1 = await prisma.user.findUnique({
    where: {
      id: 1,
    },
  });

  if (user1) {
    console.log(`Seeding finished. User with id 1 already exists.`);
    return;
  }

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

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
