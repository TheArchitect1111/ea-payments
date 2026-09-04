# Eva Mail + Postal

Eva Mail is a standard EA portal-chassis capability. Postal is the mail transport layer; Eva is the client-specific reasoning, response, workflow, logging, and escalation layer.

## Standard flow

Dedicated client address -> Postal inbound -> EA Eva Mail gateway -> tenant resolver -> client knowledge/rules -> response or escalation -> Postal outbound -> portal interaction log.

## Safety defaults

- Capability ships with future portals but remains inactive until a domain is verified.
- Auto-reply is OFF by default.
- Every tenant is isolated by tenant ID and domain.
- Postal API credentials remain server-side only.
- Human escalation is required as a fallback.
- No access to a client's ordinary mailbox is required.

## Current tenants

### Amanda Catherine
- Tenant: `amanda-catherine`
- Intended address: `participants@amandacatherine.ca`
- Chassis capability: enabled
- Auto-reply: disabled pending transport/DNS verification

### Canadian Prospect Recruitment
- Tenant: `cpr`
- Intended local part: `participants`
- Chassis capability: enabled
- Domain must be confirmed before the address is activated
- Auto-reply: disabled pending transport/DNS verification

## Required production environment

- `POSTAL_API_URL`
- `POSTAL_API_KEY`
- `EVA_MAIL_WEBHOOK_SECRET`

Postal itself must run on infrastructure that supports persistent SMTP/mail-server workloads and the required mail ports. Do not attempt to run the Postal mail server inside a Vercel Function. Vercel hosts the EA application/API integration; Postal runs as separate mail infrastructure.

## Domain activation checklist

For each client domain:
1. Provision the domain/server in Postal.
2. Add and verify the DNS records Postal requires.
3. Configure SPF and DKIM for authenticated sending.
4. Configure inbound routing for the dedicated Eva address.
5. Route inbound events to the EA Eva Mail gateway.
6. Test receive, tenant isolation, approved-response behavior, escalation, reply threading, and outbound deliverability.
7. Enable auto-reply only after all tests pass.

## Chassis rule

All future EA portal builds inherit Eva Mail as an available capability. Provisioning a dedicated address is a tenant activation step, not a custom development project.
