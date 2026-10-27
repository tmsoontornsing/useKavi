// Kavi's Terms of Service and Privacy Policy. This file is the one source: the app renders it on the legal screens,
// and scripts/build-legal.mjs writes the same text to legal/*.md for the website.
//
// DRAFT: written to match how Kavi works today, not reviewed by a lawyer. Have a licensed attorney review it
// before release, and update it whenever Kavi starts collecting something new or uses a new service provider.

import { LEGAL } from './config';

export type Block = { h: string } | { p: string } | { list: string[] };
export type LegalDoc = { id: 'terms' | 'privacy'; title: string; summary: string; blocks: Block[] };

const L = LEGAL;

export const TERMS: LegalDoc = {
  id: 'terms',
  title: 'Terms of Service',
  summary:
    'Kavi suggests meals, prices and nutrition as estimates. It does not replace reading food labels, checking for allergens, or advice from a doctor or dietitian. Subscriptions renew automatically until you cancel in your App Store or Google Play settings. Disputes go to individual arbitration, and you can opt out within 30 days.',
  blocks: [
    { p: `Effective ${L.effective}` },
    {
      p: `These Terms of Service ("Terms") are an agreement between you and ${L.company} ("${L.company}", "we", "us") about your use of the Kavi app and related services (together, "Kavi"). By creating an account or using Kavi, you agree to these Terms and acknowledge our Privacy Policy. If you do not agree, do not use Kavi.`,
    },
    {
      p: 'Please read section 15 carefully. It requires most disputes to be resolved by individual arbitration instead of in court, and waives class actions, unless you opt out within 30 days.',
    },

    { h: '1. Who can use Kavi' },
    {
      p: 'You must be at least 13 years old to use Kavi. If you are under 18, or under the age of majority where you live, you may use Kavi only with the permission of a parent or legal guardian, who agrees to these Terms for you and is responsible for any purchases. You may not use Kavi if the law forbids it.',
    },

    { h: '2. Your account' },
    {
      p: 'You can sign in with Apple, Google, or an email address and password. Give accurate information, keep your sign-in details secure, and tell us promptly if you think someone else has used your account. You are responsible for activity on your account.',
    },

    { h: '3. What Kavi is, and what it is not' },
    {
      p: 'Kavi suggests weekly meal plans, recipes, grocery lists, price estimates and nutrition estimates based on what you tell it. It is a planning tool. Please read these limits; they matter for your safety.',
    },
    {
      list: [
        'Allergies and food restrictions. Kavi tries to leave out recipes that contain the allergens and foods you list, using tags on each recipe and ingredient. Those tags can be incomplete or wrong, and store-bought products differ by brand and can change recipe, contain hidden ingredients, or be made alongside allergens. Kavi cannot guarantee that any recipe or ingredient is free of an allergen. Always read every product label. If you or anyone you cook for has a food allergy, especially a severe one, check every ingredient yourself before you buy, cook, or serve it.',
        'Not medical or nutrition advice. Nutrition figures are estimates calculated from typical values for each ingredient, not lab measurements, and actual amounts vary with brands, portion sizes and cooking. Kavi does not diagnose, treat, or manage any medical condition. Talk to a doctor or registered dietitian before relying on Kavi if you are pregnant or nursing, have diabetes, kidney or heart disease, an eating disorder, or any condition affected by what you eat, or if you are planning meals for an infant.',
        'Diet and religious labels. Labels such as halal, vegetarian, vegan, or gluten-free describe how a recipe is meant to be made. Kavi does not certify food. Buy products certified to the standard you follow.',
        'Prices and budgets. Prices are estimated from average US prices and are not quotes from any store. What you pay depends on your store, location, brands and the date. Kavi does not promise that you will spend a particular amount or stay within your budget.',
        'Food safety. Follow safe food handling: wash hands and produce, keep raw meat separate, refrigerate promptly, and cook food to safe internal temperatures (for example, 165°F for poultry). Recipe times are estimates. Use care with knives, heat and appliances, and supervise children in the kitchen.',
        'Automated suggestions. Meal plans may be created by software, including artificial intelligence services, and can contain mistakes. Use your own judgment.',
      ],
    },

    { h: '4. Kavi Plus subscriptions' },
    {
      p: 'Kavi is free to use with limits; for example, the free plan includes one meal plan a month. Kavi Plus is a paid subscription that removes those limits and adds features described in the app at the time you subscribe.',
    },
    {
      list: [
        'Billing. You buy Kavi Plus through the Apple App Store or Google Play. Payment is charged to your Apple ID or Google account when you confirm the purchase, at the price and for the period shown before you buy.',
        'Automatic renewal. Your subscription renews automatically for the same period and price unless you turn off auto-renew at least 24 hours before the current period ends. Your account is charged for renewal within 24 hours before the period ends.',
        'Cancelling. Manage or cancel in your App Store or Google Play account settings. Cancelling stops future renewals; you keep Plus until the end of the period you paid for. Deleting the app or your Kavi account does not cancel a subscription.',
        'Free trials. If we offer a free trial, it converts to a paid subscription at the end of the trial unless you cancel at least 24 hours before it ends. Any unused part of a trial ends when you buy a subscription.',
        'Refunds. Apple and Google process all payments and refunds under their own policies. Request a refund from them. We cannot issue refunds for purchases made through them.',
        'Price changes. We may change the price of Kavi Plus. We will give you advance notice as the store requires, and a new price applies only from your next renewal after the notice.',
      ],
    },

    { h: '5. Shared grocery lists' },
    {
      p: 'If you invite people to your household, they can see and change your grocery list. Invite only people you trust. You are responsible for who you invite, and you can remove them.',
    },

    { h: '6. Acceptable use' },
    { p: 'You agree not to:' },
    {
      list: [
        'break any law, or use Kavi to harm, harass, or deceive anyone;',
        'access accounts or data that are not yours, or test, probe, or break our security;',
        'copy, scrape, resell, or redistribute Kavi or its recipes, prices, or nutrition data in bulk, or use them to build a competing product or to train machine learning models;',
        'reverse engineer the app, except where the law allows despite this limit;',
        'overload or interfere with Kavi, including through bots or automated access.',
      ],
    },

    { h: '7. Your information and content' },
    {
      p: 'You keep ownership of what you enter, such as your pantry items, foods you like, and household details. You give us permission to store, process, and display it only as needed to run Kavi for you and the people you share with, as described in the Privacy Policy. If you send us feedback or ideas, we may use them without any obligation to you.',
    },

    { h: '8. Our content' },
    {
      p: 'Kavi, including its software, design, Pip the mascot, recipes, text, and data, belongs to us or our licensors and is protected by intellectual property laws. We give you a personal, limited, non-exclusive, non-transferable, revocable license to use the app on devices you own or control, for your own non-commercial use, under these Terms.',
    },

    { h: '9. Third-party services' },
    {
      p: 'Kavi relies on services from other companies, such as Apple and Google for sign-in and payments and cloud providers for hosting. Their own terms and privacy policies apply to your use of their services. We are not responsible for services we do not control. Links to other websites are for convenience only.',
    },

    { h: '10. Changes to Kavi and to these Terms' },
    {
      p: 'We may add, change, or remove features. We may update these Terms. If a change is material, we will tell you in the app or by email before it takes effect. Continuing to use Kavi after the change takes effect means you accept the updated Terms. If you do not agree, stop using Kavi and delete your account.',
    },

    { h: '11. Ending your use' },
    {
      p: 'You can stop using Kavi and delete your account at any time in Settings. We may suspend or end your access if you break these Terms, if we must for legal reasons, or if we stop offering Kavi. If we discontinue Kavi Plus, we will tell you in advance. Sections that by their nature should continue, including 3, 7 through 9, and 12 through 17, continue after your access ends.',
    },

    { h: '12. Disclaimer of warranties' },
    {
      p: 'Kavi is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, and accuracy. We do not promise that Kavi will be uninterrupted, error-free, or secure, or that recipes, allergen tags, prices, or nutrition information are accurate, complete, or suitable for you. Some places do not allow these exclusions, so some may not apply to you.',
    },

    { h: '13. Limitation of liability' },
    {
      p: `To the fullest extent the law allows, ${L.company} and its owners, employees, and suppliers will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, data, or goodwill, arising from or related to Kavi or these Terms, even if we were told they were possible. Our total liability for all claims relating to Kavi or these Terms is limited to the greater of the amount you paid us for Kavi in the 12 months before the claim arose, or US $50.`,
    },
    {
      p: 'Nothing in these Terms limits liability that cannot be limited by law, such as liability for fraud, or for death or personal injury caused by gross negligence or willful misconduct where the law does not allow it to be limited.',
    },

    { h: '14. Indemnity' },
    {
      p: `To the extent the law allows, you agree to defend and indemnify ${L.company} against claims, losses, and costs (including reasonable legal fees) arising from your breach of these Terms or your misuse of Kavi, including food you prepare or serve to others.`,
    },

    { h: '15. Resolving disputes' },
    {
      list: [
        `Talk to us first. Before filing a claim, contact us at ${L.email} and describe the problem and what you want. We will try to resolve it within 60 days.`,
        'Arbitration. If we cannot resolve it, you and we agree to resolve any dispute arising from or relating to Kavi or these Terms by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, instead of in court. The Federal Arbitration Act governs this section. The arbitrator may award the same individual relief a court could. We will pay arbitration filing and arbitrator fees beyond what you would pay to file in court, unless the arbitrator finds your claim frivolous.',
        'Exceptions. Either side may bring an individual claim in small claims court, or ask a court to stop infringement of intellectual property.',
        'No class actions. Claims may be brought only on an individual basis, not as a plaintiff or class member in any class, consolidated, or representative action. If this waiver is found unenforceable for a claim, that claim proceeds in court, not in arbitration.',
        `Opting out. You can opt out of arbitration within 30 days of first accepting these Terms by emailing ${L.email} with your name, the email on your account, and a clear statement that you opt out of arbitration.`,
        `Governing law and courts. These Terms are governed by the laws of the State of ${L.state}, without regard to conflict of law rules, except that the Federal Arbitration Act governs this section. Any claim not subject to arbitration will be heard only in the state or federal courts located in ${L.county}, ${L.state}, and you and we consent to their jurisdiction.`,
        'Time limit. To the extent the law allows, any claim must be brought within one year after it arose, or it is permanently barred.',
      ],
    },

    { h: '16. App Store terms' },
    {
      p: 'If you got Kavi from the Apple App Store, these Terms are between you and us, not Apple. Apple is not responsible for Kavi or its content, has no obligation to provide maintenance or support, and is not responsible for any claims relating to Kavi, including product liability claims, claims that Kavi fails to meet a legal or regulatory requirement, consumer protection or privacy claims, or claims that Kavi infringes someone else\'s intellectual property. We, not Apple, are responsible for investigating and resolving those claims. If Kavi fails to meet a warranty that applies, you may notify Apple and Apple will refund the purchase price, if any; Apple has no other warranty obligation. You confirm that you are not in a country subject to a US government embargo or listed on a US government list of prohibited or restricted parties. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you. Your use must also follow the App Store Terms of Service.',
    },

    { h: '17. General' },
    {
      p: 'These Terms and the Privacy Policy are the whole agreement between you and us about Kavi. If any part is unenforceable, the rest stays in effect. Our not enforcing a right is not a waiver of it. You may not transfer these Terms; we may transfer them in connection with a merger, acquisition, or sale of assets. Neither side is liable for delays caused by events beyond its reasonable control.',
    },

    { h: '18. Contact' },
    { p: `${L.company}\n${L.address}\n${L.email}` },
  ],
};

