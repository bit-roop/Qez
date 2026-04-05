import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name should be at least 2 characters.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long."),
  role: z.enum(["STUDENT", "TEACHER", "WEBINAR_HOST"])
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.")
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32, "This reset link looks invalid.").max(256),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long.")
});
