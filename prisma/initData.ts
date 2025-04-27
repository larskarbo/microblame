import { PrismaClient } from "@prisma/client";
import { writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { getEnv } from "@larskarbo/get-env";
import { initAndMigrateClickhouse } from "./initAndMigrateClickhouse";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding with initial data...`);

	await initAndMigrateClickhouse();

  const passwordEncryptionSecretFile = getEnv(
    "PASSWORD_ENCRYPTION_SECRET_FILE"
  );

  const alreadyExists = existsSync(passwordEncryptionSecretFile);

  if (alreadyExists) {
    console.log(
      `Encryption key already exists at ${passwordEncryptionSecretFile}`
    );
  } else {
    try {
      writeFileSync(
        passwordEncryptionSecretFile,
        randomBytes(32).toString("hex")
      );
      console.log(
        `Generated encryption key and saved to ${passwordEncryptionSecretFile}`
      );
    } catch (error) {
      console.error("Failed to create encryption key file:", error);
      throw error;
    }
  }

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
