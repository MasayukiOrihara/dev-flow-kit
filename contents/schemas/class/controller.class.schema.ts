import { z } from "zod";

export const ControllerSummarySchema = z.object({
  fileInfo: z.object({
    directory: z.string().nullable(), // 不明なら null
    fileName: z.string(),
    overview: z.string().nullable(),
  }),
  classes: z.array(
    z.object({
      className: z.string(),
      endpointRoute: z.string().nullable(),
      remarks: z.array(z.string()).default([]),
    }),
  ),
  constructors: z.array(
    z.object({
      no: z.number(),
      process: z.string().nullable(),
      remarks: z.array(z.string()).default([]),
    }),
  ),
  methods: z.array(
    z.object({
      no: z.number(),
      accessModifier: z.enum(["public", "private", "protected", "unknown"]),
      name: z.string(),
      decorators: z.array(z.string()).default([]),
      request: z.array(z.string()).default([]),
      response: z.array(z.string()).default([]),
      summary: z.string().nullable(),
      normalFlow: z.array(z.string()).default([]),
      errorFlow: z.array(z.string()).default([]),
      notes: z.array(z.string()).default([]),
    }),
  ),
});

export type ControllerSummary = z.infer<typeof ControllerSummarySchema>;
