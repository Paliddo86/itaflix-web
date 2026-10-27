import { useState } from 'react';

import { t } from '../lib/i18n.js';
import TMDB from '../lib/tmdb.js';
import { setSession } from '../lib/user.js';

/**
 * Login TMDB — port di itaflix-tvos/src/routes/tmdb-login.js:
 * request token → validate_with_login → session/new → dettagli account.
 * Le credenziali sono inviate esclusivamente a TMDB.
 */
export default function TmdbLogin({ onSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const requestToken = await TMDB.createRequestToken();
      const session = await TMDB.createSessionWithCredentials(
        username.trim(),
        password,
        requestToken,
      );
      const account = await TMDB.getAccountDetails(session.session_id);

      const stored = setSession({
        sessionId: session.session_id,
        accountId: account.id,
        username: account.username || username.trim(),
      });

      setPassword('');
      if (onSuccess) onSuccess(stored);
    } catch (err) {
      setError(err.message || t('my-login-error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit}>
      <h2>{t('my-login-title')}</h2>
      <p className="login-description">{t('my-login-description')}</p>

      <label className="login-field">
        <span>{t('my-login-username')}</span>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>

      <label className="login-field">
        <span>{t('my-login-password')}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error && <p className="inline-error">{error}</p>}

      <div className="login-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('my-login-busy') : t('my-login-submit')}
        </button>

        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t('back')}
          </button>
        )}
      </div>
    </form>
  );
}
