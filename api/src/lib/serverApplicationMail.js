import { ClientSecretCredential } from '@azure/identity';
import { GRAPH_SENDER_EMAIL } from './config.js';
import { buildEmailFooter } from './emailFooter.js';
import { GraphMailError } from './graphMail.js';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function defangUrl(value) {
  return String(value).replace('://', ':\u200B//').replaceAll('.', '.\u200B');
}

function displayTime(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function displaySubmittedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : `${date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')} UTC`;
}

function row(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `<tr>
    <th style="padding:9px 10px;text-align:left;vertical-align:top;border-bottom:1px solid #e6dfd4;color:#57493d;font-size:12px;width:190px">${escapeHtml(label)}</th>
    <td style="padding:9px 10px;border-bottom:1px solid #e6dfd4;color:#241f1a;font-size:14px;white-space:pre-wrap">${escapeHtml(value)}</td>
  </tr>`;
}

function section(title, rows) {
  const contents = rows.filter(Boolean).join('');
  if (!contents) return '';
  return `<h2 style="margin:28px 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#302922">${escapeHtml(title)}</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${contents}</table>`;
}

function availabilityHtml(availability) {
  const rows = availability.map(({ day, available, earliest, latest }) => `<tr>
    <th style="padding:8px 10px;text-align:left;border-bottom:1px solid #e6dfd4;color:#57493d;font-size:12px">${escapeHtml(day)}</th>
    <td style="padding:8px 10px;border-bottom:1px solid #e6dfd4;color:#241f1a;font-size:14px">${available ? `${escapeHtml(displayTime(earliest))}–${escapeHtml(displayTime(latest))}` : 'Not available'}</td>
  </tr>`).join('');
  return `<h2 style="margin:28px 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#302922">Weekly availability</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>`;
}

function plainField(lines, label, value) {
  if (value !== undefined && value !== null && value !== '') lines.push(`${label}: ${value}`);
}

