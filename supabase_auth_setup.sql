-- Supabase Auth 사용자 생성 시 자동으로 public.users 테이블에 슈퍼 관리자 권한 부여

-- 1) 기존 트리거가 있다면 삭제
drop trigger if exists on_auth_user_created on auth.users;

-- 2) 함수 생성: 새 사용자가 생성될 때 public.users 테이블에 슈퍼 관리자 권한으로 추가
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, status)
  values (
    new.id,
    new.email,
    case 
      when new.email = 'contact@watercharging.com' then '시스템 관리자'
      else '사용자'
    end,
    case 
      when new.email = 'contact@watercharging.com' then 'super_admin'
      else 'viewer'
    end,
    'active'
  );
  return new;
end;
$$;

-- 3) 트리거 생성: auth.users에 새 사용자가 생성될 때 실행
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) 기존 contact@watercharging.com 사용자가 있다면 슈퍼 관리자로 업데이트
insert into public.users (id, email, name, role, status)
select au.id, au.email, '시스템 관리자', 'super_admin', 'active'
from auth.users au
where au.email = 'contact@watercharging.com'
on conflict (id) do update set
  role = 'super_admin',
  name = '시스템 관리자',
  status = 'active',
  updated_at = now();

-- 5) RLS 정책 확인 (기존 정책이 제대로 작동하는지 확인)
-- users 테이블에 대한 정책이 이미 설정되어 있으므로 추가 설정 불필요