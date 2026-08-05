import { legal } from "@/lib/content";

function LegalDoc({
  doc,
}: {
  doc: {
    title: string;
    updated: string;
    sections: readonly { heading: string; body: string }[];
  };
}) {
  return (
    <div className="narrow legal-doc">
      <h1 className="page-title">{doc.title}</h1>
      <p className="muted small">Updated {doc.updated}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} style={{ marginTop: "1.75rem" }}>
          <h2 className="section-h">{section.heading}</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  return <LegalDoc doc={legal.privacy} />;
}
