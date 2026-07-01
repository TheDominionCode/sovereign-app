-- Sprint 3: Daily Experience Engine
-- Four tables for admin-managed daily rotating content (bilingual, schedulable, active/inactive)

create table if not exists daily_principles (
  id          bigserial primary key,
  content_en  text        not null,
  content_es  text        not null,
  active      boolean     not null default true,
  display_date date       null,       -- null = eligible for random rotation; set for specific day
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists daily_reflections (
  id          bigserial primary key,
  content_en  text        not null,
  content_es  text        not null,
  active      boolean     not null default true,
  display_date date       null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists daily_questions (
  id          bigserial primary key,
  content_en  text        not null,
  content_es  text        not null,
  active      boolean     not null default true,
  display_date date       null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists daily_intentions (
  id          bigserial primary key,
  content_en  text        not null,
  content_es  text        not null,
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'daily_principles_updated_at') then
    create trigger daily_principles_updated_at before update on daily_principles for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'daily_reflections_updated_at') then
    create trigger daily_reflections_updated_at before update on daily_reflections for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'daily_questions_updated_at') then
    create trigger daily_questions_updated_at before update on daily_questions for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'daily_intentions_updated_at') then
    create trigger daily_intentions_updated_at before update on daily_intentions for each row execute function set_updated_at();
  end if;
end $$;

-- Row-level security: all reads are public (no auth needed for serving daily content),
-- writes restricted to service_role (admin API only)
alter table daily_principles   enable row level security;
alter table daily_reflections  enable row level security;
alter table daily_questions    enable row level security;
alter table daily_intentions   enable row level security;

create policy "public read daily_principles"  on daily_principles  for select using (true);
create policy "public read daily_reflections" on daily_reflections for select using (true);
create policy "public read daily_questions"   on daily_questions   for select using (true);
create policy "public read daily_intentions"  on daily_intentions  for select using (true);

-- Seed: principles
insert into daily_principles (content_en, content_es) values
  ('You were created for consistency, not convenience.', 'Fuiste creada para la consistencia, no para la conveniencia.'),
  ('Small actions taken daily become the legacy of a lifetime.', 'Las acciones pequeñas tomadas a diario se convierten en el legado de una vida.'),
  ('Discipline is not punishment — it is devotion to who you are becoming.', 'La disciplina no es castigo — es devoción a quien estás llegando a ser.'),
  ('Your habits are your autobiography. Write it with intention.', 'Tus hábitos son tu autobiografía. Escríbela con intención.'),
  ('The version of you that you want to be is already on the other side of your excuses.', 'La versión de ti que quieres ser ya está del otro lado de tus excusas.'),
  ('You don''t need permission to grow. You need practice.', 'No necesitas permiso para crecer. Necesitas práctica.'),
  ('Rest is not retreat. It is fuel for the next move.', 'El descanso no es retroceso. Es combustible para el próximo movimiento.'),
  ('The way you do one thing is the way you do everything.', 'La forma en que haces una cosa es la forma en que haces todo.'),
  ('Clarity comes from action, not thought alone.', 'La claridad viene de la acción, no solo del pensamiento.'),
  ('Every morning is a new agreement with who you choose to be.', 'Cada mañana es un nuevo acuerdo con quien eliges ser.'),
  ('Build so well that your work speaks before you do.', 'Construye tan bien que tu trabajo hable antes que tú.'),
  ('Comparison is the thief of your specific calling.', 'La comparación es el ladrón de tu llamado específico.'),
  ('Your standards protect your energy. Hold them.', 'Tus estándares protegen tu energía. Mantenlos.'),
  ('Discomfort is just the address where growth lives.', 'La incomodidad es simplemente la dirección donde vive el crecimiento.'),
  ('Gratitude is not a feeling — it is a practice that rewires your mind.', 'La gratitud no es un sentimiento — es una práctica que recablea tu mente.'),
  ('What you feed your mind shapes what you manifest.', 'Lo que alimentas a tu mente da forma a lo que manifiestas.'),
  ('The best investment you will ever make is in the person you are becoming.', 'La mejor inversión que jamás harás es en la persona en la que te estás convirtiendo.'),
  ('Urgency without clarity is just noise. Get clear first.', 'La urgencia sin claridad es solo ruido. Primero aclara.'),
  ('You are not behind. You are exactly where your next step begins.', 'No estás atrasada. Estás exactamente donde comienza tu próximo paso.'),
  ('Honor every version of yourself — especially the one that is still learning.', 'Honra cada versión de ti misma — especialmente la que todavía está aprendiendo.');

