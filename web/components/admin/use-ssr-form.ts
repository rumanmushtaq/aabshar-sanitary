"use client";

import { get, useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";

/**
 * useForm whose register() also sets defaultValue / defaultChecked from defaultValues, so edit forms
 * show the saved values in the server HTML instead of blank fields until the page script loads.
 * Array fields (checkbox groups) are left to the caller.
 */
export function useSsrForm<T extends FieldValues>(props: UseFormProps<T>): UseFormReturn<T> {
  const form = useForm<T>(props);
  const dv = props.defaultValues as Record<string, unknown> | undefined;
  const register: UseFormReturn<T>["register"] = (name, opts) => {
    const r = form.register(name, opts);
    const v: unknown = dv ? get(dv, name) : undefined;
    if (typeof v === "boolean") return { ...r, defaultChecked: v } as typeof r;
    if (v == null || Array.isArray(v) || typeof v === "object") return r;
    return { ...r, defaultValue: v } as typeof r;
  };
  return { ...form, register };
}
