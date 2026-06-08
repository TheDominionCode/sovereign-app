-- Per-admin permission grants. Each admin row gets an array of permission
-- keys (e.g. ['analytics','affiliates','community']) that says which admin
-- sections they can see. The owner role always has full access regardless of
-- this column — it's only consulted for the 'member' role.
--
-- Existing rows default to '{}' (empty array). The owner is unaffected. Any
-- pre-existing member admins will see nothing until you (the owner) open
-- /admin/admins and grant them specific permissions.

alter table public.admins
  add column if not exists permissions text[] not null default '{}';

-- Convenience: give the current owner row(s) the symbolic 'all' marker so
-- legacy code paths that read this column without knowing about the
-- role-based override still treat owners correctly. (Belt + suspenders.)
update public.admins
  set permissions = array['all']
  where role = 'owner' and not 'all' = any(permissions);
