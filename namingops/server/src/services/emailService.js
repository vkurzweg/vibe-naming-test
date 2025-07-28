const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../utils/logger');

const logger = createLogger('emailService');

// Validate required environment variables
const requiredEnvVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.warn(`Missing required email configuration: ${missingVars.join(', ')}`);
  logger.warn('Email service may not function correctly');
}

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Better error handling for common issues
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  // Connection pool for better performance
  pool: true,
  // Max 5 connections in the pool
  maxConnections: 5,
  // Max messages per connection
  maxMessages: 100,
  // Timeout in ms for connection
  connectionTimeout: 10000,
  // Timeout in ms for sending
  greetingTimeout: 30000
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    logger.error('Email service connection error:', error);
  } else {
    logger.info('Email service is ready to send messages');
  }
});

// Template cache
const templateCache = new Map();

/**
 * Load and compile an email template
 * @param {string} templateName - Name of the template file (without extension)
 * @returns {Promise<string>} Compiled template as string
 */
async function loadTemplate(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'emails',
      `${templateName}.html`
    );
    
    const template = await fs.readFile(templatePath, 'utf8');
    templateCache.set(templateName, template);
    return template;
  } catch (error) {
    logger.error(`Failed to load email template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
}

/**
 * Render template with provided context
 * @param {string} template - Template string
 * @param {Object} context - Context variables for the template
 * @returns {string} Rendered template
 */
function renderTemplate(template, context = {}) {
  try {
    // Simple template rendering with {{variable}} syntax
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  } catch (error) {
    logger.error('Template rendering error:', error);
    throw new Error('Failed to render email template');
  }
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Name of the template to use
 * @param {Object} [options.context={}] - Context variables for the template
 * @param {string} [options.text] - Plain text version of the email
 * @param {Object} [options.attachments] - Email attachments
 * @returns {Promise<Object>} Result of the send operation
 */
async function sendEmail({
  to,
  subject,
  template,
  context = {},
  text,
  attachments
}) {
  if (!to) {
    throw new Error('Recipient email is required');
  }

  if (!subject) {
    throw new Error('Email subject is required');
  }

  try {
    // Load and render template if provided
    let html;
    if (template) {
      const templateContent = await loadTemplate(template);
      html = renderTemplate(templateContent, context);
    }

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || (html ? stripHtml(html) : ''),
      attachments,
      // Add headers for better email deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk'
      },
      // Add list-unsubscribe header if needed
      list: process.env.UNSUBSCRIBE_EMAIL ? {
        unsubscribe: {
          url: `${process.env.APP_URL}/unsubscribe?email={{email}}`,
          comment: 'Unsubscribe from these emails'
        }
      } : undefined
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent to ${to} with message ID: ${info.messageId}`, {
      to,
      subject,
      messageId: info.messageId,
      envelope: info.envelope
    });

    return {
      success: true,
      messageId: info.messageId,
      envelope: info.envelope
    };
  } catch (error) {
    logger.error('Failed to send email:', error, {
      to,
      subject,
      template,
      error: error.message
    });
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Strip HTML tags from a string to create plain text
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Send a naming request confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.requestId - Naming request ID
 * @param {string} options.projectName - Project name
 * @param {string} options.submittedAt - Submission timestamp
 * @returns {Promise<Object>} Result of the send operation
 */
async function sendNamingRequestConfirmation({ to, requestId, projectName, submittedAt }) {
  return sendEmail({
    to,
    subject: `Naming Request Submitted: ${projectName}`,
    template: 'naming-request-confirmation',
    context: {
      requestId,
      projectName,
      submittedAt: new Date(submittedAt).toLocaleString(),
      appName: process.env.APP_NAME || 'Naming Ops',
      appUrl: process.env.APP_URL || 'https://naming-ops.example.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
    }
  });
}

/**
 * Send a naming request status update email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.requestId - Naming request ID
 * @param {string} options.projectName - Project name
 * @param {string} options.status - New status (e.g., 'approved', 'rejected')
 * @param {string} [options.notes] - Additional notes or comments
 * @returns {Promise<Object>} Result of the send operation
 */
async function sendNamingRequestStatusUpdate({ to, requestId, projectName, status, notes }) {
  const statusMap = {
    approved: { subject: 'approved', template: 'naming-request-approved' },
    rejected: { subject: 'requires changes', template: 'naming-request-rejected' },
    review: { subject: 'is under review', template: 'naming-request-in-review' },
    default: { subject: 'has been updated', template: 'naming-request-updated' }
  };

  const { subject: statusSubject, template } = statusMap[status] || statusMap.default;
  const subject = `Naming Request ${statusSubject}: ${projectName}`;

  return sendEmail({
    to,
    subject,
    template,
    context: {
      requestId,
      projectName,
      status,
      notes: notes || 'No additional notes provided.',
      appName: process.env.APP_NAME || 'Naming Ops',
      appUrl: process.env.APP_URL || 'https://naming-ops.example.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      currentYear: new Date().getFullYear()
    }
  });
}

module.exports = {
  sendEmail,
  sendNamingRequestConfirmation,
  sendNamingRequestStatusUpdate,
  // Export for testing
  _testExports: {
    renderTemplate,
    stripHtml,
    loadTemplate
  }
};
