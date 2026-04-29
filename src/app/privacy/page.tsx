import { LegalPage } from "@/components/LegalPage";
import { BRAND_LEGAL_NAME, BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export const metadata = {
  title: `Privacy policy — ${BRAND_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" effectiveDate="January 1, 2026">
      <H>Summary</H>
      <P>
        {BRAND_LEGAL_NAME} (&ldquo;we&rdquo;, &ldquo;our&rdquo;) operates the{" "}
        {BRAND_NAME} resident portal you reach by scanning a QR code in your
        trash room or visiting our site. This page explains what data we
        collect, why, and how to reach us about it.
      </P>

      <H>What we collect</H>
      <UL>
        <li>
          <strong>Approximate location</strong> — only when you tap to
          auto-detect or verify your building. We use it once, to map you to
          the closest property in our system, and don&rsquo;t store it server-side.
        </li>
        <li>
          <strong>Issue reports you submit</strong> — including the category,
          a description, optional photos, and any name / email / phone you
          choose to leave so we can follow up.
        </li>
        <li>
          <strong>Local browser preferences</strong> — we remember which
          building you&rsquo;ve confirmed and the contact info you entered last
          time, in your browser&rsquo;s storage. We can&rsquo;t read this from our
          servers; it&rsquo;s only on your device.
        </li>
        <li>
          <strong>Standard server logs</strong> — IP address and request
          timestamps, kept short-term for security and abuse prevention.
        </li>
      </UL>

      <H>What we don&rsquo;t do</H>
      <UL>
        <li>We don&rsquo;t sell your data.</li>
        <li>We don&rsquo;t use it to advertise to you.</li>
        <li>
          We don&rsquo;t store your live location after the &ldquo;is this your
          building?&rdquo; check completes.
        </li>
      </UL>

      <H>Why we collect it</H>
      <P>
        To show you the right schedule and porter, route your issue report to
        the right people, and contact you back if you asked us to. Standard
        request-routing operations only.
      </P>

      <H>Who sees it</H>
      <P>
        Issue reports go to {BRAND_LEGAL_NAME} staff and, when relevant, to the
        hauling company assigned to your property. Photos and contact info you
        attach are visible to those same parties. We don&rsquo;t share with anyone
        else without your consent or a legal requirement.
      </P>

      <H>How long we keep it</H>
      <P>
        Issue reports and photos: kept while we&rsquo;re actively working on the
        issue and for a reasonable time after, so we can improve service.
        Standard server logs: typically 30 days.
      </P>

      <H>Your choices</H>
      <UL>
        <li>
          You can submit issue reports without a name or contact info — we
          just won&rsquo;t be able to follow up directly.
        </li>
        <li>
          You can clear remembered preferences by clearing your browser&rsquo;s
          site data for this site.
        </li>
        <li>
          You can ask us to delete data you&rsquo;ve submitted by emailing{" "}
          {SUPPORT_EMAIL}.
        </li>
      </UL>

      <H>Children</H>
      <P>
        This service is intended for adult residents and the {BRAND_NAME}
        staff that serve them. We don&rsquo;t knowingly collect data from
        children under 13.
      </P>

      <H>Changes</H>
      <P>
        We may update this policy. The &ldquo;effective&rdquo; date at the top
        of the page reflects the latest version. Material changes will be
        announced where the service is used.
      </P>

      <H>Contact</H>
      <P>
        Questions or requests:{" "}
        <a className="text-brand hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
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
