export const LEGAL_VERSION = '2026-09-22'
export const legalConsentStorageKey = 'torneos-tcg.pending-legal-consent'

export type LegalConsent = {
  termsVersion: typeof LEGAL_VERSION
  privacyVersion: typeof LEGAL_VERSION
}

export const currentLegalConsent: LegalConsent = {
  termsVersion: LEGAL_VERSION,
  privacyVersion: LEGAL_VERSION,
}
