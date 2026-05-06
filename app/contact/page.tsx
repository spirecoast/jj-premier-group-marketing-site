import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "[Contact description placeholder]",
};

export default function Contact() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Contact</p>
          <h1 className="text-section mb-6">[Contact hero placeholder]</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <ContactForm />

          <aside className="space-y-6">
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Phone</p>
              <p className="text-lg">[Phone placeholder]</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Email</p>
              <p className="text-lg">[Email placeholder]</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Office</p>
              <p className="text-lg">[Address placeholder]</p>
              <p className="text-muted-foreground">Lakewood Ranch, FL</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Hours</p>
              <p className="text-lg">[Office hours placeholder]</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
