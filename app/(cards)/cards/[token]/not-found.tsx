/** An unknown or retired cards link. Says nothing about what the link was for. */
export default function CardsNotFound() {
  return (
    <main className="mx-auto max-w-[36rem] px-4 py-24">
      <h1 className="t-h2 mt-3 text-navy">There’s nothing at this address.</h1>
      <p className="t-body mt-4">If someone sent you this link, ask them for a new one.</p>
    </main>
  );
}
