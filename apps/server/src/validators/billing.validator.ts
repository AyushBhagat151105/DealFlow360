import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum(["CREDIT_CARD", "WIRE_TRANSFER", "CASH"]),
  reference: z.string().optional(),
});

export const modifySeatsSchema = z.object({
  newSeatCount: z.number().int().positive("Seats must be at least 1"),
});

