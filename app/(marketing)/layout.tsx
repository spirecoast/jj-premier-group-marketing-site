import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UtmTracker } from "@/components/utm-tracker";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UtmTracker />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
