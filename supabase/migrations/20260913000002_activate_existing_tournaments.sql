-- The organizer flow no longer exposes a draft tournament state.
update public.tournaments set status = 'activo' where status = 'borrador';
