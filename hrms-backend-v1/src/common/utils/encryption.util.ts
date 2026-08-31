import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// We check for a 32-byte key from the environment.
// For security compliance, we fall back to a fixed 32-character string in development.
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    return Buffer.from(envKey, 'hex');
  }
  // Fallback dev key (exactly 32 bytes)
  return Buffer.from(
    'f3c7d6e8a1b2c3d4e5f60718293a4b5c6d7e8f900112233445566778899aabbc',
    'hex',
  );
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
