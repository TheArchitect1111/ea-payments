#!/usr/bin/env python3
"""Restore an EA Airtable recovery export into provider-neutral SQLite.

This is a disaster-recovery verifier, not an Airtable emulator. It preserves every
record ID and every field value in a queryable SQLite database using Airtable
field IDs as stable columns. Complex Airtable values are stored as JSON text.

Usage:
  python3 scripts/restore-airtable-recovery.py .recovery/airtable .recovery/ea-recovery.sqlite
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import sys
from pathlib import Path


def q(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def scalar(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def main() -> int:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else '.recovery/airtable')
    target = Path(sys.argv[2] if len(sys.argv) > 2 else '.recovery/ea-recovery.sqlite')
    manifest_path = source / 'manifest.json'
    if not manifest_path.exists():
        raise SystemExit(f'FAIL: missing {manifest_path}')

    manifest = json.loads(manifest_path.read_text())
    if manifest.get('format') != 'ea-airtable-recovery-v1':
        raise SystemExit('FAIL: unsupported recovery format')

    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        target.unlink()

    db = sqlite3.connect(target)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('PRAGMA foreign_keys=OFF')
    db.execute('CREATE TABLE _ea_recovery_manifest (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    for key in ('format', 'baseId', 'generatedAt', 'tableCount', 'recordCount'):
        db.execute('INSERT INTO _ea_recovery_manifest(key,value) VALUES (?,?)', (key, str(manifest.get(key, ''))))
    db.execute('CREATE TABLE _ea_table_map (table_id TEXT PRIMARY KEY, table_name TEXT NOT NULL, record_count INTEGER NOT NULL, source_sha256 TEXT NOT NULL)')

    restored = 0
    for entry in manifest.get('tables', []):
        p = source / entry['file']
        body = p.read_bytes()
        digest = hashlib.sha256(body).hexdigest()
        if digest != entry['sha256']:
            raise SystemExit(f"FAIL: checksum mismatch for {entry['file']}")
        payload = json.loads(body)
        table = payload['table']
        fields = table.get('fields', [])
        table_id = table['id']

        cols = ['_record_id TEXT PRIMARY KEY', '_created_time TEXT']
        for field in fields:
            cols.append(f'{q(field["id"])} TEXT')
        db.execute(f'CREATE TABLE {q(table_id)} ({", ".join(cols)})')

        field_ids = [f['id'] for f in fields]
        placeholders = ','.join('?' for _ in range(2 + len(field_ids)))
        insert_cols = ['_record_id', '_created_time'] + field_ids
        sql = f'INSERT INTO {q(table_id)} ({",".join(q(c) for c in insert_cols)}) VALUES ({placeholders})'
        for rec in payload.get('records', []):
            values = [rec['id'], rec.get('createdTime')]
            rec_fields = rec.get('fields', {})
            values.extend(scalar(rec_fields.get(fid)) for fid in field_ids)
            db.execute(sql, values)
            restored += 1

        db.execute('INSERT INTO _ea_table_map(table_id,table_name,record_count,source_sha256) VALUES (?,?,?,?)',
                   (table_id, table.get('name', table_id), len(payload.get('records', [])), digest))

    db.commit()

    actual_tables = db.execute("SELECT COUNT(*) FROM _ea_table_map").fetchone()[0]
    actual_records = sum(r[0] for r in db.execute('SELECT record_count FROM _ea_table_map').fetchall())
    expected_tables = int(manifest.get('tableCount', -1))
    expected_records = int(manifest.get('recordCount', -1))
    if actual_tables != expected_tables or actual_records != expected_records or restored != expected_records:
        raise SystemExit(f'FAIL: restore counts differ expected tables={expected_tables} records={expected_records}; got tables={actual_tables} records={actual_records}')

    integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
    if integrity != 'ok':
        raise SystemExit(f'FAIL: SQLite integrity_check={integrity}')

    db.close()
    print(f'PASS: restored {actual_tables} tables / {actual_records} records into {target}')
    print('PASS: checksums, record counts, and SQLite integrity verified')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
