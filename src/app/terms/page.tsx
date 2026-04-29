import { LegalPage } from "@/components/LegalPage";
import { BRAND_LEGAL_NAME, BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export const metadata = {
  title: `Terms of service — ${BRAND_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" effectiveDate="January 1, 2026">
      <H>What this is</H>
      <P>
        These terms govern your use of the {BRAND_NAME} resident portal
        operated by {BRAND_LEGAL_NAME}. Using the site means you accept them.
      </P>

      <H>What you can use it for</H>
      <UL>
        <li>Reading information about your building&rsquo;s waste service.</li>
        <li>Reporting an issue at your building.</li>
        <li>Confirming or changing the building you&rsquo;re associated with.</li>
      </UL>

      <H>What you agree not to do</H>
      <UL>
        <li>
          Submit reports for buildings you have no relationship to, or
          spam reports through the system.
        </li>
        <li>
          Upload content that&rsquo;s illegal, harassing, or violates someone
          else&rsquo;s privacy.
        </li>
        <li>
          Attempt to compromise the service, evade rate limits, or reverse
          engineer it for harmful purposes.
        </li>
      </UL>

      <H>Photos you submit</H>
      <P>
        When you attach a photo to an issue report, you grant {BRAND_LEGAL_NAME}
        permission to use it internally to investigate, document, and resolve
        the issue. Don&rsquo;t upload photos of people who haven&rsquo;t consented to
        be photographed.
      </P>

      <H>Service is best-effort</H>
      <P>
        We try to keep the service available and the data accurate, but we
        offer it as-is, without warranty. Schedules, porter assignments, and
        guides can change at any time.
      </P>

      <H>No employment relationship</H>
      <P>
        Submitting a report doesn&rsquo;t create any contract or employment
        relationship between you and {BRAND_LEGAL_NAME}.
      </P>

      <H>Liability</H>
      <P>
        To the extent permitted by law, {BRAND_LEGAL_NAME} isn&rsquo;t liable for
        indirect, incidental, or consequential damages arising from your use
        of the service.
      </P>

      <H>Termination</H>
      <P>
        We may suspend or limit access if you misuse the service. You can stop
        using it at any time.
      </P>

      <H>Governing law</H>
      <P>
        These terms are governed by the laws of the state where{" "}
        {BRAND_LEGAL_NAME} is headquartered, without regard to conflict-of-law
        rules.
      </P>

      <H>Changes</H>
      <P>
        We may update these terms. The &ldquo;effective&rdquo; date at the top
        reflects the latest version. Continued use after a change means you
        accept the update.
      </P>

      <H>Contact</H>
      <P>
        <a className="text-brand hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </P>
    </LegalPage>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 text-lg font-semibold text-zinc-900">{children}</h2>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}
