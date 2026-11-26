import { Suspense } from "react";
import { getDealerInfo } from "@/lib/dealer-data";
import { DealerShell } from "@/components/dealer/shell";
import { Gate } from "@/components/dealer/gate";

/** The session is read per request, so the portal streams in behind Suspense; the rest of the page stays static. */
export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="col gut dp" />}>
      <Portal>{children}</Portal>
    </Suspense>
  );
}

async function Portal({ children }: { children: React.ReactNode }) {
  const dealer = await getDealerInfo();
  // "See the demo portal" is on unless DEMO_PORTAL=0. Turn it off before launch.
  if (!dealer) return <Gate demo={process.env.DEMO_PORTAL !== "0"} />;
  return <DealerShell dealer={dealer}>{children}</DealerShell>;
}
