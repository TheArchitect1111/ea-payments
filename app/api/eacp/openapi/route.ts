import { NextResponse } from 'next/server';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');

  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'EACP Mobile Launch Action',
      version: '1.0.0',
      description: 'Launch EA Factory EACP packages from ChatGPT mobile.',
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
