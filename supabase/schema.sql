-- =====================================================================
-- 자체평가 표기 정정기 - Supabase 테이블과 관리자 함수
-- 기존 프로젝트(cheongam-app-hub)와 겹치지 않도록 테이블·함수 이름 앞에 jjg_ 를 붙였습니다
-- Supabase 대시보드 > SQL Editor > New query 에 전체를 붙여 넣고 Run
-- !! 맨 아래 "관리자 비밀번호" 부분의 '여기에-비밀번호' 를 꼭 바꾸고 실행하세요 !!
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) 관리자 비밀번호 보관 (누구도 직접 읽을 수 없음)
create table if not exists jjg_settings (
  key   text primary key,
  value text not null
);
alter table jjg_settings enable row level security;
-- 정책을 만들지 않으므로 앱에서 읽기·쓰기 불가 (함수만 사용)

-- 2) 학교 표기 사전
create table if not exists jjg_terms (
  id         bigint generated always as identity primary key,
  kind       text not null default '규정명',
  wrong      text not null,
  correct    text not null,
  note       text,
  created_at timestamptz not null default now()
);
alter table jjg_terms enable row level security;
drop policy if exists "누구나 읽기" on jjg_terms;
create policy "누구나 읽기" on jjg_terms for select using (true);

-- 3) 추가 규칙
create table if not exists jjg_rules (
  id         bigint generated always as identity primary key,
  name       text not null,
  mode       text not null default 'all' check (mode in ('all','list','status','file')),
  kind       text not null default 'fix' check (kind in ('fix','warn')),
  find       text not null,
  is_regex   boolean not null default false,
  replace    text,
  message    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table jjg_rules enable row level security;
drop policy if exists "누구나 읽기" on jjg_rules;
create policy "누구나 읽기" on jjg_rules for select using (true);

-- 4) 정정 기록
create table if not exists jjg_history (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  author     text not null,
  mode       text not null,
  original   text not null,
  corrected  text not null,
  fix_count  int  not null default 0,
  warn_count int  not null default 0
);
alter table jjg_history enable row level security;
drop policy if exists "누구나 읽기" on jjg_history;
drop policy if exists "누구나 저장" on jjg_history;
create policy "누구나 읽기" on jjg_history for select using (true);
create policy "누구나 저장" on jjg_history for insert with check (char_length(original) <= 20000);

-- 5) 관리자 함수 (비밀번호가 맞을 때만 추가·수정·삭제)
create or replace function jjg_admin_ok(pw text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from jjg_settings
                 where key = 'admin_password_hash' and value = extensions.crypt(pw, value));
$$;

create or replace function jjg_save_term(pw text, p_id bigint, p_kind text, p_wrong text, p_correct text, p_note text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not jjg_admin_ok(pw) then raise exception '관리자 비밀번호가 맞지 않습니다'; end if;
  if p_id is null then
    insert into jjg_terms(kind, wrong, correct, note) values (p_kind, p_wrong, p_correct, p_note);
  else
    update jjg_terms set kind = p_kind, wrong = p_wrong, correct = p_correct, note = p_note where id = p_id;
  end if;
end $$;

create or replace function jjg_delete_term(pw text, p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not jjg_admin_ok(pw) then raise exception '관리자 비밀번호가 맞지 않습니다'; end if;
  delete from jjg_terms where id = p_id;
end $$;

create or replace function jjg_save_rule(pw text, p_id bigint, p_name text, p_mode text, p_kind text, p_find text,
  p_is_regex boolean, p_replace text, p_message text, p_active boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not jjg_admin_ok(pw) then raise exception '관리자 비밀번호가 맞지 않습니다'; end if;
  if p_id is null then
    insert into jjg_rules(name, mode, kind, find, is_regex, replace, message, active)
    values (p_name, p_mode, p_kind, p_find, p_is_regex, p_replace, p_message, p_active);
  else
    update jjg_rules set name = p_name, mode = p_mode, kind = p_kind, find = p_find, is_regex = p_is_regex,
      replace = p_replace, message = p_message, active = p_active where id = p_id;
  end if;
end $$;

create or replace function jjg_delete_rule(pw text, p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not jjg_admin_ok(pw) then raise exception '관리자 비밀번호가 맞지 않습니다'; end if;
  delete from jjg_rules where id = p_id;
end $$;

create or replace function jjg_delete_history(pw text, p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not jjg_admin_ok(pw) then raise exception '관리자 비밀번호가 맞지 않습니다'; end if;
  delete from jjg_history where id = p_id;
end $$;

-- 6) 관리자 비밀번호 설정  ← '여기에-비밀번호' 를 원하는 비밀번호로 바꾸세요
insert into jjg_settings(key, value)
values ('admin_password_hash', extensions.crypt('여기에-비밀번호', extensions.gen_salt('bf')))
on conflict (key) do update set value = excluded.value;
