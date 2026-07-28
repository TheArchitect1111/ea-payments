#!/usr/bin/env node
let s = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  s += chunk;
});
process.stdin.on('end', () => {
  const text = s.trim();
  if (/sk_test_/.test(text)) {
    console.log(JSON.stringify({ mode: 'test', present: true }));
    return;
  }
  if (/sk_live_/.test(text)) {
    console.log(JSON.stringify({ mode: 'live', present: true }));
    return;
  }
  if (!text || /Error|not found|Restricted|403|401/i.test(text)) {
    console.log(
      JSON.stringify({
        mode: 'unavailable',
        present: false,
        hint: text.slice(0, 120).replace(/sk_(live|test)_[A-Za-z0-9]+/g, 'sk_$1_[REDACTED]'),
      }),
    );
    return;
  }
  console.log(JSON.stringify({ mode: 'unknown', present: text.length > 10 }));
});
