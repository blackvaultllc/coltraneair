import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${BRAND}` },
      { name: "description", content: "How we collect, use, and protect your personal information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <p>
        {BRAND} ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose,
        and safeguard your information when you visit this site or use our services. This policy is intended to comply
        with the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and
        applicable U.S. federal and state privacy laws.
      </p>

      <H2>1. Information We Collect</H2>
      <p>We may collect: (a) information you provide directly, such as your name and email address submitted through
        our waitlist or contact forms; (b) information collected automatically, such as IP address, browser type, device
        identifiers, pages viewed, and timestamps; (c) cookies and similar tracking technologies.
      </p>

      <H2>2. How We Use Your Information</H2>
      <p>We use information to: operate, maintain, and improve the site; respond to inquiries; communicate about our
        services; comply with legal obligations; detect and prevent fraud; and conduct analytics.
      </p>

      <H2>3. Cookies</H2>
      <p>
        We use essential cookies necessary for the site to function. With your consent we also use analytics cookies. You
        may manage your preferences through the cookie banner displayed on first visit, and you may clear cookies at
        any time through your browser settings.
      </p>

      <H2>4. Legal Bases (GDPR)</H2>
      <p>If you are in the EEA or UK, we process your personal data on one or more of the following legal bases:
        consent, performance of a contract, legitimate interest, and compliance with a legal obligation.
      </p>

      <H2>5. Your Rights (GDPR / CCPA)</H2>
      <p>Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, or port your
        personal data; to object to processing; to withdraw consent; and to lodge a complaint with a supervisory authority.
        California residents have the right to know, delete, correct, and opt out of the sale or sharing of personal
        information (we do not sell personal information).
      </p>

      <H2>6. Data Retention</H2>
      <p>We retain personal information for as long as needed to fulfill the purposes described in this policy or as
        required by law.
      </p>

      <H2>7. Security</H2>
      <p>We implement reasonable administrative, technical, and physical safeguards to protect your information. No
        method of transmission over the Internet is 100% secure.
      </p>

      <H2>8. Children's Privacy</H2>
      <p>The site is not directed to children under 13, and we do not knowingly collect information from them.</p>

      <H2>9. International Transfers</H2>
      <p>Information may be processed in the United States. By using the site you consent to such transfer.</p>

      <H2>10. Contact</H2>
      <p>Privacy requests: privacy@air5wingpilots.com.</p>
    </LegalPage>
  );
}
