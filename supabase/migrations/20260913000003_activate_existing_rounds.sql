-- Existing review-only rounds become immediately editable active rounds.
update public.rounds set status = 'activa' where status = 'borrador';
