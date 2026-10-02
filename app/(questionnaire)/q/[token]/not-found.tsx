/** An unknown or retired questionnaire link. Says nothing about what the link was for. */
export default function QuestionnaireNotFound() {
  return (
    <main className="mx-auto max-w-[36rem] px-4 py-24">
      <p className="t-eyebrow text-amber">Not found</p>
      <h1 className="t-h2 mt-3 text-navy">There’s nothing at this address.</h1>
      <p className="t-body mt-4">If someone sent you this link, ask them for a new one.</p>
    </main>
  );
}
