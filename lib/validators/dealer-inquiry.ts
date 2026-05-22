import { z } from "zod";

export const inquiryStatusSchema = z.object({
  status: z.enum(["READ", "REPLIED", "VIEWING", "SOLD", "CLOSED", "NO_INTEREST"]),
  viewingDate: z.string().datetime().optional(),
  viewingResult: z.enum(["INTERESTED", "THINKING", "NO_INTEREST"]).optional(),
});

export const inquiryNoteSchema = z.object({
  note: z.string().max(500).optional(),
  priority: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
});

export const inquiryReplySchema = z.object({
  reply: z.string().min(1, "Odpověď je povinná"),
});

export const inquiryListQuerySchema = z.object({
  status: z.string().optional(),
  listingId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest", "priority"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
