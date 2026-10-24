import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRecoveryHandlers,readRecoveryFragment,PASSWORD_RESET_URL} from '../lib/supabase/recovery.ts';
const token='a'.repeat(64),origin='https://training.evolu.ink';
function fixture(error:unknown=null){const calls:unknown[]=[];return {calls,...createRecoveryHandlers(async()=>({verifyOtp:async input=>{calls.push(input);return {error};},exchangeCodeForSession:async code=>{calls.push({code});return {error};}}))};}
test('email scanner GET requests never consume the recovery token',async()=>{
 const api=fixture(),response=await api.GET(new Request(origin+'/auth/confirm?token_hash='+token+'&type=recovery'));
 assert.equal(response.status,200);assert.equal(api.calls.length,0);assert.match(await response.text(),/method="post"/);assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(response.headers.get('cache-control')||'',/no-store/);
});
test('confirmation verifies a recovery token and only redirects to the password form',async()=>{
 const api=fixture(),response=await api.POST(new Request(origin+'/auth/confirm',{method:'POST',headers:{origin},body:new URLSearchParams({token_hash:token,type:'recovery',next:'https://attacker.invalid/'})}));
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),PASSWORD_RESET_URL);assert.deepEqual(api.calls,[{token_hash:token,type:'recovery'}]);
});
test('cross-site submissions cannot create recovery sessions',async()=>{
 const api=fixture(),response=await api.POST(new Request(origin+'/auth/confirm',{method:'POST',headers:{origin:'https://attacker.invalid'},body:new URLSearchParams({token_hash:token})}));assert.equal(response.status,403);assert.equal(api.calls.length,0);
});
test('expired tokens return to a helpful recovery message',async()=>{
 const api=fixture({code:'otp_expired'}),response=await api.POST(new Request(origin+'/auth/confirm',{method:'POST',headers:{origin},body:new URLSearchParams({token_hash:token})}));assert.equal(response.headers.get('location'),origin+'/acesso?erro=link');
});
test('invalid email links and token types do not echo executable content or reach Auth',async()=>{
 const api=fixture(),response=await api.GET(new Request(origin+'/auth/confirm?token_hash='+encodeURIComponent('"><script>alert(1)</script>')));assert.equal(response.status,400);assert.doesNotMatch(await response.text(),/<script>/);const wrong=await api.POST(new Request(origin+'/auth/confirm',{method:'POST',headers:{origin},body:new URLSearchParams({token_hash:token,type:'invite'})}));assert.equal(wrong.status,400);assert.equal(api.calls.length,0);
});
test('cross-device recovery fragments require a complete recovery session',()=>{
 assert.deepEqual(readRecoveryFragment('#access_token=test-token&refresh_token=test-refresh&type=recovery'),{accessToken:'test-token',refreshToken:'test-refresh'});assert.deepEqual(readRecoveryFragment('#access_token=test-token&type=recovery'),{error:true});assert.deepEqual(readRecoveryFragment('#access_token=test-token&refresh_token=test-refresh&type=signup'),{error:true});assert.deepEqual(readRecoveryFragment('#error=access_denied&error_code=otp_expired'),{error:true});assert.equal(readRecoveryFragment(''),null);
});
