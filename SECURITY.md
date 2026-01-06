# Security Policy

## Supported Versions

The following versions of **@rbac/rbac** receive security updates and fixes. Only actively maintained releases will be patched in the event of a confirmed security issue.

| Version | Supported |
| ------- | --------- |
| 2.1.x   | yes       |
| 2.0.x   | limited   |
| < 2.0   | no        |

- **2.1.x** is the current latest release on npm and is actively published. :contentReference[oaicite:1]{index=1}  
- **2.0.x** is an older release but may receive critical fixes at maintainers’ discretion. :contentReference[oaicite:2]{index=2}  
- Versions **below 2.0** are no longer maintained and are not eligible for security backports. :contentReference[oaicite:3]{index=3}

## Reporting a Vulnerability

We take security issues seriously and encourage responsible disclosure. If you believe you have found a security vulnerability in this project, please follow the process below:

### How to Report

1. **Create a GitHub Issue with the `security` label** in the repository:  
   https://github.com/phellipeandrade/rbac/issues  
2. In the issue, include:
   - A clear description of the issue.
   - Steps to reproduce the issue.
   - Minimal reproduction code if applicable.
   - Affected version(s) (as specified in Supported Versions).

### What to Expect

- You will receive an acknowledgement of your report within **5 business days**.
- A core maintainer will evaluate the report and may request additional details.
- If the issue is confirmed, the maintainers will:
  - Coordinate a fix.
  - Publish a patched release for supported versions.
  - Update this policy if needed.
- You will be kept informed of progress via the GitHub issue.

### Confidentiality

Please **do not publish or disclose details publicly** until a fix is available and communicated by project maintainers.

## Security Fix Backporting

Security patches for confirmed vulnerabilities will be backported to supported versions when feasible. Unsupported versions will not receive patches.

## Disclosure Timeline

| Stage                       | Target Duration        |
| --------------------------- | ---------------------- |
| Acknowledgement of report   | ≤ 5 business days      |
| Initial triage              | ≤ 10 business days     |
| Fix coordination & release  | Varies by severity     |

## Contact

For security reports and coordination, open an issue with the `security` label on the repository:  
https://github.com/phellipeandrade/rbac/issues  
