-- Milene Hinnete Dashboard — Seed data
-- Run this AFTER schema.sql in the Supabase SQL editor

-- Insert the 13 existing problem grades with explicit UUIDs
insert into grades (id, subject, grade, grade_type, graded_at, deadline, description) values
(
  '00000000-0000-0000-0000-000000000001',
  'Eesti keel',
  'MA',
  'Tunnihinne',
  '2026-03-04',
  '2026-03-17',
  'Puudusid tunnist, mistõttu on tegemata jutustav tekst. Küsimuste korral tule esmaspäeval kell 15.00 konsultatsiooni klassis 139 või astu läbi vahetunnis. Ootan sinu jutustavat teksti hiljemalt 17. märtsiks. Võta tekst tundi kaasa.'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Loodusõpetus',
  '2',
  'Kontrolltöö',
  '2026-02-20',
  '2026-03-16',
  'Arvutusülesanded (kiirus, aeg, teepikkus) sooritatud 20%. Töö osad: teksti mõistmine ja sealt tulenevalt andmed, otsitav suurus ja mõõtühik, lahendus ja põhivalem, tehe ja mõõtühikud, vastus. Töös saab kasutada taskuarvutit ja valemeid. Järelvastamisele on eelnev registreerimine hiljemalt neljapäevaks kell 18.00. Tööd saab uuesti sooritada kuni 16.03.2026.'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Matemaatika',
  '0',
  'Hindeline ülesanne',
  '2026-03-13',
  '2026-03-30',
  'Teadmiste kontroll on tegemata. Järelvastamine võimalik 23.03 või 30.03. Konsultatsioon iga K kell 12:00–13:00. Õpitulemused: funktsioonide nimetamine (võrdeline seos, lineaarfunktsioon, pöördvõrdeline seos), omaduste rakendamine, kordaja a ja vabaliikme b tähendus, graafikute joonestamine, punkti asukoha kontrollimine, lõikepunkti leidmine.'
),
(
  '00000000-0000-0000-0000-000000000004',
  'A-võõrkeel',
  '7/14',
  'Hindeline ülesanne',
  '2026-03-13',
  null,
  'Revise "good-better-the best". Kirjutasid 0/4 lauset. Omadussõna võrdlusastmed, too.. (liiga..), enough (piisavalt), as..as (sama..kui), ..than (..kui). Grammar exercises: SB p 53.'
),
(
  '00000000-0000-0000-0000-000000000005',
  'Inimeseõpetus',
  '1',
  'Hindeline ülesanne',
  '2026-03-12',
  null,
  'Ristsõna esitamata.'
),
(
  '00000000-0000-0000-0000-000000000006',
  'Inimeseõpetus',
  '1',
  'Hindeline ülesanne',
  '2026-02-16',
  null,
  'Ristsõna esitamata.'
),
(
  '00000000-0000-0000-0000-000000000007',
  'B-keel (Vene keel)',
  '1*',
  'Tunnihinne',
  '2026-03-06',
  '2026-02-16',
  'Tunnikontroll teemal Tegusõna. Minevik/Tulevik / Глагол. Прошедшее время. Будущее время / Дни недели. Tähtaeg järelvastamiseks oli 16.02.2026.'
),
(
  '00000000-0000-0000-0000-000000000008',
  'B-keel (Vene keel)',
  '1*',
  'Tunnihinne',
  '2026-02-19',
  '2026-01-26',
  'Laul Моя неделя vastamine peast. Tähtaeg oli 26.01.2026.'
),
(
  '00000000-0000-0000-0000-000000000009',
  'Informaatika',
  '0',
  'Tunnihinne',
  '2026-03-02',
  null,
  'Digipädevuse analüüsi töö on esitamata. Tunni kuupäev: 15.12.2025. Eesmärgid: miks on vaja hinnata oma digipädevust; kuidas hinnata oma digipädevust; mida teha peale digipädevuse hindamist. Arutame rühmatöö käigus digipädevusmudeli osasid.'
),
(
  '00000000-0000-0000-0000-000000000010',
  'Loodusõpetus',
  'MA*',
  'Hindeline ülesanne',
  '2026-02-17',
  '2026-02-09',
  'IÕP: Mehaaniline liikumine esitamata. Ülesanne: vaata videot (YouTube). Koosta vihikusse kokkuvõte: 1) Mõisted ja näited 2) Valemid ja selgitused 3) Tavapäevaelu näited. Kokkuvõte peab olema loov ja kasutama erivõtteid. NB! Trükitud ja AI tekste ei võeta vastu.'
),
(
  '00000000-0000-0000-0000-000000000011',
  'Loodusõpetus',
  'MA*',
  'Hindeline ülesanne',
  '2026-02-17',
  null,
  'Esitatud fail ei ole avatav. Palun esitada korrektne fail uuesti.'
),
(
  '00000000-0000-0000-0000-000000000012',
  'Loodusõpetus',
  '1*',
  'Hindeline ülesanne',
  '2026-02-17',
  '2025-11-07',
  'Suuline kontroll: Eesliited (Tera kuni deka): T, G, M, k, h, da. Õpilane puudus tervisliku seisundi tõttu. Tähtaeg möödas.'
),
(
  '00000000-0000-0000-0000-000000000013',
  'Loodusõpetus',
  '2',
  'Perioodihinne',
  '2026-02-17',
  null,
  'I perioodi perioodihinne on 2.'
);

-- Insert open status for all 13 grades
insert into grade_status (grade_id, status, updated_by, created_at) values
('00000000-0000-0000-0000-000000000001', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000002', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000003', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000004', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000005', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000006', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000007', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000008', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000009', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000010', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000011', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000012', 'open', 'system', now()),
('00000000-0000-0000-0000-000000000013', 'open', 'system', now());
