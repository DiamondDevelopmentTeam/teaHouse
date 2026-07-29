import { ClientSecretCredential } from '@azure/identity';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

export class GraphMailError extends Error {
  constructor(code) {
    super('The inquiry email could not be sent.');
    this.name = 'GraphMailError';
    this.code = code;
  }
}

export function buildGraphMailPayload(inquiry, { recipientEmail, submittedAt, requestId }) {
  const content = [
    'A new contact inquiry was submitted to the 1890 Tea House website.',
    '',
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone || 'Not provided'}`,
    `Topic: ${inquiry.topic}`,
    '',
    'Message:',
    inquiry.message,
    '',
    `Submitted: ${submittedAt}`,
    `Request ID: ${requestId}`,
  ].join('\n');

  return {
    message: {
      subject: `[1890 Tea House Inquiry] ${inquiry.topic}`,
      body: {
        contentType: 'Text',
        content,
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipientEmail,
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: inquiry.email,
            name: inquiry.name,
          },
        },
      ],
    },
    saveToSentItems: true,
  };
}

export async function sendInquiryEmail({
  inquiry,
  config,
  submittedAt,
  requestId,
  fetchImpl = fetch,
  credentialFactory = (tenantId, clientId, clientSecret) =>
    new ClientSecretCredential(tenantId, clientId, clientSecret),
}) {
  const credential = credentialFactory(config.tenantId, config.clientId, config.clientSecret);
  let accessToken;

  try {
    accessToken = await credential.getToken(GRAPH_SCOPE);
  } catch {
    throw new GraphMailError('authentication_failed');
  }

  if (!accessToken?.token) throw new GraphMailError('authentication_failed');

  const payload = buildGraphMailPayload(inquiry, {
    recipientEmail: config.inquiryRecipientEmail,
    submittedAt,
    requestId,
  });
  const endpoint = `${GRAPH_BASE_URL}/users/${encodeURIComponent(config.graphSenderEmail)}/sendMail`;

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new GraphMailError('request_failed');
  }

  if (!response.ok) throw new GraphMailError('request_failed');
}

