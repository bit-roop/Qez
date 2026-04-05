import { z } from "zod";

export const attemptSubmissionSchema = z.object({
  quizId: z.string().trim().min(1),
  responses: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        selectedOptionKey: z.enum(["A", "B", "C", "D"]),
        timeTakenSeconds: z.number().int().min(0).max(3600)
      })
    )
    .min(1)
});

