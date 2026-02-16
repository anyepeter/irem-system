import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format"),
  address: z.string().default(""),
  role: z.enum(["CASHIER", "TECHNICIAN"], {
    message: "Role must be CASHIER or TECHNICIAN",
  }),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .min(9, "Phone number must be at least 9 digits")
    .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format"),
  address: z.string().min(1, "Address is required"),
  isVIP: z.boolean().default(false),
});

export const updateCustomerSchema = createCustomerSchema;

// Ticket schemas
export const createTicketSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  deviceType: z.string().min(1, "Device type is required"),
  brand: z.string().min(1, "Brand is required"),
  serialNumber: z.string().optional().default(""),
  issueDescription: z.string().min(10, "Please describe the issue in detail"),
  assignedToId: z.string().min(1, "Please assign a technician"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  expectedReturnDate: z.string().optional(),
  deliveryMethod: z.enum(["PICKUP", "HOME_DELIVERY"]),
  deliveryAddress: z.string().optional().default(""),
  deliveryFee: z.coerce.number().min(0).default(0),
});

export const diagnosticsSchema = z.object({
  diagnosticFindings: z.string().min(10, "Please provide diagnostic findings"),
  requiredParts: z.string().optional().default(""),
  laborCost: z.coerce.number().min(0, "Labor cost must be positive"),
  partsCost: z.coerce.number().min(0, "Parts cost must be positive"),
});

export const paymentSchema = z.object({
  amountPaid: z.coerce.number().min(0),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type DiagnosticsInput = z.infer<typeof diagnosticsSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
