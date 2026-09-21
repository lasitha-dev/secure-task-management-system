/**
 * Email Templates
 * Builds the subject, plain-text, and HTML body for each notification type.
 * All templates share the same branded card layout.
 */

const APP_NAME = 'TaskMaster';
const BRAND_COLOR = '#144bb8';

/**
 * Wraps content in a simple branded HTML email card.
 * @param {string} title      — Bold heading inside the card
 * @param {string} body       — HTML body paragraphs
 * @param {string} [footer]   — Optional extra footer line
 */
function buildHtmlCard(title, body, footer = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f1219;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1219;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161b26;border-radius:12px;border:1px solid #2d3544;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:20px 32px;">
              <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff;">${title}</h1>
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #2d3544;background:#111621;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                ${footer || `You received this email because you are a member of ${APP_NAME}. Manage your notification preferences in the app.`}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(text) {
    return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#94a3b8;">${text}</p>`;
}

function metaRow(label, value) {
    if (!value) return '';
    return `<tr>
      <td style="padding:6px 0;font-size:13px;color:#64748b;white-space:nowrap;padding-right:16px;">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${value}</td>
    </tr>`;
}

function metaTable(rows) {
    const rowsHtml = rows.filter(Boolean).join('');
    if (!rowsHtml) return '';
    return `<table cellpadding="0" cellspacing="0" style="margin-top:16px;width:100%;">${rowsHtml}</table>`;
}

function formatDeadline(isoDate) {
    if (!isoDate) return null;
    return new Date(isoDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Per-type template builders
// ---------------------------------------------------------------------------

function templateTaskAssigned(notification) {
    const { taskTitle, assignedByName, deadline } = notification.metadata || {};
    const subject = `[${APP_NAME}] You have been assigned to: ${taskTitle || 'a task'}`;
    const html = buildHtmlCard(
        notification.title,
        p(notification.message) +
        metaTable([
            metaRow('Task', taskTitle),
            metaRow('Assigned by', assignedByName),
            metaRow('Deadline', formatDeadline(deadline)),
        ])
    );
    const text = `${notification.title}\n\n${notification.message}\n\nTask: ${taskTitle || '—'}\nAssigned by: ${assignedByName || '—'}\nDeadline: ${formatDeadline(deadline) || 'None'}`;
    return { subject, html, text };
}

function templateTaskUpdated(notification) {
    const { taskTitle } = notification.metadata || {};
    const subject = `[${APP_NAME}] Task updated: ${taskTitle || 'a task'}`;
    const html = buildHtmlCard(
        notification.title,
        p(notification.message) +
        metaTable([metaRow('Task', taskTitle)])
    );
    const text = `${notification.title}\n\n${notification.message}\n\nTask: ${taskTitle || '—'}`;
    return { subject, html, text };
}

function templateDeadlineReminder(notification) {
    const { taskTitle, deadline, reminderType } = notification.metadata || {};
    const urgencyMap = {
        due_in_48_hours: '⏰',
        due_in_24_hours: '🔔',
        overdue: '🚨',
    };
    const emoji = urgencyMap[reminderType] || '⏰';
    const subject = `[${APP_NAME}] ${emoji} Deadline reminder: ${taskTitle || 'a task'}`;
    const html = buildHtmlCard(
        notification.title,
        p(notification.message) +
        metaTable([
            metaRow('Task', taskTitle),
            metaRow('Deadline', formatDeadline(deadline)),
        ])
    );
    const text = `${notification.title}\n\n${notification.message}\n\nTask: ${taskTitle || '—'}\nDeadline: ${formatDeadline(deadline) || 'None'}`;
    return { subject, html, text };
}

function templateCommentAdded(notification) {
    const { taskTitle, commenterName } = notification.metadata || {};
    const subject = `[${APP_NAME}] New comment on: ${taskTitle || 'a task'}`;
    const html = buildHtmlCard(
        notification.title,
        p(notification.message) +
        metaTable([
            metaRow('Task', taskTitle),
            metaRow('From', commenterName),
        ])
    );
    const text = `${notification.title}\n\n${notification.message}\n\nTask: ${taskTitle || '—'}\nFrom: ${commenterName || '—'}`;
    return { subject, html, text };
}

function templateTeamUpdate(notification) {
    const subject = `[${APP_NAME}] Team update: ${notification.title}`;
    const html = buildHtmlCard(notification.title, p(notification.message));
    const text = `${notification.title}\n\n${notification.message}`;
    return { subject, html, text };
}

function templateSystemAlert(notification) {
    const subject = `[${APP_NAME}] System alert: ${notification.title}`;
    const html = buildHtmlCard(notification.title, p(notification.message));
    const text = `${notification.title}\n\n${notification.message}`;
    return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const TEMPLATE_MAP = {
    task_assigned: templateTaskAssigned,
    task_updated: templateTaskUpdated,
    deadline_reminder: templateDeadlineReminder,
    comment_added: templateCommentAdded,
    team_update: templateTeamUpdate,
    system_alert: templateSystemAlert,
};

/**
 * Build the email payload for a given notification.
 * @param {object} notification — A persisted notification document (plain object)
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildEmailPayload(notification) {
    const builder = TEMPLATE_MAP[notification.type] || templateSystemAlert;
    return builder(notification);
}

module.exports = { buildEmailPayload };
