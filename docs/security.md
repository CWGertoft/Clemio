# Säkerhet och dataisolering

Alla affärstabeller är företagsägda. Supabase RLS är aktiverat på `companies`,
`customers`, `labor_rates`, `materials`, `calculations`, `calculation_items`,
`calculation_reviews`, `calculation_review_items`, `quotes` och `quote_items`.

Policys använder en privat, auth-kontrollerad medlemskontroll mot
`company_members`. Det innebär att en publicerad klientnyckel inte kan läsa
eller ändra data för ett annat företag, även om någon gissar ett UUID. Server
Actions gör dessutom samma behörighetskontroll i flöden där en kund eller
kalkyl kopplas ihop.

`create_company_with_owner` och `next_quote_number` är de enda avsiktliga
säkerhetsdefinierade databasoperationerna. Båda kräver en autentiserad användare
och är begränsade till den aktuella användarens medlemskap. Offertnummer räknas
atomiskt i databasen per företag och år, vilket undviker kollisioner vid
samtidiga offertskapanden.

Innan produktionsstart ska migreringen köras i ett separat Supabase-projekt och
RLS kontrolleras med två testanvändare: skapa data som företag A, byt session
till företag B, och bekräfta att varje `select`, `insert`, `update` och
`delete` mot A:s UUID nekas eller returnerar noll rader.
