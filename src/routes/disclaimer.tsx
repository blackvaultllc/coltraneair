import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: `Disclaimer — ${BRAND}` },
      { name: "description", content: "Regulatory and business disclaimers." },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <LegalPage title="Disclaimer" updated="June 2026">
      <H2>No Offer or Contract</H2>
      <p>
        The information on this website is provided for general informational purposes only and does not constitute an
        offer, solicitation, contract, or commitment to provide air transportation, charter brokerage, or any other
        regulated service. Any future services will be provided subject to a separate, signed agreement and full
        compliance with applicable law.
      </p>

      <H2>FAA Part 135 Compliance Notice</H2>
      <p>
        {BRAND} is in the process of obtaining its Air Carrier Certificate under 14 C.F.R. Part 135 from the Federal
        Aviation Administration. Until that certificate is issued, no flights will be operated for compensation or hire.
        All operational, training, maintenance, and safety programs are being developed in accordance with FAA Part 119,
        Part 135, and Advisory Circular 120-49 standards.
      </p>

      <H2>DOT / FAA Regulatory Disclosure</H2>
      <p>
        Once certified, on-demand air taxi operations will be conducted under DOT economic authority and FAA operational
        authority. Customers will receive all required disclosures, including the U.S. Department of Transportation's
        consumer protection rules under 14 C.F.R. Part 399. Prior to certification this site does not constitute, and
        shall not be construed as, "holding out" within the meaning of 14 C.F.R. § 119.3.
      </p>

      <H2>Alabama Business Disclaimer</H2>
      <p>
        {BRAND} is organized under the laws of the State of Alabama. References on this site to specific airports,
        regions, or routes are illustrative and do not represent committed service. The Company makes no representation
        as to the availability of any service in any specific Alabama jurisdiction prior to certification.
      </p>

      <H2>No Tax, Legal, or Financial Advice</H2>
      <p>
        Nothing on this site constitutes tax, legal, or financial advice. Consult qualified professionals before making
        any decision based on information presented here.
      </p>

      <H2>Forward-Looking Statements</H2>
      <p>
        Statements regarding planned launch dates, future services, fleet composition, and operating regions are
        forward-looking and subject to change based on regulatory, operational, and market conditions.
      </p>

      <H2>Third-Party Links</H2>
      <p>
        This site may link to third-party sites for reference. We are not responsible for the content, accuracy, or
        privacy practices of any third-party site.
      </p>

      <H2>Trademarks</H2>
      <p>
        "Air 5 Wing Pilots USA" and associated logos are trademarks of the Company. All other trademarks referenced
        belong to their respective owners.
      </p>
    </LegalPage>
  );
}