-- Seed: reflections
insert into daily_reflections (content_en, content_es) values
  ('Growth is rarely loud. Most days it looks like showing up, choosing again, and trusting the process when you cannot yet see the result.', 'El crecimiento rara vez es ruidoso. La mayoría de los días parece presentarse, elegir de nuevo y confiar en el proceso cuando aún no puedes ver el resultado.'),
  ('The woman you are becoming is watching every choice you make today. She is cheering for every small act of discipline you choose over comfort.', 'La mujer en la que te estás convirtiendo está observando cada elección que haces hoy. Ella anima cada pequeño acto de disciplina que eliges sobre la comodidad.'),
  ('Seasons of slowness are not signs of failure. They are the quiet work that makes the breakthrough visible.', 'Las temporadas de lentitud no son señales de fracaso. Son el trabajo silencioso que hace visible el avance.'),
  ('You were not built to shrink. Every time you play small, you delay the very thing the world is waiting for from you.', 'No fuiste construida para encogerte. Cada vez que juegas pequeño, retransas lo que el mundo está esperando de ti.'),
  ('The most powerful thing you can do is decide — and then act as though the outcome is already certain.', 'Lo más poderoso que puedes hacer es decidir — y luego actuar como si el resultado ya fuera cierto.'),
  ('Integrity means the same level of care whether someone is watching or not. That is where real character is built.', 'La integridad significa el mismo nivel de cuidado ya sea que alguien esté mirando o no. Ahí es donde se construye el carácter real.'),
  ('Your peace is not dependent on your circumstances. It is a practice you choose in the middle of them.', 'Tu paz no depende de tus circunstancias. Es una práctica que eliges en medio de ellas.'),
  ('The story you tell yourself every morning before you rise sets the tone for everything that follows. Choose it carefully.', 'La historia que te cuentas cada mañana antes de levantarte establece el tono para todo lo que sigue. Elígela cuidadosamente.'),
  ('Momentum is built through small, boring, repeated decisions. That is the secret that looks like luck from the outside.', 'El impulso se construye a través de pequeñas y aburridas decisiones repetidas. Ese es el secreto que parece suerte desde afuera.'),
  ('You are not waiting for the right time. The right time is always now — right where you are, with what you already have.', 'No estás esperando el momento correcto. El momento correcto es siempre ahora — justo donde estás, con lo que ya tienes.'),
  ('Rest is productive. A rested woman makes better decisions, shows up more fully, and serves from a place of overflow, not depletion.', 'El descanso es productivo. Una mujer descansada toma mejores decisiones y sirve desde un lugar de abundancia, no de agotamiento.'),
  ('Faith is not the absence of doubt. It is moving forward in spite of it. Trust the process you have set in motion.', 'La fe no es la ausencia de duda. Es avanzar a pesar de ella. Confía en el proceso que has puesto en movimiento.'),
  ('The boundaries you hold are not walls — they are declarations of what you value and who you intend to become.', 'Los límites que mantienes no son muros — son declaraciones de lo que valoras y de quien pretendes llegar a ser.'),
  ('Everything you are building today is the foundation someone you love will one day stand on. Build it with care.', 'Todo lo que estás construyendo hoy es el cimiento sobre el que alguien a quien amas algún día se parará. Constrúyelo con cuidado.'),
  ('You do not need to have everything figured out. You only need to take the next right step, and then the next.', 'No necesitas tener todo resuelto. Solo necesitas dar el siguiente paso correcto, y luego el siguiente.');

-- Seed: questions
insert into daily_questions (content_en, content_es) values
  ('What deserves your best attention today?', '¿Qué merece tu mejor atención hoy?'),
  ('What promise will you keep today?', '¿Qué promesa cumplirás hoy?'),
  ('Who are you becoming today?', '¿En quién te estás convirtiendo hoy?'),
  ('What would make today meaningful?', '¿Qué haría que hoy fuera significativo?'),
  ('What distraction can you release today?', '¿Qué distracción puedes liberar hoy?'),
  ('What one thing, if done well today, would make everything else easier?', '¿Qué única cosa, si se hace bien hoy, haría todo lo demás más fácil?'),
  ('Who needs you to show up fully today?', '¿Quién necesita que te presentes plenamente hoy?'),
  ('What habit are you building one rep at a time right now?', '¿Qué hábito estás construyendo una repetición a la vez ahora mismo?'),
  ('What would the best version of you do in the next hour?', '¿Qué haría la mejor versión de ti en la próxima hora?'),
  ('What are you tolerating that you need to stop tolerating?', '¿Qué estás tolerando que necesitas dejar de tolerar?'),
  ('What part of your vision will today move forward?', '¿Qué parte de tu visión hará avanzar hoy?'),
  ('What conversation have you been avoiding that would change everything?', '¿Qué conversación has estado evitando que lo cambiaría todo?'),
  ('What does rest and recovery look like for you today?', '¿Cómo se ve el descanso y la recuperación para ti hoy?'),
  ('What belief is holding you back that you are ready to release?', '¿Qué creencia te está frenando y estás lista para liberar?'),
  ('How will you celebrate a small win today?', '¿Cómo celebrarás una pequeña victoria hoy?'),
  ('Who in your life needs your gratitude today?', '¿Quién en tu vida necesita tu gratitud hoy?'),
  ('What are you building that your future self will thank you for?', '¿Qué estás construyendo por lo que tu yo futuro te agradecerá?'),
  ('What boundary do you need to hold — or set — today?', '¿Qué límite necesitas mantener — o establecer — hoy?'),
  ('What would it mean to show up with full presence today?', '¿Qué significaría presentarte con plena presencia hoy?'),
  ('What are you most afraid of doing today — and why might that be the exact thing to do?', '¿Qué es lo que más temes hacer hoy — y por qué podría ser exactamente lo que deberías hacer?');

-- Seed: intentions
insert into daily_intentions (content_en, content_es, sort_order) values
  ('Present',     'Presente',      1),
  ('Focused',     'Enfocada',      2),
  ('Peaceful',    'En paz',        3),
  ('Disciplined', 'Disciplinada',  4),
  ('Joyful',      'Con alegría',   5),
  ('Patient',     'Paciente',      6),
  ('Courageous',  'Con valentía',  7),
  ('Intentional', 'Intencional',   8),
  ('Grateful',    'Agradecida',    9);
