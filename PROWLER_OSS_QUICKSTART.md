# Prowler OSS End-to-End Runbook (Windows + Docker + GitHub Pipeline)

This document is a practical, command-first guide for running Prowler OSS locally (UI/API/Worker), exposing it through Cloudflare Tunnel, registering AWS credentials, running scans, and coordinating with your GitHub remediation workflows.

## 0) Scope and architecture

- Prowler App (`workspaces/prowler-upstream`) handles UI/API scan operations.
- GitHub workflows (`Security Pipeline - 01..04`) handle IaC remediation PR generation and apply verification.
- These two flows are separate by default.

## 1) Prerequisites

## 1.1 Required tools

Run these commands in PowerShell and confirm each works:

```powershell
docker --version
docker compose version
gh --version
aws --version
```

Optional (for public URL):

```powershell
cloudflared --version
```

If `cloudflared` is not in PATH on Windows:

```powershell
$exe = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter cloudflared.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
$dir = Split-Path $exe
$env:Path = $env:Path + ";$dir"
cloudflared --version
```

## 1.2 Auth checks

GitHub CLI:

```powershell
gh auth status
```

AWS CLI (local credential check):

```powershell
aws sts get-caller-identity
```

## 2) Move to workspace

```powershell
cd C:\Users\ws567\prowler-auto\prowler-auto-remediation-test\workspaces\prowler-upstream
```

## 3) Configure `.env`

Open `.env` and ensure these fields are correct:

- `AUTH_URL=https://<your-tunnel-domain>.trycloudflare.com` (or `http://localhost:3000` if local only)
- `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,prowler-api,<your-tunnel-domain>.trycloudflare.com`

Recommended quick verification from PowerShell:

```powershell
Select-String -Path .env -Pattern '^AUTH_URL=','^DJANGO_ALLOWED_HOSTS='
```

## 4) Start all containers

```powershell
docker compose up -d
docker compose ps
```

Expected services: `api`, `ui`, `worker`, `worker-beat`, `postgres`, `valkey`, `neo4j`, `mcp-server`.

## 5) Health checks (mandatory)

## 5.1 UI/API port checks

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8080
```

## 5.2 Local HTTP checks

```powershell
curl -UseBasicParsing http://localhost:3000
curl -UseBasicParsing http://localhost:8080
```

## 5.3 Container logs

```powershell
docker compose logs api --tail=120
docker compose logs ui --tail=120
docker compose logs worker --tail=120
```

Healthy indicators:
- API: `Gunicorn server is ready`
- UI: `Ready`
- Worker: queue/task startup logs

## 6) Optional external access with Cloudflare Tunnel

Run in separate terminal and keep it running:

```powershell
cd C:\Users\ws567\prowler-auto\prowler-auto-remediation-test\workspaces\prowler-upstream
cloudflared tunnel --url http://localhost:3000
```

Copy generated URL like `https://xxxx.trycloudflare.com`, then update `.env`:

- `AUTH_URL=https://xxxx.trycloudflare.com`
- add `xxxx.trycloudflare.com` to `DJANGO_ALLOWED_HOSTS`

Restart stack after env change:

```powershell
docker compose down
docker compose up -d
```

Test public URL:

```powershell
curl -UseBasicParsing https://xxxx.trycloudflare.com
```

## 7) Open UI and sign in

- Local: `http://localhost:3000`
- Tunnel: `https://xxxx.trycloudflare.com`

Create first account and login.

## 8) Register AWS Cloud Provider in UI

Path:

- `Configuration` -> `Cloud Providers` -> `Add provider` -> `AWS`

Recommended method first: `Access & Secret Key`

Fill these values:

1. `AWS Access Key ID` = required
2. `AWS Secret Access Key` = required
3. `AWS Session Token` = empty (if using long-lived IAM user key)
4. `Role ARN` = empty
5. `External ID` = empty
6. `Role Session Name` = `prowler-session-01` (set this to avoid validation bug)

If connection test fails, inspect worker logs:

```powershell
docker compose logs worker --tail=200
```

## 9) Launch scan from UI

1. Click `Launch Scan`
2. Choose provider
3. Region: `ap-northeast-2`
4. Compliance: `CIS 1.4` and/or `ISMS-P`
5. Start scan

Track job state:

- `Scan Jobs` page: `Scheduled` -> `Running` -> `Completed`

If progress appears stuck:

```powershell
docker compose logs -f worker
docker compose logs -f api
```

## 10) Review scan outputs

In UI:

- `Findings` -> failing checks
- `Compliance` -> framework score and section detail
- Filter by provider, region, severity, status

## 11) Common issues and direct fixes

## 11.1 `Invalid HTTP_HOST header`

Fix:

1. Add current tunnel hostname in `DJANGO_ALLOWED_HOSTS`
2. Match `AUTH_URL` to same hostname
3. Restart:

```powershell
docker compose down
docker compose up -d
```

## 11.2 `AWSArgumentTypeValidationError[1003] Role Session Name`

Fix:

1. Set `Role Session Name` to valid value (`prowler-session-01`)
2. Reset credentials in UI and save again

## 11.3 Port already in use

Find PID:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8080
```

Stop conflicting process if needed:

```powershell
taskkill /PID <pid> /F
```

## 11.4 Docker compose not found / wrong directory

Always run from:

```powershell
cd C:\Users\ws567\prowler-auto\prowler-auto-remediation-test\workspaces\prowler-upstream
```

## 12) Integrate with GitHub remediation pipeline (01-04)

Important:

- UI scan does **not** auto-trigger GitHub workflows by default.
- You trigger workflows separately in GitHub Actions.

Workflow order:

1. `Security Pipeline - 01 Scan Baseline`
2. `Security Pipeline - 02 Generate Remediation PRs`
3. Merge generated category PRs
4. `Security Pipeline - 03 Apply Merged Generated Terraform Remediation`
5. `Security Pipeline - 04 Verify FAIL Reduction`

Useful `gh` commands:

```powershell
# list workflows
gh workflow list --repo jiwonseok97/prowler-auto-remediation-test

# trigger workflow 01
gh workflow run "Security Pipeline - 01 Scan Baseline" --repo jiwonseok97/prowler-auto-remediation-test -f deploy_vulnerable=false -f account_id=132410971304 -f compliance_mode=cis_1.4_plus_isms_p

# check recent runs
gh run list --repo jiwonseok97/prowler-auto-remediation-test --limit 10

# watch one run
gh run watch <run_id> --repo jiwonseok97/prowler-auto-remediation-test --exit-status

# list open PRs
gh pr list --repo jiwonseok97/prowler-auto-remediation-test --state open
```

## 13) Operational commands

Start:

```powershell
docker compose up -d
```

Stop:

```powershell
docker compose down
```

Restart:

```powershell
docker compose down
docker compose up -d
```

Full reset (delete local volumes/state):

```powershell
docker compose down -v
```

## 14) Daily checklist

1. `docker compose ps`
2. Open UI and confirm login works
3. Run/verify scan job status
4. If needed, run GitHub `01->04`
5. Compare FAIL reduction in workflow 04 summary

## 15) Security notes

1. Never commit real AWS keys/tokens to git.
2. Revoke and rotate exposed tokens immediately.
3. Prefer least-privilege IAM credentials for provider scans.
4. Use short-lived credentials where possible.
