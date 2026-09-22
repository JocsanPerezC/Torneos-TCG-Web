const contact = '[CONTACT EMAIL]'

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing-theme min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article lang="en" className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-10">
          <h1 className="text-4xl font-black">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Effective date and last updated: September 22, 2026</p>
          <div className="legal-copy mt-8 space-y-8 text-[0.98rem] leading-7 text-[#514d45]">{children}</div>
          <div className="mt-10 flex justify-center border-t border-border pt-6">
            <button type="button" onClick={() => window.close()} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] hover:bg-[#1B9563]">Close tab</button>
          </div>
        </article>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-2xl font-bold text-foreground">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>
}

export function PrivacyPolicyPage() {
  return <LegalLayout title="Privacy Policy">
    <p>This Privacy Policy explains how EDH Tournaments handles personal information when you use the platform. It is an operational description of the current application and is not legal advice.</p>
    <Section title="1. Data controller and contact">
      <p>The data controller is <strong>[DATA CONTROLLER NAME]</strong>, located in <strong>[COUNTRY OR ADDRESS]</strong>. For privacy requests or questions, contact <strong>{contact}</strong>.</p>
    </Section>
    <Section title="2. Information we process">
      <p><strong>Account information.</strong> When you register with email, EDH Tournaments processes your email address and display name. Password authentication is handled by Supabase Auth; the application does not receive or store password hashes.</p>
      <p><strong>Google Sign-In information.</strong> When you choose Google Sign-In, authentication is provided through Supabase Auth using Google’s basic OpenID Connect identity information. This may include the name and email address supplied by Google. EDH Tournaments uses the information to create or identify your account and display your name. We do not request access to Gmail, Google Drive, contacts, calendars, or other Google data.</p>
      <p><strong>Tournament content.</strong> Organizers may provide tournament names, formats, player names, rounds, table assignments, scores, kills, standings, and optional tournament information. Public tournaments can make the relevant tournament content available through their public link.</p>
      <p><strong>Technical storage.</strong> The application uses browser local storage for the selected language, local demo data when the hosted backend is not configured, and authentication/session data required by Supabase Auth. We have not identified advertising or analytics tools in the application source.</p>
    </Section>
    <Section title="3. Why we use information">
      <p>We use account information to authenticate users, maintain their organizer profile, and provide account recovery. We use tournament content to operate the tournament-management features and, when an organizer makes a tournament public, to provide its public view. We use strictly necessary technical storage to keep the application working and to maintain the selected language or session.</p>
    </Section>
    <Section title="4. Legal basis and consent">
      <p>We process information as needed to provide the service requested by the user and, where required, based on the user’s acceptance of the Terms &amp; Conditions and this Privacy Policy. New accounts record the date and version of that acceptance. Users may withdraw consent or request deletion as described below; this may prevent continued use of account-dependent features.</p>
    </Section>
    <Section title="5. Service providers and international transfers">
      <p>Supabase provides authentication and database services for the configured production application. Google provides the Google Sign-In identity service when that option is used. Google Fonts is loaded to display the site typeface. These providers may process information in countries other than your own. We do not identify any other third-party analytics, advertising, email, hosting, or Google API service in the application source.</p>
      <p>Information obtained through Google Sign-In is accessed only for basic authentication, used only to create or identify the account, stored only as needed for the account profile and authentication flow, and is not sold or shared for advertising. It is deleted with the account where applicable, subject to the retention limits below. This use is subject to the Google API Services User Data Policy, including its Limited Use requirements.</p>
    </Section>
    <Section title="6. Retention and security">
      <p>We retain account and tournament information while the account or related tournament remains active, and for a limited period afterward when reasonably necessary for security, fraud prevention, dispute handling, or legal obligations. We use reasonable technical and organizational safeguards, but no online service can guarantee absolute security.</p>
    </Section>
    <Section title="7. Your rights and account deletion">
      <p>Subject to applicable law, you may request access, correction, updating, deletion, or restriction of your personal information, and may withdraw consent. To request account and data deletion, email <strong>{contact}</strong> from the account email address with the subject “Account deletion request.” We may request identity verification before acting. Deletion may remove the account and its associated tournament data; limited information may be retained where necessary for security, fraud prevention, or legal obligations.</p>
    </Section>
    <Section title="8. Cookies, local storage, and children">
      <p>The application does not intentionally use non-essential analytics or advertising cookies. It uses only the local storage and session technologies described above, plus any strictly necessary provider storage for authentication. We do not knowingly offer the service to children where parental consent is required by applicable law. If you believe a child has provided personal information without appropriate authorization, contact us at <strong>{contact}</strong>.</p>
    </Section>
    <Section title="9. Costa Rica and policy changes">
      <p>This policy is intended to be read consistently with the general principles of Costa Rica’s Law No. 8968 on the Protection of the Person with Regard to the Processing of Personal Data. It does not represent a guarantee of legal compliance or legal advice. We may update this policy to reflect changes to the service or legal requirements; the updated date will appear at the top of this page.</p>
    </Section>
  </LegalLayout>
}

