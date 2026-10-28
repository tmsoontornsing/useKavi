// Business details the Terms and Privacy Policy name. Fill every field before release: the documents show the
// bracketed placeholders until then, and `legalReady()` stays false so a release check can catch it.
// See docs/legal-checklist.md for what each one should be.
export const LEGAL = {
  // The legal entity that owns Kavi, e.g. "Kavi Labs LLC". Prefer an LLC or corporation over your own name.
  company: 'LOGICBAKER COMPANY LIMITED',
  // Where people send privacy requests and legal notices. Must be monitored.
  email: '[CONTACT EMAIL]',
  // A postal address for legal notices (a registered agent's address works).
  address: '[MAILING ADDRESS]',
  // The US state whose law governs the Terms and where disputes are heard, e.g. "Delaware".
  state: '[STATE]',
  // The county for court claims, e.g. "New Castle County".
  county: '[COUNTY]',
  // When these versions take effect. Change it, and tell users, whenever the documents change materially.
  effective: 'October 27, 2026',
  // Where the same documents live on the web. App Store Connect and Google Play need these URLs.
  termsUrl: 'https://usekavi.com/terms',
  privacyUrl: 'https://usekavi.com/privacy',
};

export const legalReady = () => !Object.values(LEGAL).some((v) => v.startsWith('['));
