import { type NewOrganizationContextRecord, type OrganizationContextRecord } from "../../db/schemas/organization-contexts.schema";

export type OrganizationContext = OrganizationContextRecord;

export type CreatableOrganizationContext = NewOrganizationContextRecord;

export type UpdatableOrganizationContext = Partial<NewOrganizationContextRecord>;
