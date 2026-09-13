-- Public round board is available from the round screen for every current tournament.
update public.tournaments set is_public = true where is_public = false;