export const PRIVACY: LegalDoc = {
  id: 'privacy',
  title: 'Privacy Policy',
  summary:
    'Kavi collects what it needs to plan your meals: your account, household size, budget, diet, allergies, food preferences, pantry, and lists. We do not sell your information, show ads, or track you across other apps. You can delete your account and everything in it from Settings.',
  blocks: [
    { p: `Effective ${L.effective}` },
    {
      p: `This Privacy Policy explains what information ${L.company} ("we", "us") collects through the Kavi app and related services ("Kavi"), how we use and share it, and the choices and rights you have. It applies to everyone who uses Kavi.`,
    },

    { h: '1. Information you give us' },
    {
      list: [
        'Account. Your email address, and your password if you sign up with email (we store only a secure hash of it). If you sign in with Apple or Google, we receive your email address (Apple may give us a private relay address instead) and a user ID, and Google may also share your name and profile picture.',
        'Household profile. How many people you cook for, your weekly grocery budget, your diet (for example vegetarian or halal), allergies, foods you dislike, foods you like, and the kitchen equipment you have.',
        'Your lists. Pantry items, meal plans, meals you swap, grocery lists and what you check off, and steps you mark done.',
        'Household members. The people you invite to share your grocery list, and their accounts.',
        'Preferences. Settings such as reminder and notification choices.',
        'Reminders (only if you choose "Add list to Reminders" on iPhone). Kavi asks for permission to use Reminders, then adds your grocery items to a list named Kavi Groceries. Kavi reads only that list, to avoid adding an item twice, and never reads your other reminders. Those reminders live on your device and in your Apple account, under Apple\'s privacy practices; they are not sent to us. You can turn the permission off in iPhone Settings.',
        'Support. What you send us when you contact us.',
      ],
    },

    { h: '2. Information collected automatically' },
    {
      p: 'Our hosting and sign-in providers record technical information needed to run and secure Kavi, such as your IP address, device and app version, and the times you sign in or make requests. Kavi does not include advertising, analytics, or tracking software from other companies, does not use an advertising identifier, and does not track you across other companies\' apps or websites.',
    },

    { h: '3. Sensitive information' },
    {
      p: 'Your allergies, dislikes, and diet can reveal information about your health or, in the case of a choice such as halal, your religious beliefs. Some laws treat this as sensitive or "consumer health" data. We collect it only because you choose to give it, and use it only to plan your meals and grocery lists. You can leave it blank, change it, or delete it in Settings at any time. We never sell it, use it for advertising, or use it to make decisions about you that have legal or similarly significant effects.',
    },

    { h: '4. How we use information' },
    {
      list: [
        'To provide Kavi: plan meals that fit your household, budget, diet, allergies, and kitchen; estimate prices and nutrition; build and sync your grocery list; and share it with the people you invite.',
        'To manage your account and Kavi Plus subscription status.',
        'To send notifications you turn on, and service messages such as changes to these policies.',
        'To respond to you, fix problems, and keep Kavi secure, including preventing fraud and abuse.',
        'To improve Kavi using information that does not identify you.',
        'To comply with the law and enforce our Terms.',
      ],
    },
    { p: 'We do not sell your personal information, share it for cross-context behavioral advertising, or use it to show you ads.' },

    { h: '5. Who we share it with' },
    {
      list: [
        'Service providers that run Kavi for us, under contracts that limit how they may use it: Supabase (database, sign-in, and hosting, in the United States); and Apple and Google (sign-in, and processing subscription payments and refunds).',
        'AI meal planning. To create a plan, we may send an AI service provider (currently Anthropic) the details needed to choose meals: household size, budget, diet, allergies, dislikes, foods you like, and the list of candidate recipes. We do not send your name, email address, or account ID.',
        'If we add a subscription management provider (such as RevenueCat), it will receive an anonymous app user ID and your purchase records from Apple or Google.',
        'People in your household see your shared grocery list.',
        'For legal reasons: when required by law or valid legal process, or to protect the rights, safety, and property of you, others, or us.',
        'In a business transfer, such as a merger or sale of assets, subject to this Policy.',
      ],
    },

    { h: '6. How long we keep it' },
    {
      p: 'We keep your information while your account exists. When you delete your account in Settings, we delete your account, household profile, pantry, meal plans, grocery lists, and household links from our active systems right away; copies in backups are overwritten within 30 days. We may keep limited information longer when the law requires it or to resolve disputes. Apple and Google keep their own purchase records.',
    },

    { h: '7. Your choices and rights' },
    {
      list: [
        'Change your details any time in Settings, and turn notifications on or off there or in your device settings.',
        'Delete your account and its data: Settings, Delete Account.',
        `Ask for a copy of your information, or ask us to correct or delete it, by emailing ${L.email}.`,
      ],
    },
    {
      p: 'Depending on where you live, for example California, Virginia, Colorado, Connecticut, Washington, and other US states, or the EU and UK, you may have the right to know what personal information we hold and how we use it, to access and receive a portable copy, to correct it, to delete it, to limit the use of sensitive information, to withdraw consent, and to opt out of sale, sharing for advertising, and profiling. Because we do not sell or share personal information for advertising, there is nothing to opt out of; if that ever changes, we will honor Global Privacy Control signals. We will not discriminate against you for using your rights.',
    },
    {
      p: `To make a request, email ${L.email} from the address on your account. We will verify your request and respond within the time the law requires, usually 45 days. You may use an authorized agent where the law allows. If we deny your request, you can appeal by replying to our decision, and we will respond to your appeal within the time the law requires. If you are not satisfied, you can contact your state attorney general or, in the EU or UK, your data protection authority.`,
    },

    { h: '8. Consumer health data (Washington, Nevada, and similar laws)' },
    {
      p: 'The allergies, dislikes, and diet you enter may be consumer health data under laws such as Washington\'s My Health My Data Act. We collect it from you, use it only to provide the meal planning you ask for, share it only with the service providers listed in section 5 and the household members you invite, and never sell it. You can see, change, or delete it in Settings, or ask us to delete it and to tell you which third parties have received it, using the contact details below.',
    },

    { h: '9. If you are in the EU, UK, or Switzerland' },
    {
      p: 'We process your information to perform our contract with you (to provide Kavi), for our legitimate interests (keeping Kavi secure and improving it), to comply with legal obligations, and with your consent (notifications, and the allergy and diet details you choose to enter, which you can withdraw by removing them). Your information is stored and processed in the United States. Where the law requires, we protect transfers with safeguards such as the European Commission\'s Standard Contractual Clauses.',
    },

    { h: '10. Children' },
    {
      p: `Kavi is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has given us information, contact ${L.email} and we will delete it.`,
    },

    { h: '11. Security' },
    {
      p: 'We protect your information with measures such as encryption in transit, access controls that limit each account to its own data, and keeping secret keys off your device. No system is perfectly secure, so we cannot guarantee security. If a breach affects your information, we will notify you as the law requires.',
    },

    { h: '12. Changes to this Policy' },
    {
      p: 'We will update this Policy when our practices change. If a change is material, we will tell you in the app or by email before it takes effect, and ask for your consent where the law requires it.',
    },

    { h: '13. Contact us' },
    { p: `${L.company}\n${L.address}\n${L.email}` },
  ],
};

export const LEGAL_DOCS = { terms: TERMS, privacy: PRIVACY } as const;
