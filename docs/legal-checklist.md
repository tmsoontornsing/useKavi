# Kavi legal checklist

The Terms of Service and Privacy Policy in `apps/mobile/src/legal/documents.ts` are drafts written to match how
Kavi works today. They were not written or reviewed by a lawyer. No document can promise you will never be sued;
what these do is set expectations, disclaim what Kavi can't guarantee, cap damages, and push disputes into
individual arbitration. The items below close the gaps documents can't.

## Before release: must do

1. **Have a lawyer review the Terms and Privacy Policy.** Ask specifically about the arbitration clause, the
   liability cap, and the allergy and health disclaimers. Your state bar's lawyer referral service can point you
   to someone who reviews app terms.
2. **Form a company** (an LLC is the usual choice) and run Kavi through it, with its own bank account. If Kavi is
   sued, the company is the defendant, not you personally. Put its legal name in `LEGAL.company`.
3. **Fill in `apps/mobile/src/legal/config.ts`**: company name, a monitored contact email, a mailing address for
   legal notices, governing state and county, and the effective date. `legalReady()` returns false and the
   documents show `[BRACKETS]` until you do.
4. **Publish the documents on the web.** Run `node scripts/build-legal.mjs` in `apps/mobile` and post
   `legal/terms.md` and `legal/privacy.md` at the URLs in the config (now `usekavi.com/terms` and
   `usekavi.com/privacy`). Check that you own that domain. In App Store Connect, set the Privacy Policy URL, and
   add a link to the Terms (as the EULA) in the app description: Apple requires both for auto-renewing
   subscriptions.
5. **Make purchases real.** The paywall's Continue button only flips a local flag, and Restore shows "No
   purchases found" without checking. Connect StoreKit and Google Play Billing (RevenueCat is the planned route,
   and the `subscriptions` table is ready for it) before taking money. Apple rejects apps whose restore does
   nothing.
6. **Revoke Sign in with Apple on account deletion.** Apple requires apps to revoke the user's Apple tokens when
   they delete their account. `supabase/functions/delete-account` deletes the user but does not call Apple's
   revoke endpoint yet.
7. **Get the allergen tags checked.** This is Kavi's biggest real-world risk. The starter catalog's
   `contains-*` tags were derived automatically and are marked as needing review
   (`supabase/catalog/starter/README.md`). The app now says tags can be wrong and to read labels, at the point
   where allergies are chosen, on every recipe when the household has allergies, and in the Terms. A person
   should still check each recipe's tags before launch.
8. **Sign data processing agreements** with Supabase (in the dashboard) and, before you turn on AI planning,
   accept Anthropic's commercial terms and data processing addendum. The Privacy Policy already names both.

## App Store and Google Play forms

**App Store privacy label** (App Store Connect, App Privacy). Data is linked to the user and used for App
Functionality only. Tracking: **No**.

| Category | Type | Why |
| --- | --- | --- |
| Contact Info | Email Address, Name | Sign-in. Name only arrives with Google. |
| Health & Fitness | Health | Allergies and diet are health-related. Declare them to be safe. |
| Sensitive Info | Sensitive Info | A diet such as halal can reveal religious belief. |
| User Content | Other User Content | Pantry, likes, lists, plans. |
| Identifiers | User ID | Account ID. |
| Purchases | Purchase History | Once subscriptions are live. |

**Google Play Data safety**: the same data, collected, not shared with third parties for their own use,
encrypted in transit, and deletable by the user in the app (Settings, Delete Account).

**Age rating**: the content is suitable for all ages, but the Terms require users to be 13 or older because of
US children's privacy law (COPPA). Do not market Kavi to children.

## Soon after launch

- **Washington's My Health My Data Act** applies with no size threshold. Link the Privacy Policy's consumer
  health data section from your website's homepage, as the law requires.
- **Record consent.** Store which Terms version each person accepted and when (for example
  `terms_version` and `terms_accepted_at` on `profiles`), so you can prove agreement if challenged.
- **Answer privacy requests** sent to the contact email within 45 days, and keep a simple log of them.
- **Open-source notices.** Add an Acknowledgements screen listing licenses for Outfit (SIL Open Font License),
  Ionicons, React Native, Expo, and other bundled packages.
- **Trademark.** Search USPTO and the App Store for "Kavi" in software and food services before you invest in
  the name, and consider registering it.
- **Insurance.** Ask a broker about technology errors and omissions, general liability, and cyber coverage.

## Keep it true

Update the Terms, the Privacy Policy, and the store forms whenever Kavi starts collecting something new or uses
a new service. In particular, before adding analytics, crash reporting, ads, push notifications, or tracking,
update section 2 of the Privacy Policy and the store labels; tracking across other companies' apps also needs
Apple's App Tracking Transparency prompt.

Marketing must stay within what Kavi can back up. Price, budget, and nutrition figures are estimates, so say
"estimated" and never "guaranteed". Do not claim savings in dollars without evidence, and disclose any paid
endorsements or testimonials, as the FTC requires.
