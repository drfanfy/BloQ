-- ============================================================
-- CRM VEB — Bucket Storage pour les documents liés aux négociations
-- Bucket privé "veb-documents" + policies scoping l'accès aux
-- utilisateurs authentifiés uniquement (storage.objects a RLS activée
-- par défaut sur tout le projet Supabase, on ne la désactive pas —
-- ça affecterait d'autres apps partageant le projet "Chantal").
-- ============================================================

insert into storage.buckets (id, name, public)
values ('veb-documents', 'veb-documents', false)
on conflict (id) do nothing;

create policy "veb-documents read"
on storage.objects for select
to authenticated
using (bucket_id = 'veb-documents');

create policy "veb-documents insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'veb-documents');

create policy "veb-documents delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'veb-documents');
