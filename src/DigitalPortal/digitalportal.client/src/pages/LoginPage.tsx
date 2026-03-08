import { useEffect, useState } from 'react';
import { Heading, Paragraph, Checkbox, Button, Spinner } from '@digdir/designsystemet-react';
import { getScopes, buildLoginUrl } from '../services/authService';
import type { ScopeDefinition } from '../types/auth';

type Language = 'nb' | 'en';

const categoryOrder = ['Grunnleggende', 'Altinn tilgangsstyring', 'Altinn klientdelegering'];

const categoryLabels: Record<string, Record<Language, string>> = {
  Grunnleggende: { nb: 'Grunnleggende', en: 'Basic' },
  'Altinn tilgangsstyring': { nb: 'Altinn tilgangsstyring', en: 'Altinn access management' },
  'Altinn klientdelegering': { nb: 'Altinn klientdelegering', en: 'Altinn client delegation' },
};

export default function LoginPage() {
  const [lang, setLang] = useState<Language>('nb');
  const [scopes, setScopes] = useState<ScopeDefinition[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(['openid']));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getScopes()
      .then((data) => {
        setScopes(data);
        // Pre-select required scopes
        setSelected(new Set(data.filter((s) => s.required).map((s) => s.scope)));
      })
      .catch(() => setError('Kunne ikke laste scopelisten.'))
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (scope: string, required: boolean) => {
    if (required) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(scope) ? next.delete(scope) : next.add(scope);
      return next;
    });
  };

  const handleLogin = () => {
    window.location.href = buildLoginUrl([...selected]);
  };

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    scopes: scopes.filter((s) => s.category === cat),
  }));

  const t = {
    nb: {
      title: 'Logg inn med ID-porten',
      subtitle: 'Velg hvilke tilganger (scopes) du vil inkludere i innloggingen. Disse avgjør hvilke funksjoner som er tilgjengelige i Altinn-API etter innlogging.',
      required: 'Påkrevd',
      optional: 'Valgfri',
      loginBtn: 'Logg inn med ID-porten',
      selected: 'valgt',
      scopeCount: (n: number) => `${n} scope${n === 1 ? '' : 's'} valgt`,
      note: 'Du vil bli sendt til ID-porten for autentisering. Etter innlogging returneres du til denne portalen.',
    },
    en: {
      title: 'Log in with ID-porten',
      subtitle: 'Choose which scopes to include in the login request. These determine which features are available in the Altinn API after logging in.',
      required: 'Required',
      optional: 'Optional',
      loginBtn: 'Log in with ID-porten',
      selected: 'selected',
      scopeCount: (n: number) => `${n} scope${n === 1 ? '' : 's'} selected`,
      note: 'You will be redirected to ID-porten for authentication and returned to this portal afterwards.',
    },
  }[lang];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1E4D8C' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <Heading level={1} data-size="lg">{t.title}</Heading>
          </div>
          <Paragraph className="text-gray-600">{t.subtitle}</Paragraph>
        </div>
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'nb' ? 'en' : 'nb')}
          className="flex-shrink-0 ml-4 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 cursor-pointer transition-colors"
        >
          {lang === 'nb' ? 'EN' : 'NO'}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner aria-label="Laster..." />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 mb-6">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          {/* Scope groups */}
          <div className="space-y-6 mb-8">
            {grouped.map(({ category, scopes: categoryScopes }) => (
              <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {categoryLabels[category]?.[lang] ?? category}
                  </span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {categoryScopes.map((s) => {
                    const isSelected = selected.has(s.scope);
                    const title = lang === 'nb' ? s.title : s.titleEn;
                    const description = lang === 'nb' ? s.description : s.descriptionEn;
                    return (
                      <li
                        key={s.scope}
                        className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${
                          s.required ? 'opacity-70' : 'hover:bg-blue-50'
                        } ${isSelected && !s.required ? 'bg-blue-50/50' : ''}`}
                        onClick={() => toggle(s.scope, s.required)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={s.required}
                          onChange={() => toggle(s.scope, s.required)}
                          aria-label={title}
                          className="mt-0.5 flex-shrink-0"
                          value={s.scope}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 text-sm">{title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.required
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {s.required ? t.required : t.optional}
                            </span>
                          </div>
                          <code className="text-xs text-gray-400 font-mono block mt-0.5">{s.scope}</code>
                          <Paragraph data-size="sm" className="text-gray-600 mt-1">{description}</Paragraph>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Summary + action */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">{t.scopeCount(selected.size)}</span>
              <div className="flex flex-wrap gap-1.5">
                {[...selected].map((sc) => (
                  <code key={sc} className="text-xs bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-700 font-mono">
                    {sc}
                  </code>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              data-size="lg"
              className="w-full justify-center"
              style={{ backgroundColor: '#1E4D8C' }}
              onClick={handleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t.loginBtn}
            </Button>

            <Paragraph data-size="sm" className="text-gray-500 mt-3 text-center">{t.note}</Paragraph>
          </div>
        </>
      )}
    </div>
  );
}
