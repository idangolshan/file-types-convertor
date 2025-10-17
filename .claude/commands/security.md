---
description: Perform a comprehensive security review of the codebase
argument-hint: [optional: specific file or directory path]
---

Perform a comprehensive security review of this codebase. Focus on defensive security practices only.

## Security Review Scope

Analyze the following areas:

### 1. Input Validation & Sanitization
- Check all user input points (file uploads, form inputs, URL parameters)
- Verify proper validation and sanitization
- Look for potential injection vulnerabilities (XSS, SQL injection, command injection)

### 2. Authentication & Authorization
- Review authentication mechanisms
- Check for proper session management
- Verify authorization checks are in place
- Look for privilege escalation vulnerabilities

### 3. Data Protection
- Check for sensitive data exposure (API keys, tokens, credentials)
- Verify encryption for sensitive data in transit and at rest
- Review environment variable usage
- Check for hardcoded secrets

### 4. API Security
- Review API endpoint security
- Check for proper CORS configuration
- Verify rate limiting and input validation
- Look for API abuse vulnerabilities

### 5. Dependency Security
- Review package.json for known vulnerabilities
- Check for outdated dependencies
- Identify packages with security advisories

### 6. Client-Side Security
- Check for XSS vulnerabilities
- Review DOM manipulation for security issues
- Verify proper Content Security Policy (if applicable)
- Check for insecure data storage (localStorage, sessionStorage)

### 7. File Handling Security
- Review file upload mechanisms
- Check file type validation
- Verify file size limits
- Look for path traversal vulnerabilities

### 8. Error Handling
- Check for information leakage in error messages
- Verify proper error handling without exposing stack traces
- Review logging for sensitive data exposure

## Review Process

$ARGUMENTS

1. Search the codebase systematically for security issues
2. Prioritize findings by severity (Critical, High, Medium, Low)
3. Provide specific code locations with file:line references
4. Suggest concrete fixes for each issue found
5. Highlight security best practices that are well-implemented

## Output Format

Provide the security review in the following format:

### Executive Summary
- Overall security posture
- Number of issues by severity
- Key recommendations

### Detailed Findings

For each issue:
- **Severity**: Critical/High/Medium/Low
- **Location**: file_path:line_number
- **Issue**: Description of the vulnerability
- **Impact**: Potential security impact
- **Recommendation**: Specific fix or mitigation
- **Code Example**: Show vulnerable code and secure alternative

### Positive Findings
- Security features implemented well
- Best practices followed

### Recommendations
- Prioritized action items
- Security improvements for future development

IMPORTANT: Only focus on defensive security. Do not provide guidance on offensive security techniques or malicious code development.
