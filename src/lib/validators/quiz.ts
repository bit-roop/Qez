import { z } from "zod";

const questionOptionSchema = z.object({
  optionKey: z.enum(["A", "B", "C", "D"]),
  optionText: z
    .string()
    .trim()
    .min(1, "Each option needs text before you can create the quiz.")
    .max(500, "Each option should stay under 500 characters.")
});

export const createQuizSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Quiz title should be at least 3 characters.")
      .max(150, "Quiz title should stay under 150 characters."),
    description: z
      .string()
      .trim()
      .max(1000, "Description should stay under 1000 characters.")
      .optional(),
    mode: z.enum(["ACADEMIC", "WEBINAR"]),
    startsAt: z.coerce.date({
      errorMap: () => ({ message: "Choose a valid start time." })
    }),
    endsAt: z.coerce.date({
      errorMap: () => ({ message: "Choose a valid end time." })
    }),
    allowLeaderboard: z.boolean().default(false),
    leaderboardVisibility: z.enum(["HIDDEN", "TOP_10", "FULL"]).default("HIDDEN"),
    showResultsToStudents: z.boolean().default(false),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    allowedParticipantEmails: z
      .array(z.string().trim().email("One of the participant emails is not valid."))
      .max(500, "You can add up to 500 participant emails.")
      .default([]),
    allowedEmailDomains: z
      .array(
        z
          .string()
          .trim()
          .min(3, "Each allowed email domain should be at least 3 characters.")
          .max(120, "Each allowed email domain should stay under 120 characters.")
          .transform((value) => value.replace(/^[@.]+/, "").toLowerCase())
      )
      .max(100, "You can add up to 100 allowed email domains.")
      .default([]),
    negativeMarking: z
      .number()
      .min(0, "Negative marking cannot be below 0.")
      .max(100, "Negative marking cannot be above 100.")
      .optional(),
    questions: z
      .array(
        z.object({
          prompt: z
            .string()
            .trim()
            .min(3, "Each question prompt should be at least 3 characters.")
            .max(1000, "Each question prompt should stay under 1000 characters."),
          explanation: z
            .string()
            .trim()
            .max(1500, "Explanation should stay under 1500 characters.")
            .optional(),
          difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
          timeLimitSeconds: z
            .number()
            .int()
            .min(5, "Each question needs at least 5 seconds.")
            .max(600, "Each question can be timed for up to 600 seconds."),
          displayOrder: z.number().int().min(1, "Question order must start from 1."),
          correctOptionKey: z.enum(["A", "B", "C", "D"]),
          options: z.array(questionOptionSchema).length(4)
        })
      )
      .min(1, "Add at least one question before creating the quiz.")
      .max(100, "A quiz can contain up to 100 questions.")
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
