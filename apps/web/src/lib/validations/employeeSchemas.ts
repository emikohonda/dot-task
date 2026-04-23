// apps/web/src/lib/validations/employeeSchemas.ts
import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().trim().min(1, "氏名は必須です"),
  phone: z.string().optional(),
  email: z
    .string()
    .trim()
    .email("メールアドレスの形式が正しくありません")
    .or(z.literal(""))
    .optional(),
  role: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

type EmployeeSource = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
};

export function fromEmployeeToFormValues(
  employee: EmployeeSource | null | undefined
): EmployeeFormValues {
  return {
    name: employee?.name ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    role: employee?.role ?? "",
  };
}

export function toEmployeePayload(values: EmployeeFormValues) {
  const payload: Record<string, string> = {
    name: values.name.trim(),
  };

  if (values.phone?.trim()) payload.phone = values.phone.trim();
  if (values.email?.trim()) payload.email = values.email.trim();
  if (values.role?.trim()) payload.role = values.role.trim();

  return payload;
}