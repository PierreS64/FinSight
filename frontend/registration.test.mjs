import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as web from './web/src/registration.ts';
import * as mobile from './mobile/src/registration.ts';

for (const [client, registration] of [['web', web], ['mobile', mobile]]) {
  test(`${client}: trims full name and email for a valid registration`, () => {
    assert.deepEqual(registration.validateRegistration('  Ada Lovelace  ', '  Ada@example.com  ', 'strong-password'), {
      ok: true,
      fullName: 'Ada Lovelace',
      email: 'Ada@example.com',
    });
  });

  test(`${client}: rejects missing or oversized names, invalid email, and short password`, () => {
    for (const [name, email, password] of [
      ['  ', 'ada@example.com', 'strong-password'],
      ['a'.repeat(101), 'ada@example.com', 'strong-password'],
      ['Ada', 'not-an-email', 'strong-password'],
      ['Ada', 'ada@example.com', 'short'],
    ]) {
      assert.equal(registration.validateRegistration(name, email, password).ok, false);
    }
  });

  test(`${client}: pending and duplicate results reveal no account existence`, () => {
    const pending = registration.registrationOutcome({ user: { id: 'fake-or-real' }, session: null }, null);
    const duplicate = registration.registrationOutcome({ user: null, session: null }, { code: 'user_already_exists' });
    const emailExists = registration.registrationOutcome({ user: null, session: null }, { code: 'email_exists' });
    assert.equal(pending.kind, 'pending');
    assert.deepEqual(duplicate, pending);
    assert.deepEqual(emailExists, pending);
    assert.equal(pending.message.includes('fake-or-real'), false);
  });

  test(`${client}: an immediate session is authenticated and missing data is an error`, () => {
    assert.equal(registration.registrationOutcome({ user: {}, session: {} }, null).kind, 'authenticated');
    assert.equal(registration.registrationOutcome({ user: null, session: null }, null).kind, 'error');
  });

  test(`${client}: maps Supabase errors to safe messages`, () => {
    assert.match(registration.registrationOutcome({ user: null, session: null }, { code: 'weak_password' }).message, /Password/);
    assert.match(registration.registrationOutcome({ user: null, session: null }, { status: 429 }).message, /Too many/);
    assert.match(registration.registrationOutcome({ user: null, session: null }, { code: 'over_email_send_rate_limit' }).message, /Too many/);
    assert.match(registration.registrationOutcome({ user: null, session: null }, { status: 503 }).message, /unavailable/);
    assert.match(registration.signInErrorMessage({ code: 'email_not_confirmed' }), /Confirm your email/);
    assert.equal(registration.registrationOutcome({ user: null, session: null }, { code: 'unknown_provider_error' }).message.includes('unknown_provider_error'), false);
  });
}
