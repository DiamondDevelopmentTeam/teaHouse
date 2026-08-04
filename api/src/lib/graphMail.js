import { ClientSecretCredential } from '@azure/identity';
import { GRAPH_SENDER_EMAIL } from './config.js';
import { buildEmailFooter } from './emailFooter.js';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
export const DEFAULT_WEBSITE_NAME = '1890 Tea House';
export const FORM_TYPE_TITLES = Object.freeze({
  general: 'General Inquiry',
  reservation: 'Reservation Request',
  event: 'Event Inquiry',
  contact: 'Contact Request',
});
export const FORM_SUBJECTS = Object.freeze(Object.fromEntries(
  Object.entries(FORM_TYPE_TITLES)
    .map(([formType, title]) => [formType, `${DEFAULT_WEBSITE_NAME} – ${title}`]),
));

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

function formatSubmissionTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')} UTC`;
}

function defangUrl(value) {
  return String(value)
    .replace('://', ':\u200B//')
    .replaceAll('.', '.\u200B');
}

function addPlainField(lines, label, value) {
  if (value === undefined || value === null || value === '') return;
  lines.push(`${label}: ${value}`);
}

export function buildInquiryEmailContent(
  inquiry,
  { submittedAt, requestId, senderEmail = GRAPH_SENDER_EMAIL },
) {
  const websiteName = inquiry.websiteName || DEFAULT_WEBSITE_NAME;
  const formTitle = FORM_TYPE_TITLES[inquiry.formType];
  const subject = `${websiteName} – ${formTitle}`;
  const submittedAtDisplay = formatSubmissionTime(submittedAt);
  const preOrders = inquiry.preOrders.length > 0 ? inquiry.preOrders.join(', ') : '';
  const emailFooter = buildEmailFooter(senderEmail);
  const plainLines = [
    `A new form submission was received from the ${websiteName} website.`,
    '',
  ];
  addPlainField(plainLines, 'Form type', inquiry.formType);
  addPlainField(plainLines, 'Name', inquiry.name);
  addPlainField(plainLines, 'Visitor email', inquiry.email);
  addPlainField(plainLines, 'Phone', inquiry.phone);
  addPlainField(plainLines, 'Subject', inquiry.subject);
  addPlainField(plainLines, 'Preferred date', inquiry.preferredDate);
  addPlainField(plainLines, 'Preferred time', inquiry.preferredTime);
  addPlainField(plainLines, 'Guest count', inquiry.guestCount);
  addPlainField(plainLines, 'Inquiry category', inquiry.inquiryCategory);
  addPlainField(plainLines, 'Pre-order interests', preOrders);
  plainLines.push('', 'Message:', inquiry.message, '');
  addPlainField(plainLines, 'Submitted', submittedAtDisplay);
  addPlainField(plainLines, 'Origin page', defangUrl(inquiry.pageUrl));
  addPlainField(plainLines, 'Request ID', requestId);
  const plainText = `${plainLines.join('\n')}\n\n${emailFooter.plainText}`;

  const rows = [
    ['Form type', inquiry.formType],
    ['Name', inquiry.name],
    ['Visitor email', inquiry.email],
    ['Phone number', inquiry.phone],
    ['Subject', inquiry.subject],
    ['Preferred date', inquiry.preferredDate],
    ['Preferred time', inquiry.preferredTime],
    ['Guest count', inquiry.guestCount],
    ['Inquiry category', inquiry.inquiryCategory],
    ['Pre-order interests', preOrders],
    ['Reply to', `${inquiry.name} <${inquiry.email}>`],
    ['Submission date and time', submittedAtDisplay],
    ['Origin page', defangUrl(inquiry.pageUrl)],
    ['Request ID', requestId],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `
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
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(websiteName)}</div>
                <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:normal">${escapeHtml(subject)}</h1>
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
            <tr>
              <td>${emailFooter.html}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, plainText, html };
}

export function buildGraphMimeMessage(
  inquiry,
  { senderEmail, recipientEmail, submittedAt, requestId },
) {
  const { subject, plainText, html } = buildInquiryEmailContent(
    inquiry,
    { submittedAt, requestId, senderEmail },
  );
  const boundarySuffix = requestId.replace(/[^a-zA-Z0-9]/g, '') || 'inquiry';
  const boundary = `web_forms_${boundarySuffix}`;
  const submittedDate = new Date(submittedAt).toUTCString();
  const websiteName = inquiry.websiteName || DEFAULT_WEBSITE_NAME;

  return [
    `From: ${encodeHeader(`${websiteName} Website Inquiry`)} <${senderEmail}>`,
    `To: ${recipientEmail}`,
    `Reply-To: ${encodeHeader(inquiry.name)} <${inquiry.email}>`,
    `Subject: ${encodeHeader(subject)}`,
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
