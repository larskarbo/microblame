import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getEnv } from "@larskarbo/get-env";

export const encryptPassword = async (password: string) => {
  if (password === "") {
    return "";
  }

  const passwordEncryptionSecret = getEnv("PASSWORD_ENCRYPTION_SECRET");

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

  const passwordEncryptionSecret = getEnv("PASSWORD_ENCRYPTION_SECRET");

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
