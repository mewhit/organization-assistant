import { type NewOrganizationRecord, type OrganizationRecord } from "../../db/schemas/organizations.schema";

export type Organization = OrganizationRecord;

export type CreatableOrganization = Omit<NewOrganizationRecord, "slug">;

export type UpdatableOrganization = Partial<NewOrganizationRecord>;
