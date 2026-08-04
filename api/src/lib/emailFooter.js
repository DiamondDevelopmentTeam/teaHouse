export const PRIVACY_NOTICE_TITLE = 'Privacy and Confidentiality Notice';

const NOTICE_PARAGRAPHS = Object.freeze([
  'This email and any attachments may contain confidential or proprietary information intended solely for the designated recipient. If you received this message in error, please notify the sender and permanently delete it. Unauthorized review, use, disclosure, copying, or distribution is prohibited.',
  'Information submitted through this website is used only to review and respond to the inquiry and provide requested services. Please do not submit highly sensitive personal, financial, medical, authentication, or payment information through a public website form or by email.',
  'This message is provided for general informational and communication purposes only and does not constitute legal, financial, tax, medical, or other professional advice.',
]);

export function buildEmailFooter(senderEmail) {
  const automatedNotice = `This is an automated website notification sent through ${senderEmail}. Replies to this mailbox may not be monitored.`;
  const plainText = [
    '----------------------------------------------------------------',
    `${PRIVACY_NOTICE_TITLE}: ${NOTICE_PARAGRAPHS[0]}`,
    '',
    NOTICE_PARAGRAPHS[1],
    '',
    NOTICE_PARAGRAPHS[2],
    '',
    automatedNotice,
  ].join('\n');

  const paragraphHtml = [...NOTICE_PARAGRAPHS, automatedNotice]
    .map((paragraph, index) => `<p style="margin:${index === 0 ? '6px' : '10px'} 0 0;line-height:1.55">${paragraph}</p>`)
    .join('');

  const html = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr>
        <td style="padding:0 32px 28px">
          <div style="border-top:1px solid #d8d2ca;padding-top:18px;color:#6c6761;font-family:Arial,sans-serif;font-size:11px;line-height:1.55">
            <strong style="color:#57524c;font-size:11px">${PRIVACY_NOTICE_TITLE}</strong>
            ${paragraphHtml}
          </div>
        </td>
      </tr>
    </table>`;

  return { plainText, html };
}
