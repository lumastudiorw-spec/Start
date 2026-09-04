-- Rate limiting: fixed-window hit counter. A row is one (key, window)
-- pair; the app rounds "now" down to the window boundary and upserts.
-- Not atomic under heavy concurrency, which is fine at this project's
-- scale (a couple of dozen interview participants, not public traffic).

create table rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);

alter table rate_limit_hits enable row level security;
