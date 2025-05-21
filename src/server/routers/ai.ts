import { procedure, router } from "../trpc";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";

export const aiRouter = router({
  simplifyQuery: procedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input }) => {
      const { query } = input;
      const prompt = [
        `Simplify and beautify the following SQL query.`,
        `Remove comments, remove "public".`,
        `If it is a simple model with only selects from one table, you can even simplify table.column to column.`,
        `SQL Query:\n${query}`,
      ].join("\n");

      const [{ object }, { text: shortDescription }] = await Promise.all([
        generateObject({
          model: anthropic("claude-3-5-haiku-latest"),
          prompt,
          schema: z.object({
            simplifiedSql: z.string(),
          }),
        }),
        generateText({
          model: anthropic("claude-3-5-haiku-latest"),
          prompt: `${query}\n\nGive me a short description of this query in 5 words.`,
        }),
      ]);

      return {
        simplifiedSql: object.simplifiedSql,
        shortDescription: shortDescription,
      };
    }),
});
