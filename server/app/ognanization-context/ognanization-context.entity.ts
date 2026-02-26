import { type NewOgnanizationContextRecord, type OgnanizationContextRecord } from "../../db/schemas/ognanization-contexts.schema";

export type OgnanizationContext = OgnanizationContextRecord;

export type CreatableOgnanizationContext = NewOgnanizationContextRecord;

export type UpdatableOgnanizationContext = Partial<NewOgnanizationContextRecord>;
