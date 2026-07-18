import { NextResponse } from 'next/server';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');

  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'EACP Mobile Launch Action',
      version: '1.1.0',
      description:
        'Launch EA Factory EACP packages and field demos (live site + portal + findings) from ChatGPT mobile.',
    },
    servers: [{ url: baseUrl }],
    paths: {
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
                  anyOf: [{ required: ['command'] }, { required: ['client', 'goal', 'deliverable'] }],
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
      '/api/eacp/field-demo': {
        post: {
          operationId: 'launchFieldDemo',
          summary: 'Create a field demo show pack',
          description:
            'Creates an EA business profile, live starter website, portal access, findings report, EACP launch trail, and emails the founder a show pack. Use when the user says field demo, show this client, or wants something to present in the room.',
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
                        'Natural language field-demo command. Example: Field demo for Acme Roofing, Atlanta. Industry: home services. Goal: book more estimate appointments.',
                    },
                    client: { type: 'string', description: 'Business or client name' },
                    goal: { type: 'string', description: 'Primary business goal' },
                    deliverable: {
                      type: 'string',
                      description: 'Optional. Defaults to Website + Portal.',
                    },
                    industry: { type: 'string' },
                    notes: { type: 'string' },
                    contactEmail: {
                      type: 'string',
                      description: 'Optional prospect email for the demo portal login.',
                    },
                  },
                  anyOf: [{ required: ['command'] }, { required: ['client', 'goal'] }],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Field demo pack created (or partially created with warnings).',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      message: { type: 'string' },
                      slug: { type: 'string' },
                      siteUrl: { type: 'string' },
                      reportUrl: { type: 'string' },
                      portalUrl: { type: 'string' },
                      portalLoginUrl: { type: 'string' },
                      launchId: { type: 'string' },
                      launchReviewUrl: { type: 'string' },
                      talkingPoints: { type: 'string' },
                      checkEmail: { type: 'string' },
                      errors: { type: 'array', items: { type: 'string' } },
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
      '/api/eacp/connect-finish': {
        post: {
          operationId: 'runConnectFinishLine',
          summary: 'Run Connect launch finish line',
          description:
            'Clears due Connect nurture, reseeds production matrix for an org (default demo-client), and returns Connect launch readiness. Founder ops helper.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    orgSlug: { type: 'string', default: 'demo-client' },
                    count: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Connect finish line result.' },
            '401': { description: 'Missing or invalid bearer token.' },
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
