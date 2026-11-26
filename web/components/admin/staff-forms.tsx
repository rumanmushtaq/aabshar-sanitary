"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addUser } from "@/lib/actions/admin/staff";
import { changeOwnPassword } from "@/lib/actions/admin/auth";
import { passwordSchema, userSchema, type PasswordInput, type UserInput } from "@/lib/actions/admin/schemas";
import { Field, Msg } from "./bits";

type M = { ok: boolean; text: string } | null;

export function AddUserForm() {
  const [msg, setMsg] = useState<M>(null);
  const blank: UserInput = { email: "", name: "", role: "staff", password: "" };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserInput>({ resolver: zodResolver(userSchema), defaultValues: blank });
  const submit = handleSubmit(async (v) => {
    setMsg(null);
    const r = await addUser(v);
    setMsg(r.ok ? { ok: true, text: r.msg ?? "Added." } : { ok: false, text: r.error });
    if (r.ok) reset(blank);
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <Field label="Name" error={errors.name?.message}><input className="in" autoComplete="off" {...register("name")} /></Field>
      <Field label="Email" error={errors.email?.message}><input className="in" type="email" autoComplete="off" {...register("email")} /></Field>
      <Field label="Role" error={errors.role?.message}>
        <select className="in" {...register("role")}><option value="staff">Staff</option><option value="admin">Admin</option></select>
      </Field>
      <Field label="Temporary password" hint="At least 10 characters. They can change it under My account." error={errors.password?.message}>
        <input className="in" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <div className="factions"><button className="b pri" type="submit" disabled={isSubmitting}>Add user</button></div>
    </form>
  );
}

export function PasswordForm() {
  const [msg, setMsg] = useState<M>(null);
  const blank: PasswordInput = { current: "", next: "", confirm: "" };
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema), defaultValues: blank });
  const submit = handleSubmit(async (v) => {
    setMsg(null);
    const r = await changeOwnPassword(v);
    setMsg(r.ok ? { ok: true, text: r.msg ?? "Changed." } : { ok: false, text: r.error });
    if (r.ok) reset(blank);
  });
  return (
    <form className="f" onSubmit={submit} noValidate>
      <Msg ok={msg?.ok ?? true} text={msg?.text} />
      <Field label="Current password" error={errors.current?.message}><input className="in" type="password" autoComplete="current-password" {...register("current")} /></Field>
      <Field label="New password" hint="At least 10 characters" error={errors.next?.message}><input className="in" type="password" autoComplete="new-password" {...register("next")} /></Field>
      <Field label="Repeat new password" error={errors.confirm?.message}><input className="in" type="password" autoComplete="new-password" {...register("confirm")} /></Field>
      <div className="factions"><button className="b pri" type="submit" disabled={isSubmitting}>Change password</button></div>
    </form>
  );
}
