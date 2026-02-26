import { type NewOrganizationRecord, type OrganizationRecord } from "../../db/schemas/organizations.schema";

export type Organization = OrganizationRecord;

export type CreatableOrganization = NewOrganizationRecord;

export type UpdatableOrganization = Partial<NewOrganizationRecord>;
