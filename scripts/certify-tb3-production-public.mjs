import assert from 'node:assert/strict';

const base = 'https://tb3.online';
const checks=[];
const failures=[];

async function request(path, options={}) {
  const url=path.startsWith('https:')?path:base+path;
  const res=await fetch(url, {
    redirect:'manual',
    headers:{'User-Agent':'TB3 Production Release Verifier/1.0',...options.headers},
    signal:AbortSignal.timeout(18000),
    ...options
  });
  return {res,body:options.method==='HEAD'?'':await res.text(),url};
}

async function check(name,task) {
  try {await task();checks.push(name);console.log('PASS '+name);}
  catch(error){failures.push({name,error:String(error)});console.error('FAIL '+name+' '+error);}
}
function assertStatus(result, statuses) {
  assert.ok(statuses.includes(result.res.status),result.url+' returned '+result.res.status+' (expected '+statuses.join(','))+': '+result.body.slice(0,200));
}

await check('root redirects or renders TB3 brand',async()=>{
  const a=await request('/');
  if ([301,302,307,308].includes(a.res.status)) {
    const target=a.res.headers.get('location')||'';
    assert.ok(target.startsWith('/tarris')||target.startsWith('https://tb3.online/tarris'), 'Unexpected home redirect '+target);
  } else {
    assertStatus(a,[200]);
    assert.match(a.body,/TB3|Tarris|MORE THAN/);
  }
});
await check('public TB3 page returns complete brand',async()=>{
  const a=await request('/tarris');assertStatus(a,[200]);
  for (const word of ['public-tarris','ENTER TB3 HQ','WEAR THE VISION','Ask about this item']) assert.ok(a.body.includes(word),'Missing '+word);
});
await check('14 product cards and direct inquiry links in public render',async()=>{
  const a=await request('/tarris');assertStatus(a,[200]);
  const matches=[...a.body.matchAll(/data-product-id="/g)];
  assert.equal(matches.length,14,'Expected 14 items, found '+matches.length);
  assert.ok(a.body.includes('type=merch')&&a.body.includes('product='),'Item-specific inquiry link missing');
  assert.ok(a.body.includes('Online orders will open after payment and fulfillment approval'),'Payment safety message missing');
});
await check('merch inquiry route responds with form',async()=>{
  const a=await request('/tarris/book?type=merch');assertStatus(a,[200]);
  assert.ok(a.body.includes('book-tarris-form')||a.body.includes('Submit Inquiry'),'Inquiry form missing');
});
await check('public partnership booking route returns form',async()=>{
  const a=await request('/tarris/book');assertStatus(a,[200]);
  assert.ok(a.body.includes('Submit Inquiry'),'Booking form missing');
});
await check('signed-out HQ is gated by login redirect',async()=>{
  const a=await request('/tarris/future');
  assertStatus(a,[301,302,307,308]);
  const target=new URL(a.res.headers.get('location')||'',base);
  assert.equal(target.pathname,'/portal/login','Wrong HQ login destination: '+target.href);
  assert.equal(target.searchParams.get('next'),'/tarris/future');
});
await check('canonical /hq is wired to TB3 HQ or private login',async()=>{
  const a=await request('/hq'); assertStatus(a,[301,302,307,308]);
  const target=new URL(a.res.headers.get('location')||'',base);
  assert.ok(['/tarris/future','/portal/login'].includes(target.pathname),'Unexpected HQ destination '+target.href);
});
await check('anonymous workspace API is protected',async()=>{
  const a=await request('/api/tarris/workspace');assertStatus(a,[401,403]);
});
await check('unapproved merchandise checkout is not available',async()=>{
  const a=await request('/api/tb3/merch/checkout');assertStatus(a,[404,405,503]);
  assert.ok(!a.body.includes('"available":true'),'Checkout was enabled');
});
await check('media files respond with valid media content type',async()=>{
  for(const path of ['/videos/tb3-film/TB3-FILM-003-DRIVE-FINISH-HD.mp4','/videos/tb3-film/TB3-FILM-004-DEFENSE-BATTLE-HD.mp4','/videos/tb3-film/TB3-FILM-005-SCOREBOARD-PROOF.jpg']){
    const x=await request(path,{method:'HEAD'});assertStatus(x,[200]);
    assert.match(x.res.headers.get('content-type')||'',/^(video|image)\//);
  }
});
await check('store artwork accessible',async()=>{
  for (const path of ['/tb3/merch/MOCK_TEE_SHORT_RED.jpg','/tb3/merch/collage-sig-black.jpg']){
    const x=await request(path,{method:'HEAD'});assertStatus(x,[200]);
    assert.match(x.res.headers.get('content-type')||'',/^image\//);
  }
});
await check('www redirects permanently to apex',async()=>{
  const x=await request('https://www.tb3.online/tarris');assertStatus(x,[301,308]);
  const target=new URL(x.res.headers.get('location')||'',base);
  assert.equal(target.hostname,'tb3.online');assert.equal(target.pathname,'/tarris');
});

console.log('\nTB3 Production public certification: '+checks.length+' PASS; '+failures.length+' FAIL');
if(failures.length){for (const x of failures)console.error(x.name+': '+x.error);process.exitCode=1;}
