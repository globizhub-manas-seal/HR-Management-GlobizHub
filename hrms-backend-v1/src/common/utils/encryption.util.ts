import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const REQUIRED_KEY_BYTES = 32; // 32 bytes = 64 hex chars for AES-256

/**
 * Returns the AES-256 encryption key as a Buffer.
 * Throws at startup if ENCRYPTION_KEY is missing or the wrong length.
 * Joi schema in app.module.ts validates this at boot, so this is a defense-in-depth check.
 */
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')". ' +
        'Server cannot start without it — PII fields cannot be encrypted.',
    );
  }
  const keyBuffer = Buffer.from(envKey, 'hex');
  if (keyBuffer.length !== REQUIRED_KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly ${REQUIRED_KEY_BYTES * 2} hex characters (${REQUIRED_KEY_BYTES} bytes). ` +
        `Received ${envKey.length} characters (${keyBuffer.length} bytes).`,
    );
  }
  return keyBuffer;
};

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return iv and encrypted data concatenated as "iv:encrypted"
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

export function decrypt(
  encryptedText: string | null | undefined,
): string | null {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // If it is not encrypted (e.g. old legacy data in database), return as is
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed, returning input text:', error);
    return encryptedText; // Fallback to raw text if decryption fails (safeguard)
  }
}
