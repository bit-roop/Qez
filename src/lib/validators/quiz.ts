import { z } from "zod";

const questionOptionSchema = z.object({
  optionKey: z.enum(["A", "B", "C", "D"]),
  optionText: z.string().trim().min(1).max(500)
});

export const createQuizSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(1000).optional(),
    mode: z.enum(["ACADEMIC", "WEBINAR"]),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    allowLeaderboard: z.boolean().default(false),
    leaderboardVisibility: z.enum(["HIDDEN", "TOP_10", "FULL"]).default("HIDDEN"),
    showResultsToStudents: z.boolean().default(false),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    allowedParticipantEmails: z.array(z.string().trim().email()).max(500).default([]),
    allowedEmailDomains: z
      .array(
        z
          .string()
          .trim()
          .min(3)
          .max(120)
          .transform((value) => value.replace(/^[@.]+/, "").toLowerCase())
      )
      .max(100)
      .default([]),
    negativeMarking: z.number().min(0).max(100).optional(),
    questions: z
      .array(
        z.object({
          prompt: z.string().trim().min(3).max(1000),
          explanation: z.string().trim().max(1500).optional(),
          difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
          timeLimitSeconds: z.number().int().min(5).max(600),
          displayOrder: z.number().int().min(1),
          correctOptionKey: z.enum(["A", "B", "C", "D"]),
          options: z.array(questionOptionSchema).length(4)
        })
      )
      .min(1)
      .max(100)
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Quiz end time must be after start time.",
    path: ["endsAt"]
  })
  .refine((value) => {
    const displayOrders = value.questions.map((question) => question.displayOrder);
    return new Set(displayOrders).size === displayOrders.length;
  }, {
    message: "Each question must have a unique display order.",
    path: ["questions"]
  })
  .refine((value) => {
    return value.questions.every((question) => {
      const optionKeys = question.options.map((option) => option.optionKey);
      return new Set(optionKeys).size === 4;
    });
  }, {
    message: "Each question must contain one unique option for A, B, C, and D.",
    path: ["questions"]
  })
  .refine((value) => {
    return value.questions.every((question) =>
      question.options.some((option) => option.optionKey === question.correctOptionKey)
    );
  }, {
    message: "Each question must have a correct option that matches one of its options.",
    path: ["questions"]
  })
  .refine((value) => {
    return new Set(value.allowedParticipantEmails.map((email) => email.toLowerCase())).size === value.allowedParticipantEmails.length;
  }, {
    message: "Allowed participant emails must be unique.",
    path: ["allowedParticipantEmails"]
  })
  .refine((value) => {
    return new Set(value.allowedEmailDomains).size === value.allowedEmailDomains.length;
  }, {
    message: "Allowed email domains must be unique.",
    path: ["allowedEmailDomains"]
  });
