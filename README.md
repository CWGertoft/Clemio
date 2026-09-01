# Cemio

Cemio är en B2B-plattform för hantverksföretag som vill skapa kalkyler och
professionella offerter snabbare. Det är inte en marknadsplats: företaget äger
sina kunder, prislistor och kalkyler. AI föreslår struktur, men avgör aldrig
priser eller ändrar en kalkyl utan ett aktivt användarval.

## Innehåll

- Next.js 16 App Router-webbapp med Supabase Auth och flerföretags-RLS
- Företagsuppstart, kunder, prisbibliotek och ljus/mörk/systemtema
- Manuella kalkyler med autosparning, radredigering, omläggning och dubblering
- Separat FastAPI-tjänst med `MockAIProvider` för altan, badrum, måleri, kök
  och markarbete
- AI-granskning med förslag som användaren accepterar eller avfärdar
- Offerter med sekventiella offertnummer, detaljerad/summerad vy och riktig PDF
- Exakta belopp via heltalsöre i appen och `numeric` i PostgreSQL

## Projektstruktur

```text
apps/web       Next.js-klienten och server actions
apps/ai        FastAPI AI-tjänst med provider-abstraktion
supabase       SQL-migrering och frivillig utvecklingsseed
docs           Drift- och säkerhetsdokumentation
```

## Kom igång lokalt

1. Skapa ett Supabase-projekt och kör
   `supabase/migrations/20260901113000_initial_cemio.sql` i SQL Editor, eller
   använd Supabase CLI i ett lokalt länkat projekt.
2. Kopiera `.env.example` till `apps/web/.env.local` och fyll i Supabase URL
   och **publishable key**. Lägg aldrig service-role-nyckeln i webbläsaren.
3. Kopiera `apps/ai/.env.example` till `apps/ai/.env`. Låt
   `AI_PROVIDER=mock` vara kvar.
4. Installera webbberoenden och starta apparna:

```bash
npm install
npm --workspace web run dev

python3 -m venv .venv
.venv/bin/pip install -r apps/ai/requirements.txt
AI_PROVIDER=mock PYTHONPATH=apps/ai .venv/bin/uvicorn app.main:app --reload --port 8000
```

Webbappen använder `http://localhost:3000` och AI-tjänsten
`http://localhost:8000`. Konfigurera i Supabase Auth att
`http://localhost:3000/auth/callback` och `/reset-password` är tillåtna
redirect-URL:er. Kör valfritt `supabase/seed.sql` efter att ett Auth-konto
skapats för att lägga in demo-data.

## Verifiering

```bash
npm --workspace web run lint
npm --workspace web run test
npm --workspace web run build
PYTHONPATH=apps/ai .venv/bin/python -m pytest apps/ai/app/tests -q
```

## Distribution

Distribuera `apps/web` som ett Vercel-projekt och lägg in samma publika
Supabase-variabler plus `AI_SERVICE_URL`. Distribuera `apps/ai` separat på
exempelvis Railway eller Render med `AI_PROVIDER=mock`. När den riktiga
providerintegrationen är klar kan `AI_PROVIDER=openai` väljas utan att
webbgränssnittet eller kalkylmotorn ändras.

Läs [säkerhetsdokumentationen](docs/security.md) före produktionsstart.
