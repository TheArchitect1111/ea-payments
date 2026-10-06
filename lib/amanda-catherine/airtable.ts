type AirtableRecord = { fields: Record<string, any> };

function getEnv(){
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if(!baseId || !apiKey) throw new Error('Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY');
  return { baseId, apiKey };
}

export async function createRecord(tableName: string, fields: Record<string, any>){
  const { baseId, apiKey } = getEnv();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
    cache: 'no-store'
  });
  const json = await res.json();
  if(!res.ok){
    console.error('[airtable create failed]', tableName, json);
    throw new Error(json?.error?.message || `Airtable create failed: ${tableName}`);
  }
  return json;
}

export async function listTablesSchema(){
  const { baseId, apiKey } = getEnv();
  // Meta API to list tables
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    cache: 'no-store'
  });
  const json = await res.json();
  if(!res.ok) throw new Error(JSON.stringify(json));
  return json;
}
