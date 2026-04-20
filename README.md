# DigitalPortal

Referanseimplementasjon som demonstrerer hvordan en tjenesteeier kan integrere mot **Altinns tjenesteeier-API** (Access Management og Client Delegations) med **pålogging via ID-porten** og **scope-basert tilgangsstyring**.

Applikasjonen viser hele flyten fra innlogging med valgte OAuth-scopes, videre token-veksling til Altinn-plattformtoken, og kall mot Altinns moderne tilgangsstyrings-API-er på vegne av innlogget bruker.

---

## Hva prosjektet demonstrerer

| Område | Hva vises |
|---|---|
| **Scope-valg ved pålogging** | Brukeren velger granulære Altinn-scopes før redirect til ID-porten. Kun det som er valgt kommer med i access token. |
| **PKCE-flow mot ID-porten** | Authorization Code + PKCE (S256), state-validering, `code_verifier` lagret i kortlivet HttpOnly-cookie. |
| **Token-veksling til Altinn** | ID-porten access token byttes inn til Altinn plattformtoken via `/authentication/api/v1/exchange/id-porten`. |
| **Tjenesteeier-API (Access Management)** | Lese autoriserte parter, opprette/slette forbindelser, delegere tilgangspakker, sjekke delegeringsrett. |
| **Client Delegations** | Service owner-perspektiv: hente klienter en organisasjon har tilgang til å agere på vegne av. |
| **Token-introspeksjon** | Dekoding av JWT-claims (sub, scope, exp, aud, iss) vises i UI etter innlogging. |
| **Automatisk token-refresh** | Klient-hook som fornyer token før utløp. |

---

## Arkitektur

```
┌─────────────────────────┐      ┌────────────────────────┐      ┌─────────────────────┐
│  React-klient (Vite)    │ ───► │  ASP.NET Core backend  │ ───► │  ID-porten (test)   │
│  digitalportal.client   │      │  DigitalPortal.Server  │      │  platform.tt02      │
│                         │      │                        │      │  altinn.no          │
│  - LoginPage (scopes)   │      │  - AuthController      │      └─────────────────────┘
│  - AuthCallbackPage     │      │  - TokenService        │
│  - AutoriserteParter    │      │  - AccessManagement..  │
│  - ConnectionsPage      │      │  - Connections..       │
│  - MyClientsPage        │      │  - ClientDelegations.. │
└─────────────────────────┘      └────────────────────────┘
```

- **Backend**: .NET 10 / ASP.NET Core – [DigitalPortal.Server](src/DigitalPortal/DigitalPortal.Server/)
- **Frontend**: React 19 + TypeScript + Vite, Digdir designsystem – [digitalportal.client](src/DigitalPortal/digitalportal.client/)
- **Kontrakter**: Autogenererte DTO-er som speiler Altinn sine API-modeller – [Altinn.Authorization.Api.Contracts](src/DigitalPortal/Altinn.Authorization.Api.Contracts/)
- **API-spesifikasjoner**: OpenAPI-dokumenter fra Altinn – [swagger/](swagger/)

---

## Pålogging med scope

Scope-katalogen er definert i [AuthController.cs](src/DigitalPortal/DigitalPortal.Server/Controllers/AuthController.cs) og presenteres for brukeren i [LoginPage.tsx](src/DigitalPortal/digitalportal.client/src/pages/LoginPage.tsx). Brukeren huker av hvilke rettigheter applikasjonen skal be om, og kun valgte scopes følger med i autorisasjonsforespørselen.

| Scope | Beskrivelse |
|---|---|
| `openid`, `profile` | Standard OIDC-scopes |
| `altinn:accessmanagement/authorizedparties` | Lese hvilke parter brukeren kan representere |
| `altinn:accessmanagement/enduser:connections:fromothers.read` / `.write` | Mottatte tilganger |
| `altinn:accessmanagement/enduser:connections:toothers.read` / `.write` | Gitte tilganger |
| `altinn:clientdelegations/myclients.read` / `.write` | Klientdelegering (tjenesteeier) |

### Flyt

1. Klienten henter tilgjengelige scopes fra `/api/auth/scopes` og lar brukeren velge.
2. Klienten kaller `/api/auth/login?scopes=...` som genererer `state` + `code_verifier`, lagrer dem i HttpOnly-cookies og redirecter til ID-porten med `code_challenge=S256`.
3. ID-porten redirecter tilbake til `/api/auth/callback` med `code`.
4. [TokenService](src/DigitalPortal/DigitalPortal.Server/Services/TokenService.cs) bytter koden inn mot ID-porten access/id/refresh-token.
5. Samme tjeneste bytter ID-porten access token inn til et **Altinn plattformtoken** via `/authentication/api/v1/exchange/id-porten`.
6. Begge tokens lagres i HttpOnly, Secure, SameSite=Strict cookies – ingen tokens i `localStorage`.

