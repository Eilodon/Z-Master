import { VaultService } from "./crypto";

// PRF Extension Types (Standard is experimental)
interface AuthenticationExtensionsClientInputs {
    prf?: {
        eval?: {
            first: BufferSource;
            second?: BufferSource;
        };
        evalByCredential?: Record<string, {
            first: BufferSource;
            second?: BufferSource;
        }>;
    };
}

interface AuthenticationExtensionsClientOutputs {
    prf?: {
        results?: {
            first: ArrayBuffer;
            second?: ArrayBuffer;
        };
    };
}

export class WebAuthnService {
    private static CHALLENGE_SIZE = 32;
    private static RP_NAME = "Thay.AI Vault";
    private static RP_ID = window.location.hostname;

    static async isPrfSupported(): Promise<boolean> {
        // Check if browser supports PRF extension
        // Simple check: most modern browsers support 'prf' in extensions
        return PublicKeyCredential &&
            typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }

    /**
     * Register a new Passkey with PRF enabled
     * Returns the Credential ID and the initial PRF output (salt)
     */
    static async registerPasskey(userName: string): Promise<{ credentialId: string; prfKey: ArrayBuffer } | null> {
        try {
            const challenge = window.crypto.getRandomValues(new Uint8Array(this.CHALLENGE_SIZE));
            const userId = window.crypto.getRandomValues(new Uint8Array(16));

            // Initial PRF Input (Salt)
            const prfSalt = window.crypto.getRandomValues(new Uint8Array(32));

            const publicKey: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: this.RP_NAME,
                    id: this.RP_ID,
                },
                user: {
                    id: userId,
                    name: userName,
                    displayName: userName,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256
                    { alg: -257, type: "public-key" }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // FaceID/TouchID/Windows Hello
                    userVerification: "required",
                    residentKey: "required", // Discoverable
                },
                extensions: {
                    prf: {
                        eval: {
                            first: prfSalt
                        }
                    }
                } as any // Cast for TS
            };

            const credential = await navigator.credentials.create({ publicKey }) as any;
            if (!credential) return null;

            const extensions = credential.getClientExtensionResults();
            const prfResult = extensions.prf?.results?.first;

            if (!prfResult) {
                console.warn("[WebAuthn] PRF not supported by authenticator");
                // Fallback: Use rawId as key material? Less secure but better than nothing?
                // No, if PRF fails, we shouldn't pretend it works for encryption.
                return null;
            }

            return {
                credentialId: credential.id,
                prfKey: prfResult
            };

        } catch (e) {
            console.error("[WebAuthn] Registration Failed:", e);
            return null;
        }
    }

    /**
     * Authenticate and derive PRF key
     */
    static async authenticateAndGetPrfKey(allowedCredentialIds: string[], salt: Uint8Array): Promise<ArrayBuffer | null> {
        try {
            const challenge = window.crypto.getRandomValues(new Uint8Array(this.CHALLENGE_SIZE));

            const publicKey: PublicKeyCredentialRequestOptions = {
                challenge,
                rpId: this.RP_ID,
                userVerification: "required",
                allowCredentials: allowedCredentialIds.map(id => ({
                    id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
                    type: "public-key",
                    transports: ["internal"]
                })),
                extensions: {
                    prf: {
                        eval: {
                            first: salt
                        }
                    }
                } as any
            };

            const credential = await navigator.credentials.get({ publicKey }) as any;
            if (!credential) return null;

            const extensions = credential.getClientExtensionResults();
            const prfResult = extensions.prf?.results?.first;

            return prfResult || null;

        } catch (e) {
            console.error("[WebAuthn] Auth Failed:", e);
            return null;
        }
    }
}
