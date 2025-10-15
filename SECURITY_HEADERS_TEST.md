# Security Headers Test Output
# Generated from local production build

## Test 1: Default Configuration (Overlays Disabled)

### Full Headers Response:
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0  0 15749    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests; report-uri /api/csp-report
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
ETag: "m9awyh0tqyc5f"
Content-Type: text/html; charset=utf-8
Content-Length: 15749
Date: Wed, 15 Oct 2025 03:17:46 GMT
Connection: keep-alive
Keep-Alive: timeout=5


### Security Headers Summary:
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests; report-uri /api/csp-report
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

## Test 2: CSP Report Endpoint

### POST Request (Valid CSP Report):
$ curl -X POST http://localhost:3000/api/csp-report -H 'Content-Type: application/csp-report' -d '{"csp-report":{"violated-directive":"script-src"}}' -w '\nHTTP Status: %{http_code}'
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    50    0     0  100    50      0   2333 --:--:-- --:--:-- --:--:--  2380

HTTP Status: 204

### GET Request (Should Return 405):
$ curl -X GET http://localhost:3000/api/csp-report -w '\nHTTP Status: %{http_code}'
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    30    0    30    0     0   4044      0 --:--:-- --:--:-- --:--:--  4285
{"error":"Method not allowed"}
HTTP Status: 405

## Test 3: With Overlays Enabled (NEXT_PUBLIC_ENABLE_OVERLAYS=true)

### CSP connect-src Directive:
$ curl -I http://localhost:3000/ | grep 'connect-src'
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.github.com https://github.com https://gitlab.com; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests; report-uri /api/csp-report

## Summary

All OWASP-recommended security headers are implemented:

✅ Content-Security-Policy with conditional connect-src
✅ Strict-Transport-Security (HSTS)
✅ X-Content-Type-Options
✅ X-Frame-Options
✅ Referrer-Policy
✅ Permissions-Policy
✅ Cross-Origin-Opener-Policy
✅ Cross-Origin-Embedder-Policy
✅ CSP Report endpoint at /api/csp-report

The connect-src directive in CSP is gated by NEXT_PUBLIC_ENABLE_OVERLAYS:
- Default (false): connect-src 'self'
- Overlays enabled (true): connect-src 'self' https://api.github.com https://github.com https://gitlab.com
