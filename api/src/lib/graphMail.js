import { ClientSecretCredential } from '@azure/identity';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const WEBSITE_SOURCE = '1890 Tea House website contact form';

export class GraphMailError extends Error {
  constructor(code, status) {
    super('The inquiry email could not be sent.');
    this.name = 'GraphMailError';
    this.code = code;
    this.status = status;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`;
}

function encodeMimePart(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .match(/.{1,76}/g)
    .join('\r\n');
}

export function buildInquiryEmailContent(inquiry, { submittedAt, requestId }) {
  const plainText = [
    'A new contact inquiry was submitted to the 1890 Tea House website.',
    '',
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    `Inquiry type: ${inquiry.inquiryType}`,
    `Preferred date: ${inquiry.preferredDate}`,
    `Guest count: ${inquiry.guestCount}`,
    '',
    'Message:',
    inquiry.message,
    '',
    `Submitted: ${submittedAt}`,
    `Website source: ${WEBSITE_SOURCE}`,
    `Request ID: ${requestId}`,
  ].join('\n');

  const rows = [
    ['Customer name', inquiry.name],
    ['Customer email', inquiry.email],
    ['Phone number', inquiry.phone],
    ['Inquiry type', inquiry.inquiryType],
    ['Preferred date', inquiry.preferredDate],
    ['Guest count', inquiry.guestCount],
    ['Reply to', `${inquiry.name} <${inquiry.email}>`],
    ['Submission date and time', submittedAt],
    ['Website source', WEBSITE_SOURCE],
    ['Request ID', requestId],
  ].map(([label, value]) => `
    <tr>
      <th style="padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e6dfd4;color:#57493d;font-size:13px;width:180px">${escapeHtml(label)}</th>
      <td style="padding:10px 12px;border-bottom:1px solid #e6dfd4;color:#241f1a;font-size:14px">${escapeHtml(value)}</td>
    </tr>`).join('');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#241f1a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e6dfd4">
            <tr>
              <td style="padding:28px 32px;background:#25352f;color:#ffffff">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase">1890 Tea House</div>
                <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:normal">New website inquiry</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}
                </table>
                <h2 style="margin:28px 0 10px;font-family:Georgia,serif;font-size:20px;font-weight:normal">Message</h2>
                <div style="padding:16px;background:#f8f5ef;border-left:3px solid #9a7956;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(inquiry.message)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { plainText, html };
}

export function buildGraphMimeMessage(
  inquiry,
  { senderEmail, recipientEmail, submittedAt, requestId },
) {
  const { plainText, html } = buildInquiryEmailContent(inquiry, { submittedAt, requestId });
  const boundarySuffix = requestId.replace(/[^a-zA-Z0-9]/g, '') || 'inquiry';
  const boundary = `tea_house_${boundarySuffix}`;
  const submittedDate = new Date(submittedAt).toUTCString();

  return [
    `From: Tea House Inquiry <${senderEmail}>`,
    `To: ${recipientEmail}`,
    `Reply-To: ${encodeHeader(inquiry.name)} <${inquiry.email}>`,
    `Subject: ${encodeHeader(`New Tea House Inquiry from ${inquiry.name}`)}`,
    `Date: ${submittedDate}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeMimePart(plainText),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeMimePart(html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
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

  const mimeMessage = buildGraphMimeMessage(inquiry, {
    senderEmail: config.graphSenderEmail,
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
        'Content-Type': 'text/plain',
      },
      body: Buffer.from(mimeMessage, 'utf8').toString('base64'),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new GraphMailError('request_failed');
  }

  if (!response.ok) throw new GraphMailError('request_failed', response.status);
}
