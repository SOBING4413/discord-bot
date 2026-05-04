/**
 * Discord Signature Verification
 * 
 * Works with Node.js 18+ crypto.subtle (no external deps needed)
 */

// Node.js 20+ provides crypto.subtle on globalThis
const crypto = globalThis.crypto;

export async function verifyDiscordSignature(signature, timestamp, body, publicKey) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + body);

    const keyData = fromHex(publicKey);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );

    const sigData = fromHex(signature);
    return crypto.subtle.verify("Ed25519", key, sigData, data);
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

function fromHex(hexString) {
  const matches = hexString.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}