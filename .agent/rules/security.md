---
trigger: always_on
---

# Enterprise Security Rules

> These rules define MANDATORY security standards. All code MUST comply. Violations put enterprise data at risk.

---

## 1. Authentication & Authorization

### Password Security
- Minimum 12 characters with complexity (uppercase, lowercase, numbers, special chars)
- Use `bcrypt` (12+ rounds) or `argon2` for hashing
- **Never store plaintext passwords**

### Multi-Factor Authentication
- MFA must be available for all accounts
- MFA mandatory for admin/privileged accounts
- Support TOTP via authenticator apps

### Session Management
- Use cryptographically secure tokens (256+ bits entropy)
- Max 8 hours active session, 30 minutes idle timeout
- Invalidate sessions on logout, password change, security events

### JWT Security
- Use RS256/ES256 (asymmetric) or HS256 minimum
- **Never use `none` algorithm**
- Access tokens: 15-30 min, Refresh tokens: 7-30 days
- Validate issuer, audience, and expiration on every request

### Role-Based Access Control
- Implement principle of least privilege
- Validate permissions server-side on every request
- **Never trust client-side role checks alone**
- Log all privilege escalation attempts

---

## 2. Data Protection & Encryption

### Encryption at Rest
- Encrypt all sensitive data using AES-256-GCM
- Store encryption keys separately from data
- Implement key rotation procedures

**Sensitive data includes:** PII, financial data, credentials, API keys, business-critical data

### Encryption in Transit
- TLS 1.2 minimum, TLS 1.3 preferred
- Enforce HTTPS for all endpoints
- Enable HSTS

### Database Security
- **Use parameterized queries only** - prevent SQL injection
- Apply minimum required database user privileges
- Enable transparent data encryption

### Sensitive Data Handling
- Encrypt sensitive fields before storage
- Mask sensitive data in logs and UI (e.g., `****-****-****-1234`)
- **Never log passwords, tokens, or secrets**

---

## 3. API Security

### Input Validation
- Validate ALL inputs server-side
- Use strict schema validation (Zod, Joi, etc.)
- Whitelist allowed values, don't blacklist
- Sanitize outputs to prevent XSS

### Rate Limiting
- Apply rate limiting on all endpoints
- Stricter limits for auth endpoints (5 attempts/15 min)
- Return 429 with Retry-After header

### CORS & Headers
- Configure strict CORS with allowed origins whitelist
- Implement security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options

### Error Handling
- Log full errors internally
- Return sanitized errors to clients
- **Never expose stack traces or internal details**

---

## 4. Desktop Application Security (Electron)

### Mandatory Settings
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`

### Secure IPC
- Expose only whitelisted, validated APIs via contextBridge
- **Never expose ipcRenderer directly**
- Validate all IPC inputs and sender origin

### Navigation Security
- Block navigation to untrusted URLs
- Open external links in default browser
- Use system keychain for credential storage

---

## 5. Code Security Practices

### No Secrets in Code
- Use environment variables for all secrets
- Validate required env vars at startup
- Use `.env.example` for documentation

### Git Security
- Never commit secrets to version control
- Use `.gitignore` for sensitive files
- Scan for secrets before committing

### Secure Error Handling
- Log errors with context internally
- Return generic messages to clients
- Never expose internal implementation details

---

## 6. Dependency Security

### Vulnerability Management
- Run `pnpm audit` weekly minimum
- Fix vulnerabilities promptly
- Review new dependencies before adding

### Dependency Rules
- Lock versions in production
- Use exact versions for security packages
- Monitor for compromised packages
- Use lockfiles consistently

---

## 7. Logging & Audit

### Security Event Logging
**Must log:** Auth attempts, auth failures, password changes, admin actions, sensitive data access, API errors

**Never log:** Passwords, full card numbers, SSN, tokens, API keys, secrets

### Audit Trail
- Log: timestamp, userId, action, resource, IP, userAgent, status
- Encrypt sensitive log data
- Restrict log access to authorized personnel
- Implement retention policies

---

## 8. Infrastructure Security

### Container Security
- Run as non-root user
- Use multi-stage builds
- Don't expose unnecessary ports
- Use internal networks for databases

### Environment Separation
- Separate dev, staging, production environments
- Use different credentials per environment
- Never use production data in development

---

## 9. Incident Response

### Required Capabilities
- Session invalidation (revoke all sessions)
- Account lockdown (immediate suspension)
- Key rotation (rotate all secrets if compromised)
- Quick audit log access

---

## 10. Compliance Checklist

**Authentication:**
- [ ] Strong password policy
- [ ] MFA available
- [ ] Secure session management
- [ ] JWT configured securely

**Data Protection:**
- [ ] Sensitive data encrypted at rest
- [ ] TLS enforced
- [ ] No sensitive data in logs
- [ ] Data masking implemented

**API Security:**
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers in place

**Code Security:**
- [ ] No secrets in code
- [ ] Dependencies audited
- [ ] Error handling sanitized
- [ ] Parameterized queries used

---

## Core Principles

1. 🔒 **Defense in Depth** - Multiple security layers
2. 🔑 **Least Privilege** - Minimum required access
3. 🛡️ **Secure by Default** - Secure configurations out of the box
4. 📝 **Audit Everything** - Complete audit trail
5. 🚨 **Fail Securely** - Errors must not expose vulnerabilities
