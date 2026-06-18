import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Use — ${BRAND}` },
      { name: "description", content: "Website Terms of Use governing your use of this site." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Website Terms of Use" updated="June 2026">
      <p>
        These Terms of Use ("Terms") govern your access to and use of the website operated by {BRAND} ("Company,"
        "we," "us," or "our"). By accessing or using this site you agree to be bound by these Terms. If you do not
        agree, do not use the site.
      </p>

      <H2>1. Informational Purposes Only</H2>
      <p>
        This site is provided for general informational purposes. Nothing on this site constitutes an offer, solicitation,
        contract, or commitment to provide air transportation or any other service. All services described are subject to
        availability, applicable regulations, and the execution of a separate written agreement.
      </p>

      <H2>2. No Air Carrier Certificate Yet</H2>
      <p>
        {BRAND} is in the process of obtaining its Air Carrier Certificate under 14 C.F.R. Part 135. Until such a
        certificate is issued by the Federal Aviation Administration ("FAA"), the Company does not hold itself out as,
        and does not operate as, a Part 135 air carrier. No flights for compensation or hire will be offered until all
        regulatory requirements are satisfied.
      </p>

      <H2>3. Eligibility</H2>
      <p>You must be at least 18 years of age and capable of entering into a binding contract to use this site.</p>

      <H2>4. Intellectual Property</H2>
      <p>
        All content on this site — including text, graphics, logos, photographs, video, software, and the overall design —
        is owned by or licensed to {BRAND} and is protected by United States and international copyright, trademark,
        and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works
        without our prior written consent.
      </p>

      <H2>5. User Conduct</H2>
      <p>You agree not to: (a) use the site for any unlawful purpose; (b) attempt to gain unauthorized access to any
        portion of the site, including the employee portal; (c) interfere with the operation of the site; (d) use any
        automated means to access the site without our prior written consent.
      </p>

      <H2>6. Disclaimer of Warranties</H2>
      <p>
        THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
        BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
        NON-INFRINGEMENT.
      </p>

      <H2>7. Limitation of Liability</H2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, {BRAND} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SITE.
      </p>

      <H2>8. Governing Law</H2>
      <p>
        These Terms are governed by the laws of the State of Alabama, United States, without regard to its conflict of
        laws principles. Any dispute will be resolved in the state or federal courts located in Jefferson County, Alabama.
      </p>

      <H2>9. Changes to These Terms</H2>
      <p>
        We may revise these Terms at any time by posting an updated version. Your continued use of the site after any
        revision constitutes acceptance of the updated Terms.
      </p>

      <H2>10. Contact</H2>
      <p>Questions about these Terms may be directed to legal@air5wingpilots.com.</p>
    </LegalPage>
  );
}
