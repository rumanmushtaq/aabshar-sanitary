import { DealerShell } from "@/components/dealer/shell";

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return <DealerShell>{children}</DealerShell>;
}
