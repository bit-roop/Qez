import { z } from "zod";

export const attemptSubmissionSchema = z.object({
  quizId: z.string().trim().min(1, "Quiz id is missing."),
  responses: z
    .array(
      z.object({
        questionId: z.string().trim().min(1, "A question id is missing."),
        selectedOptionKey: z.enum(["A", "B", "C", "D"]),
        timeTakenSeconds: z
          .number()
          .int()
          .min(0, "Response time cannot be negative.")
          .max(3600, "Response time looks too large.")
      })
    )
});
