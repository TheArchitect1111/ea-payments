interface AirtableRecord {
    id: string;
    createdTime: string;
    fields: Record<string, unknown>;
}
interface AirtableQueryParams {
    filterByFormula?: string;
    sort?: {
        field: string;
        direction: "asc" | "desc";
    }[];
    maxRecords?: number;
    fields?: string[];
}
declare function airtableGet(baseId: string, tableId: string, params?: AirtableQueryParams): Promise<AirtableRecord[]>;
declare function airtableGetOne(baseId: string, tableId: string, recordId: string): Promise<AirtableRecord>;
declare function airtableCreate(baseId: string, tableId: string, fields: Record<string, unknown>): Promise<AirtableRecord>;
declare function airtableUpdate(baseId: string, tableId: string, recordId: string, fields: Record<string, unknown>): Promise<AirtableRecord>;
declare function airtableDelete(baseId: string, tableId: string, recordId: string): Promise<{
    deleted: boolean;
}>;

export { type AirtableQueryParams, type AirtableRecord, airtableCreate, airtableDelete, airtableGet, airtableGetOne, airtableUpdate };