---

## Kall mot tjenesteeier-API

Alle kall mot Altinn går gjennom backend-controllere som kobler på Altinn plattformtoken som Bearer:

| Controller | Altinn-endepunkt | Formål |
|---|---|---|
| [AccessManagementController](src/DigitalPortal/DigitalPortal.Server/Controllers/AccessManagementController.cs) | `/accessmanagement/api/v1/enduser/authorizedparties` | Hent parter brukeren kan representere |
| [ConnectionsController](src/DigitalPortal/DigitalPortal.Server/Controllers/ConnectionsController.cs) | `/accessmanagement/api/v1/enduser/connections` | Opprett/slett/list forbindelser |
| [ConnectionPackagesController](src/DigitalPortal/DigitalPortal.Server/Controllers/ConnectionPackagesController.cs) | `/accessmanagement/api/v1/enduser/connections/accesspackages` | Delegering og delegation-check for tilgangspakker |
| [ClientDelegationsController](src/DigitalPortal/DigitalPortal.Server/Controllers/ClientDelegationsController.cs) | `/accessmanagement/api/v1/enduser/clientdelegations/my/clients` | Tjenesteeiers klientoversikt |

Scopet brukeren logget inn med avgjør hvilke av disse kallene som faktisk returnerer data – slik blir prinsippet om minste privilegium synliggjort i UI-et.

---

## Konfigurasjon

Innstillinger ligger i [appsettings.json](src/DigitalPortal/DigitalPortal.Server/appsettings.json):

```json
{
  "IdPorten": {
    "AuthorizationEndpoint": "https://login.test.idporten.no/authorize",
    "TokenEndpoint": "https://test.idporten.no/token",
    "ClientId": "<din klient>",
    "ClientSecret": "<sett i user-secrets / env>",
    "RedirectUri": "https://<host>/api/auth/callback",
    "PostLoginRedirectUri": "https://<host>/auth/callback"
  },
  "Altinn": {
    "TokenExchangeEndpoint": "https://platform.tt02.altinn.no/authentication/api/v1/exchange/id-porten",
    "AccessManagementBaseUrl": "https://platform.tt02.altinn.no"
  }
}
```

Prosjektet er konfigurert mot **test-miljøet** (ID-porten test + Altinn TT02). `ClientSecret` skal ikke sjekkes inn – bruk `dotnet user-secrets` eller miljøvariabler.

---

## Komme i gang

**Forutsetninger**: .NET 10 SDK, Node.js 20+, gyldig klient hos ID-porten med scopes aktivert i Altinn.

```bash
# Installer klient-avhengigheter
cd src/DigitalPortal/digitalportal.client
npm install

# Kjør hele løsningen (fra repo-rot)
dotnet run --project src/DigitalPortal/DigitalPortal.Server
```

Vite-klienten bygges og serveres av ASP.NET Core; SPA-fallback er satt opp i [Program.cs](src/DigitalPortal/DigitalPortal.Server/Program.cs).

---

## Prosjektstruktur

```
src/DigitalPortal/
├── DigitalPortal.Server/              ASP.NET Core backend
│   ├── Controllers/                   Auth + proxy mot Altinn
│   ├── Services/                      TokenService, AccessManagement, Connections, ...
│   ├── Models/
│   └── Program.cs
├── digitalportal.client/              React + Vite frontend
│   └── src/
│       ├── pages/                     LoginPage, AutoriserteParter, Connections, MyClients, ...
│       ├── components/
│       ├── hooks/                     useTokenRefresh m.fl.
│       └── services/
└── Altinn.Authorization.Api.Contracts/ Delte DTO-er mot Altinn-API-ene

swagger/                                OpenAPI-spesifikasjoner fra Altinn
```

---

## Sikkerhetsnotater

- Ingen tokens i `localStorage` – kun HttpOnly, Secure, SameSite=Strict cookies.
- PKCE med S256; `state` valideres ved callback.
- JWT-claims som vises i UI er dekodet uten signaturvalidering, kun for visning – autorisasjon skjer alltid hos Altinn.
- Alle klient-kall mot Altinn går via backend slik at Altinn plattformtokenet aldri eksponeres til nettleseren.
