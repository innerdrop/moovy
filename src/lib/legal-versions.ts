// Ley 25.326 + AAIP: constantes de versión de los documentos legales.
// Cada vez que se modifique un documento legal (Política de Privacidad,
// Términos y Condiciones, Política de Cookies), BUMPEAR la versión acá.
// El `ConsentLog` y los timestamps `*ConsentVersion` en el User guardan
// esta versión para poder demostrar QUÉ versión aceptó cada usuario.
//
// Regla: solo tocar acá, nunca hardcodear versiones en otros archivos.

export const PRIVACY_POLICY_VERSION = "2.0";
export const PRIVACY_POLICY_UPDATED_AT = "2026-04-21";

export const TERMS_VERSION = "1.1";
export const TERMS_UPDATED_AT = "2026-03-29";

export const COOKIES_POLICY_VERSION = "1.1";
export const COOKIES_POLICY_UPDATED_AT = "2026-04-21";

// Ley 26.951 "No Llame" — versión del texto de consentimiento de marketing.
// Independiente de la política de privacidad, porque puede revocarse sin
// revocar los demás consentimientos.
export const MARKETING_CONSENT_VERSION = "1.0";

// Tipos de consentimiento que se loguean en ConsentLog.
export const CONSENT_TYPES = {
    TERMS: "TERMS",
    PRIVACY: "PRIVACY",
    MARKETING: "MARKETING",
    COOKIES: "COOKIES",
} as const;

export type ConsentType = (typeof CONSENT_TYPES)[keyof typeof CONSENT_TYPES];

export const CONSENT_ACTIONS = {
    ACCEPT: "ACCEPT",
    REVOKE: "REVOKE",
} as const;

export type ConsentAction = (typeof CONSENT_ACTIONS)[keyof typeof CONSENT_ACTIONS];