export function buildServerApplicationEmail(application, {
  submittedAt,
  requestId,
  senderEmail = GRAPH_SENDER_EMAIL,
} = {}) {
  const fullName = `${application.firstName} ${application.lastName}`;
  const subject = `1890 Tea House Server Application — ${fullName}`;
  const submitted = displaySubmittedAt(submittedAt);
  const experience = application.experiences.length > 0
    ? application.experiences.join(', ')
    : 'None selected';
  const footer = buildEmailFooter(senderEmail);
  const availabilityText = application.availability
    .map(({ day, available, earliest, latest }) => `${day}: ${available ? `${displayTime(earliest)}–${displayTime(latest)}` : 'Not available'}`)
    .join('\n');

  const plain = ['1890 Tea House', 'New Server Application', ''];
  plainField(plain, 'Submission date and time', submitted);
  plainField(plain, 'Request ID', requestId);
  plain.push('', 'POSITION AND EMPLOYMENT PREFERENCE');
  plainField(plain, 'Position', application.position);
  plainField(plain, 'Application date', application.applicationDate);
  plainField(plain, 'Available start date', application.availableStartDate);
  plainField(plain, 'Desired employment', application.desiredEmployment);
  plainField(plain, 'Available weekends', application.availableWeekends);
  plainField(plain, 'Available holidays', application.availableHolidays);
  plain.push('', 'APPLICANT CONTACT INFORMATION');
  plainField(plain, 'Name', fullName);
  plainField(plain, 'Phone', application.phone);
  plainField(plain, 'Email', application.email);
  plainField(plain, 'Address', `${application.streetAddress}, ${application.city}, ${application.state} ${application.zipCode}`);
  plain.push('', 'EMPLOYMENT ELIGIBILITY');
  plainField(plain, 'At least 18 years old', application.isAdult);
  plainField(plain, 'Authorized to work in the United States', application.workAuthorized);
  plain.push('', 'WEEKLY AVAILABILITY', availabilityText, '', 'EXPERIENCE AND QUALIFICATIONS');
  plainField(plain, 'Experience', experience);
  plainField(plain, 'Why 1890 Tea House', application.whyWorkHere);
  plainField(plain, 'Relevant certifications', application.certifications);
  plain.push('', 'EDUCATION');
  plainField(plain, 'Highest level completed', application.educationLevel);
  plainField(plain, 'School name', application.schoolName);
  plain.push('', 'REFERENCES');
  application.references.forEach((reference, index) => {
    plainField(plain, `Reference ${index + 1}`, `${reference.name} — ${reference.relationship} — ${reference.phone}`);
  });
  plain.push('', 'BACKGROUND-CHECK WILLINGNESS');
  plainField(plain, 'Willing if required', application.backgroundCheck);
  plain.push('', 'APPLICANT CERTIFICATION');
  plainField(plain, 'Certified accurate', application.certification ? 'Yes' : 'No');
  plainField(plain, 'Typed signature', application.signatureName);
  plainField(plain, 'Signature date', application.signatureDate);
  plain.push('', 'RÉSUMÉ STATUS');
  plainField(plain, 'Résumé', application.resume ? `Attached: ${application.resume.filename}` : 'Not provided');
  plain.push('', `Origin page: ${defangUrl(application.pageUrl)}`, `Request ID: ${requestId}`);
  const plainText = `${plain.join('\n')}\n\n${footer.plainText}`;

  const html = `<!doctype html>
  <html lang="en"><body style="margin:0;padding:0;background:#f5f1ea;font-family:Arial,sans-serif;color:#241f1a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:24px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#fff;border:1px solid #e6dfd4">
        <tr><td style="padding:28px 32px;background:#25352f;color:#fff">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase">1890 Tea House</div>
          <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:normal">New Server Application</h1>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.5">${escapeHtml(submitted)} · Request ID ${escapeHtml(requestId)}</p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px">
          ${section('Position and employment preference', [
            row('Position', application.position), row('Application date', application.applicationDate),
            row('Available start date', application.availableStartDate), row('Desired employment', application.desiredEmployment),
            row('Available weekends', application.availableWeekends), row('Available holidays', application.availableHolidays),
          ])}
          ${section('Applicant contact information', [
            row('Name', fullName), row('Phone number', application.phone), row('Email address', application.email),
            row('Street address', application.streetAddress), row('City, state, ZIP', `${application.city}, ${application.state} ${application.zipCode}`),
          ])}
          ${section('Employment eligibility', [
            row('At least 18 years old', application.isAdult), row('Authorized to work in the United States', application.workAuthorized),
          ])}
          ${availabilityHtml(application.availability)}
          ${section('Experience and qualifications', [
            row('Experience', experience), row('Why 1890 Tea House', application.whyWorkHere), row('Relevant certifications', application.certifications),
          ])}
          ${section('Education', [row('Highest level completed', application.educationLevel), row('School name', application.schoolName)])}
          ${section('References', application.references.flatMap((reference, index) => [
            row(`Reference ${index + 1} name`, reference.name), row(`Reference ${index + 1} phone`, reference.phone), row(`Reference ${index + 1} relationship`, reference.relationship),
          ]))}
          ${section('Background-check willingness', [row('Willing if required', application.backgroundCheck)])}
          ${section('Applicant certification', [row('Certified accurate', application.certification ? 'Yes' : 'No'), row('Typed signature', application.signatureName), row('Signature date', application.signatureDate)])}
          ${section('Résumé status', [row('Résumé', application.resume ? `Attached: ${application.resume.filename}` : 'Not provided')])}
          ${section('Submission details', [row('Origin page', defangUrl(application.pageUrl)), row('Request ID', requestId)])}
        </td></tr>
        <tr><td>${footer.html}</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  return { subject, html, plainText };
}

export function buildServerApplicationGraphPayload(application, options) {
  const { subject, html } = buildServerApplicationEmail(application, options);
  const payload = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{
        emailAddress: { address: options.recipientEmail },
      }],
      replyTo: [{
        emailAddress: {
          address: application.email,
          name: `${application.firstName} ${application.lastName}`,
        },
      }],
    },
    saveToSentItems: false,
  };
  if (application.resume) {
    payload.message.attachments = [{
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: application.resume.filename,
      contentType: application.resume.contentType,
      contentBytes: application.resume.bytes.toString('base64'),
    }];
  }
  return payload;
}

export async function sendServerApplicationEmail({
  application,
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

  const payload = buildServerApplicationGraphPayload(application, {
    senderEmail: config.graphSenderEmail,
    recipientEmail: config.serverApplicationRecipientEmail,
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
  if (!response.ok) throw new GraphMailError('request_failed', response.status);
}
