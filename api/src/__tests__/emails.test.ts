const mailer = require('../utils/emails.ts');

// Testing email systems

describe('Mail', () => {
  test('Running basic email to my own email', async () => {
    mailer.mail(
        (to = 'junkbox@ticketopia.armtech.dev'),
        (subject = 'test'),
        (body = 'test'),
    );
  });
});
