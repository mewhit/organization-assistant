import { type NewUserRecord, type UserRecord } from "../../db/schemas/users.schema";

export type User = UserRecord;

export type CreatableUser = NewUserRecord;

export type UpdatableUser = Partial<NewUserRecord>;
