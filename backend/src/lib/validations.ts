import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  industry: z.string().optional(),
});

export const ContactSchema = z.object({
  companyId: z.string().uuid("Invalid company ID").optional(),
  companyName: z.string().optional(),
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  statusId: z.string().uuid("Invalid status ID").optional().or(z.literal("")),
  followUpDate: z.string().datetime().optional().or(z.literal("")),
  type: z.enum(["COLD", "WARM"]).default("COLD"),
});

export const DealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  companyId: z.string().uuid("Invalid company ID").optional(),
  contactId: z.string().uuid("Invalid contact ID").optional(),
  value: z.number().min(0, "Value must be positive").optional(),
  pipelineId: z.string().uuid("Invalid pipeline ID").optional().or(z.literal("")),
  stageId: z.string().uuid("Invalid stage ID").optional().or(z.literal("")),
});

export const ActivitySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  entityType: z.enum(["CONTACT", "COMPANY", "DEAL"]),
  entityId: z.string().uuid("Invalid entity ID"),
  type: z.enum(["NOTE", "CALL", "TASK"]),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
});
