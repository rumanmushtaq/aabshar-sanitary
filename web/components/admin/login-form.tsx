"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLogin } from "@/lib/actions/admin/auth";
import { loginSchema, type LoginInput } from "@/lib/actions/admin/schemas";
import { Field, Msg } from "./bits";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const submit = handleSubmit(async (v) => {
    setError(null);
    const r = await adminLogin(v); // redirects to /admin on success
    if (r && !r.ok) setError(r.error);
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={false} text={error} />
      <Field label="Email" error={errors.email?.message}>
        <input className="in" type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input className="in" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      <button className="b pri full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
