import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/lib/data/loadPublished.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module = {exports:{}};
new Function('require','module','exports',compiled)(name => {
  assert.equal(name,'../paths'); return {withBase: value => '/atlas/'+value};
},module,module.exports);
const {loadPublishedSources,loadPublishedPorts} = module.exports;
const originalFetch = globalThis.fetch;
try {
 let requests=0;let resolve;
 globalThis.fetch = url => {requests++;assert.equal(url,'/atlas/data/sources.json');return new Promise(r=>resolve=r);};
 const a=loadPublishedSources();const b=loadPublishedSources();
 assert.equal(requests,1,'concurrent consumers share a network request');
 resolve({ok:true,json:async()=>({sources:[]})});
 assert.deepEqual(await a,await b);
 await loadPublishedSources();assert.equal(requests,1,'completed artifact stays shared');
 let attempts=0;
 globalThis.fetch=async()=>{attempts++;return attempts===1?{ok:false}:{ok:true,json:async()=>({features:[]})};};
 await assert.rejects(loadPublishedPorts(),/Unable to load/);
 assert.deepEqual(await loadPublishedPorts(),{features:[]});
 assert.equal(attempts,2,'failed requests must be retryable');
 console.log('Published loader: concurrent deduplication, session reuse and failure retry passed.');
} finally {globalThis.fetch=originalFetch;}
