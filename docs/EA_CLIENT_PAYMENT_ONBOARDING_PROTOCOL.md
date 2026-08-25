# EA Client Payment & Onboarding Protocol

## Purpose

This protocol defines the standard Efficiency Architects transition from a confirmed client payment into onboarding and production. It is designed to make the experience feel guided, premium, and operationally consistent while introducing Eva as part of the client experience from day one.

## Trigger

The protocol begins immediately after a valid project payment is confirmed.

## Standard Client Experience

### 1. Confirm Payment

The system verifies that the Stripe checkout session is paid and matches the correct project record.

### 2. Send Payment Confirmation & Receipt Summary

The client receives a branded confirmation email containing:

- Client and business name
- Project type
- Amount paid
- Total project amount
- Remaining balance
- Payment date
- Payment reference
- Stripe receipt link when available

The language should confirm that the project is secured and clearly transition the client into what happens next.

### 3. Introduce Eva Immediately

Eva must be introduced in the payment confirmation experience, not delayed until later in onboarding.

Approved positioning:

> Eva is your digital assistant inside the Efficiency Architects experience. She helps make the process easier to navigate by guiding onboarding, surfacing what is needed next, supporting project updates and requests, and becoming part of the intelligent system being built for the client.

Core client-facing line:

> You do not need to learn a new system. Eva helps guide you through it.

Eva should be presented as part of the service experience, not as a novelty, chatbot, or optional add-on.

### 4. Move Into Project Setup

After payment, the client should understand that EA is organizing the information, access, and assets needed for the build.

### 5. Guide Remaining Requirements

Do not send a generic checklist when a guided experience is possible. Eva and the EA team should help the client understand what is still needed and what action matters next.

### 6. Confirm Discovery

EA confirms:

- Project priorities
- Required content and assets
- Intended customer/client journey
- Access requirements
- Any remaining scope details

### 7. Begin Production

Once the required inputs are sufficiently complete, the project moves into production under the agreed target timeline.

Current standard target language: 2–4 weeks unless the client purchased or was assigned another service level.

## Experience Principles

1. One clear next step at a time.
2. Guide the client instead of making them manage the process.
3. Introduce Eva early so the digital assistant feels native to the relationship.
4. Avoid generic checklists when the system can surface specific missing items.
5. Keep payment confirmation separate from sales language. The client has already committed.
6. Make the transition from payment to production feel immediate and organized.
7. Every automated communication should reinforce trust, clarity, and momentum.

## System Requirements

The payment-confirmation workflow should:

- Require a paid Stripe session.
- Confirm the payment belongs to the correct project.
- Prevent duplicate confirmation emails.
- Use the project record as the source of truth for client and pricing details.
- Include the receipt URL when Stripe provides one.
- Record that the confirmation email was sent.
- Fail safely if email delivery is unavailable while preserving the confirmed payment state.

## Approved Sequence

**Payment Confirmed → Receipt & Confirmation → Meet Eva → Project Setup → Remaining Items → Discovery Confirmation → Production**

This sequence is the default EA client payment-to-onboarding protocol unless a specific product or engagement requires a documented exception.
