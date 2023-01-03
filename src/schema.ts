import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required.",
      invalid_type_error: "Email must be a string.",
    })
    .email({
      message: "Email must be a valid email address.",
    }),
  password: z
    .string({
      required_error: "Password is required.",
    })
    .min(8),
});

export const signupSchema = z.object({
  email: z
    .string({
      required_error: "Email is required.",
      invalid_type_error: "Email must be a string.",
    })
    .email({
      message: "Email must be a valid email address.",
    }),
  password: z
    .string({
      required_error: "Password is required.",
    })
    .min(8),
  name: z
    .string({
      required_error: "Name is required.",
    })
    .min(1),
});
