import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ChatGPT Actions must call the apex host. `www.efficiencyarchitects.online`
 * often resolves to a different Vercel project and returns NOT_FOUND for API routes.
 * Prefer apex even when NEXT_PUBLIC_BASE_URL is set to www.
 */
function chatgptActionBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  ).replace(/\/$/, '');
  return raw.replace(
    /^https?:\/\/www\.efficiencyarchitects\.online/i,
    'https://efficiencyarchitects.online',
  );
}

export async function GET() {
  const baseUrl = chatgptActionBaseUrl();

  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'EACP Mobile Launch Action',
      version: '1.2.1',
      description:
        'Launch EA Factory projects (pipeline) and EACP packages from ChatGPT mobile.',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/launch': {
        post: {
          operationId: 'launchProject',
          summary: 'Create an EA Factory project and queue processing',
          description:
            'Accepts Launch commands (URL, company name, or text). Creates a Factory Project, queues GenerateWorker, and returns projectId + status. Use for autonomous pipeline entry. Does not auto-approve or deploy.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    command: {
                      type: 'string',
                      description:
                        'Natural language. Examples: Launch https://www.bgca.org — Launch Bob Rumball Centre — Launch Acme and create a complete learning ecosystem.',
                    },
                    client: { type: 'string' },
                    companyName: { type: 'string' },
                    url: { type: 'string' },
                    website: { type: 'string' },
                    goal: { type: 'string' },
                    deliverable: { type: 'string' },
                    industry: { type: 'string' },
                    notes: { type: 'string' },
                    text: { type: 'string' },
                    attachments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            enum: ['image', 'pdf', 'powerpoint', 'word', 'text', 'voice', 'other'],
                          },
                          url: { type: 'string' },
                          textPreview: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Project created and queued.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      projectId: { type: 'string' },
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Missing required fields.' },
            '401': { description: 'Missing or invalid bearer token.' },
            '429': { description: 'Rate limit exceeded.' },
          },
        },
      },
      '/api/eacp/chatgpt-launch': {
        post: {
          operationId: 'launchEACPFromChatGPT',
          summary: 'Create an EACP launch package',
          description:
            'Creates a durable EACP launch package from a natural-language command or structured launch fields. This does not approve, build, or deploy the package.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    command: {
                      type: 'string',
                      description:
                        'Full EACP command. Example: EACP Client: Bob Rumball Centre Goal: Training Transformation Deliverable: Website + Portal + Learning Hub Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.',
                    },
                    client: { type: 'string' },
                    goal: { type: 'string' },
                    deliverable: { type: 'string' },
                    industry: { type: 'string', description: 'Optional. EACP can infer this if omitted.' },
                    notes: { type: 'string' },
                  },
                  anyOf: [
                    { required: ['command'] },
                    { required: ['client', 'goal', 'deliverable'] },
                  ],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'EACP launch package created.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      message: { type: 'string' },
                      launchId: { type: 'string' },
                      status: { type: 'string' },
                      reviewPackageUrl: { type: 'string' },
                      projectBriefUrl: { type: 'string' },
                      skinBriefUrl: { type: 'string' },
                      approvalUrl: { type: 'string' },
                      codexBuilderUrl: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Missing or invalid launch fields.' },
            '401': { description: 'Missing or invalid bearer token.' },
            '503': { description: 'EACP persistence is not configured.' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  });
}
