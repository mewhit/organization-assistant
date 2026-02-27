import { type NewOrganizationLlmRecord, type OrganizationLlmRecord } from "../../db/schemas/organization-llms.schema";

export type OrganizationLlm = OrganizationLlmRecord;

export type CreatableOrganizationLlm = NewOrganizationLlmRecord;

export type UpdatableOrganizationLlm = Partial<NewOrganizationLlmRecord>;
