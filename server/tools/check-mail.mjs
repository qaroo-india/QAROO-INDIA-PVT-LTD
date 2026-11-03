/* global console, process */
/**
 * Checks the mail configuration without guessing.
 *
 *   node tools/check-mail.mjs                  # connect and authenticate only
 *   node tools/check-mail.mjs --send=you@x.com # also send one test message
 *
 * `verify()` completes the TLS handshake and the AUTH exchange and then stops,
 * so it proves the credential works without putting anything in anyone's inbox.
 * Sending only happens when --send is passed explicitly.
 *
 * Nothing here prints the password. A failure is matched to the thing that
 * usually causes it, because SMTP error text is rarely self-explanatory.
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } = process.env;
const sendTo = (process.argv.find((a) => a.startsWith('--send=')) || '').slice(7);

const port = Number(EMAIL_PORT) || 587;
const secure = EMAIL_SECURE === 'true';

console.log('configuration');
console.log('  host     :', EMAIL_HOST || '(not set)');
console.log('  port     :', port, secure ? '(implicit TLS)' : '(STARTTLS)');
console.log('  user     :', EMAIL_USER || '(not set)');
console.log('  password :', EMAIL_PASSWORD ? `set, ${EMAIL_PASSWORD.length} characters` : '(not set)');
console.log('  from     :', EMAIL_FROM || '(not set)');
console.log('');

// A mismatch here is the most common reason a relay accepts the login and then
// rejects the message.
if (EMAIL_FROM && EMAIL_USER && !EMAIL_FROM.includes(EMAIL_USER) && /secureserver/i.test(EMAIL_HOST || '')) {
  console.log('note: EMAIL_FROM does not contain EMAIL_USER. GoDaddy rejects a From');
  console.log('      address it has not authenticated. Brevo allows it once the domain');
  console.log('      is verified.');
  console.log('');
}

// 465 is implicit TLS and 587 is STARTTLS; crossing them hangs or fails oddly.
if ((port === 465 && !secure) || (port === 587 && secure)) {
  console.log(`warning: port ${port} with EMAIL_SECURE=${secure} is the wrong pairing.`);
  console.log('         Use 465 with true, or 587 with false.');
  console.log('');
}

if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
  console.log('Not fully configured, so the app logs emails to the console instead of');
  console.log('sending them. Set EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD to go live.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port,
  secure,
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
});

const explain = (message) => {
  const m = String(message);
  if (/invalid login|535|534|authentication failed|auth.*fail/i.test(m)) {
    return [
      'The server refused the credential.',
      '  - GoDaddy: this is the mailbox password; confirm it by signing in to webmail.',
      '  - Gmail: a normal password will not work, it needs a 16-character App Password.',
      '  - Brevo: use the SMTP key, not your Brevo account password.',
    ].join('\n');
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(m)) {
    return 'Could not reach the server: check the host spelling, the port, and whether outbound SMTP is blocked here.';
  }
  if (/self.signed|certificate/i.test(m)) {
    return 'TLS problem: usually the 465/587 pairing with EMAIL_SECURE being the wrong way round.';
  }
  if (/5\.7\.1|not authorized|relay/i.test(m)) {
    return 'Authenticated, but not allowed to send as that From address. Verify the sender or domain with the provider.';
  }
  return 'No specific cause matched; the server message above is the best clue.';
};

try {
  await transporter.verify();
  console.log('AUTH OK - the server accepted the connection and the credential.');
} catch (err) {
  console.log('FAILED:', err.message.split('\n')[0]);
  console.log('');
  console.log(explain(err.message));
  process.exit(1);
}

if (!sendTo) {
  console.log('');
  console.log('No message sent. Add --send=<address> to send one test email.');
  process.exit(0);
}

try {
  const info = await transporter.sendMail({
    from: EMAIL_FROM || EMAIL_USER,
    to: sendTo,
    subject: 'Qaroo India - mail configuration test',
    text: [
      'This is a test from the Qaroo India backend.',
      '',
      `Sent via ${EMAIL_HOST}:${port} as ${EMAIL_USER}.`,
      'If you are reading it, verification and password-reset emails will send.',
    ].join('\n'),
  });
  console.log('');
  console.log('SENT to', sendTo);
  console.log('  message id :', info.messageId);
  if (info.accepted?.length) console.log('  accepted   :', info.accepted.join(', '));
  if (info.rejected?.length) console.log('  rejected   :', info.rejected.join(', '));
  console.log('');
  console.log('Check the inbox, and the spam folder: a domain without SPF and DKIM for');
  console.log('this sender is usually filtered.');
} catch (err) {
  console.log('');
  console.log('AUTH worked but the send failed:', err.message.split('\n')[0]);
  console.log('');
  console.log(explain(err.message));
  process.exit(1);
}
