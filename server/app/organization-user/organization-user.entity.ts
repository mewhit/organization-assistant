import { type NewOrganizationUserRecord, type OrganizationUserRecord } from "../../db/schemas/organization-users.schema";

export type OrganizationUser = OrganizationUserRecord;

export type CreatableOrganizationUser = NewOrganizationUserRecord;

export type UpdatableOrganizationUser = Partial<NewOrganizationUserRecord>;