export function TermsPage() {
  return <LegalLayout title="Terms & Conditions">
    <p>These Terms &amp; Conditions govern use of EDH Tournaments. They are an operational description of the current service and are not legal advice.</p>
    <Section title="1. Service and responsible party">
      <p>EDH Tournaments is a platform for organizers to create multiplayer TCG tournaments, manage participants, rounds, results, and standings, and optionally share a public tournament view. The service is operated by <strong>[DATA CONTROLLER NAME]</strong>, reachable at <strong>{contact}</strong>.</p>
    </Section>
    <Section title="2. Eligibility and accounts">
      <p>You must provide accurate information, keep your account credentials secure, and use an email address you control. You are responsible for activity performed through your account. Existing users may sign in through the authentication method available for their account. New account creation requires acceptance of these Terms and the Privacy Policy.</p>
    </Section>
    <Section title="3. Acceptable use">
      <p>You may use the service to organize and follow lawful TCG tournaments. You must not attempt to access another person’s account, interfere with the service, bypass security controls, submit malicious code, infringe others’ rights, or use the platform for unlawful, abusive, deceptive, or harmful activity.</p>
    </Section>
    <Section title="4. User content and public tournaments">
      <p>You remain responsible for tournament content you submit, including participant names, scores, results, and optional information. You must have an appropriate basis to provide that information. If you make a tournament public, you understand that its public view can expose the tournament details intended for participants and spectators. Do not publish sensitive personal information through tournament fields.</p>
    </Section>
    <Section title="5. Intellectual property">
      <p>The platform’s software, branding, and design remain the property of their respective owners. You retain rights in the content you submit, while granting the service the limited permission necessary to store, display, and process that content to operate the platform and its public tournament view.</p>
    </Section>
    <Section title="6. Unofficial Fan Content">
      <p>EDH Tournaments is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. © Wizards of the Coast LLC.</p>
      <p>EDH Tournaments is an independent community tournament platform. Organizers are responsible for obtaining any permissions required for their tournaments and must not represent a tournament as official, sponsored, or approved by Wizards unless they are authorized to do so.</p>
    </Section>
    <Section title="7. Availability, changes, and third parties">
      <p>We may maintain, modify, suspend, or discontinue parts of the service when reasonably necessary. We do not promise uninterrupted or error-free availability. Authentication and infrastructure may rely on third-party services, including Supabase and Google Sign-In, each governed by its own terms and privacy practices.</p>
    </Section>
    <Section title="8. Suspension, cancellation, and deletion">
      <p>We may suspend or remove access where reasonably necessary to protect the service, users, or legal rights. You may stop using the service at any time. To request deletion of your account and related personal data, follow the process in the Privacy Policy by contacting <strong>{contact}</strong>; identity verification may be required.</p>
    </Section>
    <Section title="9. Liability">
      <p>To the extent permitted by applicable law, the service is provided on an “as available” basis. We do not guarantee tournament outcomes, data availability, compatibility, or uninterrupted access. Nothing in these Terms excludes liability that cannot legally be excluded.</p>
    </Section>
    <Section title="10. Changes, governing law, and contact">
      <p>We may update these Terms when the service or applicable requirements change. The effective date will be shown at the top of this page. Applicable law and venue should be confirmed by <strong>[DATA CONTROLLER NAME]</strong> with a qualified legal professional. Questions about these Terms can be sent to <strong>{contact}</strong>.</p>
    </Section>
  </LegalLayout>
}
