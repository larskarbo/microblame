import { getEnv } from "@larskarbo/get-env";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { readFileSync } from "fs";

export const getEncryptionKey = () => {
  const passwordEncryptionSecretFile = getEnv(
    "PASSWORD_ENCRYPTION_SECRET_FILE"
  );

  try {
    const passwordEncryptionSecret = readFileSync(
      passwordEncryptionSecretFile,
      "utf8"
    ).trim();
    const key = Buffer.from(passwordEncryptionSecret, "hex");
    if (key.length !== 32) {
      console.error("Encryption key must be 32 bytes (256 bits).");
      throw new Error("Encryption key must be 32 bytes (256 bits).");
    }
    return key;
  } catch (error) {
    console.error("Failed to read encryption key from file:", error);
    throw error;
  }
};

export const encryptPassword = async (password: string) => {
  if (password === "") {
    return "";
  }

  const passwordEncryptionSecret = getEncryptionKey();

  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", passwordEncryptionSecret, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptPassword = async (encryptedPassword: string) => {
  if (encryptedPassword === "") {
    return "";
  }

  const passwordEncryptionSecret = getEncryptionKey();

  const [ivHex, encrypted] = encryptedPassword.split(":");
  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted password format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(
    "aes-256-cbc",
    passwordEncryptionSecret,
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
