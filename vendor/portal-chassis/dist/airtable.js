// lib/airtable-client.ts
var BASE_URL = "https://api.airtable.com/v0";
function headers() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };
}
async function airtableGet(baseId, tableId, params) {
  const url = new URL(`${BASE_URL}/${baseId}/${tableId}`);
  if (params?.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
  if (params?.maxRecords) url.searchParams.set("maxRecords", String(params.maxRecords));
  params?.fields?.forEach((f) => url.searchParams.append("fields[]", f));
  params?.sort?.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction);
  });
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`airtableGet ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.records;
}
async function airtableGetOne(baseId, tableId, recordId) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, { headers: headers() });
  if (!res.ok) throw new Error(`airtableGetOne ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableCreate(baseId, tableId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableCreate ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableUpdate(baseId, tableId, recordId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableUpdate ${res.status}: ${await res.text()}`);
  return res.json();
}
async function airtableDelete(baseId, tableId, recordId) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, {
    method: "DELETE",
    headers: headers()
  });
  if (!res.ok) throw new Error(`airtableDelete ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { deleted: data.deleted };
}

export { airtableCreate, airtableDelete, airtableGet, airtableGetOne, airtableUpdate };
//# sourceMappingURL=airtable.js.map
//# sourceMappingURL=airtable.js.map