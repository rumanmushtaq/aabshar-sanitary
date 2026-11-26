import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="login">
      <div className="card">
        <div className="eb">Aabshar · staff</div>
        <h1>Sign in</h1>
        <p className="muted" style={{ margin: "0 0 16px" }}>Orders, products, dealers and settings.</p>
        <LoginForm />
      </div>
    </div>
  );
}
