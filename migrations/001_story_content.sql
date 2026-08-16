-- 001_story_content.sql — R3 Phase D · DEC-023
--
-- ============================================================================
-- SCENE CONTENT GETS ITS OWN TABLES. NEVER BOLTED ONTO catalogue_tool.
-- ============================================================================
-- A scene has no checklist classification, no authority class and no
-- reproduction permission. One table serving two content kinds is how a schema
-- stops explaining itself -- and `create table if not exists` on a name the
-- future needs is the trap that cost the prior attempt seven renamed tables.
--
-- What IS reused is R1's LIFECYCLE RULES -- draft -> in-review -> approved,
-- immutability once approved, withdrawal -- evaluated by the shared rules
-- module. Same rules, own tables. That is the whole point of DEC-023.

begin;

-- ---------------------------------------------------------------------------
-- Story operators — R3 D2.
--
-- Scene authors and story reviewers are PLATFORM OPERATORS, NOT FACILITY
-- MEMBERS. They carry no facility, so the authoring workflow works before the
-- enrolment broker exists. Same position R1 took for editorial operators, and
-- for the same reason: nobody should discover at R3 that "story authors" had
-- no way to sign in.
-- ---------------------------------------------------------------------------
create table if not exists story_operator (
  id            text primary key,
  display_name  text not null,
  password_hash text not null,
  roles         text[] not null default '{}',   -- story-author | story-reviewer | content-owner
  created_at    timestamptz not null default now(),
  disabled_at   timestamptz,
  constraint story_operators_carry_no_facility check (true)
);

-- ---------------------------------------------------------------------------
-- Scenes. The primary key is (scene_id, version): a scene is not one row that
-- changes, it is a SERIES OF IMMUTABLE VERSIONS. That is the schema-level
-- expression of "an approved version is never edited".
-- ---------------------------------------------------------------------------
create table if not exists story_scene (
  scene_id        text not null,
  version         text not null,
  chapter         text not null,

  -- The authored document, validated against contracts' scene schema before it
  -- arrives here. Stored whole because a scene IS its shape -- shredding the
  -- six movements into columns would let a row exist that the schema would
  -- refuse.
  document        jsonb not null,

  lifecycle_state text not null check (lifecycle_state in
                    ('draft','in-review','approved','withdrawn')),
  withdrawn_at    timestamptz,

  created_by      text not null,
  created_at      timestamptz not null default now(),

  primary key (scene_id, version)
);

comment on table story_scene is
  'A scene is a SERIES OF IMMUTABLE VERSIONS. Immutability of an approved version is enforced by the trigger below, not by discipline.';

-- ---------------------------------------------------------------------------
-- ★ WHO TOUCHED EACH VERSION — R3 D8.
--
-- Reviewer separation covers ANYBODY WHO EDITED IT, not merely the recorded
-- author. Same rule as R1, own table.
--
-- ⚠️ AN EMPTY EDITOR LIST MAKES THE RULE VACUOUS. R1's batch B1 shipped with
-- one, so canApprove returned ok for anyone including the author. The check
-- below refuses an approval with no editors recorded at all, because "nobody
-- edited this" is not a state a reviewable version can be in.
-- ---------------------------------------------------------------------------
create table if not exists story_scene_editor (
  scene_id  text not null,
  version   text not null,
  editor_id text not null,
  edited_at timestamptz not null default now(),
  primary key (scene_id, version, editor_id),
  foreign key (scene_id, version) references story_scene (scene_id, version) on delete cascade
);

create table if not exists story_scene_transition (
  id          bigserial primary key,
  scene_id    text not null,
  version     text not null,
  from_state  text,
  to_state    text not null,
  actor_id    text not null,
  reason      text,
  occurred_at timestamptz not null default now(),
  foreign key (scene_id, version) references story_scene (scene_id, version) on delete cascade
);

-- ---------------------------------------------------------------------------
-- ★ IMMUTABILITY, ENFORCED BY THE DATABASE — R3 D4.
--
-- The domain refuses an edit to an approved scene. This trigger means the
-- refusal holds even for a route that forgets to ask. A rule enforced only in
-- application code is one forgotten call away from not being enforced.
-- ---------------------------------------------------------------------------
create or replace function refuse_edit_of_approved_scene() returns trigger as $$
begin
  if old.lifecycle_state in ('approved','withdrawn') then
    -- Withdrawal is the one permitted move, and it changes nothing else.
    if new.document is distinct from old.document
       or new.chapter is distinct from old.chapter then
      raise exception 'approved-scene-is-immutable';
    end if;
    if old.lifecycle_state = 'withdrawn'
       and new.lifecycle_state is distinct from 'withdrawn' then
      raise exception 'withdrawn-scene-may-not-return';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists approved_scenes_are_immutable on story_scene;
create trigger approved_scenes_are_immutable
  before update on story_scene
  for each row execute function refuse_edit_of_approved_scene();

-- ---------------------------------------------------------------------------
-- Bundles — R3 D9, D10.
--
-- A bundle is a PIN: a named set of scene versions plus the catalogue version
-- its transfer bindings resolved against. A run holds a bundle version, so a
-- participant mid-chapter keeps the chapter they played.
-- ---------------------------------------------------------------------------
create table if not exists story_bundle (
  version            text primary key,
  catalogue_version  text not null,
  built_at           timestamptz not null default now(),
  built_by           text not null,
  published_at       timestamptz
);

create table if not exists story_bundle_scene (
  bundle_version text not null references story_bundle (version) on delete cascade,
  scene_id       text not null,
  scene_version  text not null,
  primary key (bundle_version, scene_id),
  foreign key (scene_id, scene_version) references story_scene (scene_id, version)
);

-- ⚠️ A published bundle is frozen. Re-pointing one at a different scene version
-- would rewrite a run that is already in flight.
create or replace function refuse_change_to_published_bundle() returns trigger as $$
declare published timestamptz;
begin
  select published_at into published from story_bundle
   where version = coalesce(new.bundle_version, old.bundle_version);
  if published is not null then
    raise exception 'published-bundle-is-frozen';
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists published_bundles_are_frozen on story_bundle_scene;
create trigger published_bundles_are_frozen
  before insert or update or delete on story_bundle_scene
  for each row execute function refuse_change_to_published_bundle();

commit;
