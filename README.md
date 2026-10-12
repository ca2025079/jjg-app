# 자체평가 표기 정정기

기관평가인증 편람(p.30~33, p.37)과 청암대학교 통일안에 맞춰
입증자료 목록 · 현황 및 분석결과 · 증빙파일명을 자동으로 정정하는 웹앱입니다.

## 파일 구성

| 파일 | 하는 일 |
|---|---|
| `index.html` | 화면 |
| `style.css` | 디자인 |
| `rules.js` | 정정 규칙 (편람 기준 규칙이 모두 여기에 있음) |
| `app.js` | 화면 동작, Supabase 연결 |
| `config.js` | **Supabase 주소와 키를 넣는 곳** |
| `supabase/schema.sql` | Supabase에 한 번 실행할 SQL |

## 배포 순서

### 1. Supabase
1. 기존 프로젝트 **cheongam-app-hub** 열기 (테이블·함수 이름이 모두 `jjg_`로 시작해서 기존 앱과 겹치지 않음)
2. 왼쪽 **SQL Editor** → **New query**
3. `supabase/schema.sql` 내용을 전부 붙여 넣기
4. 맨 아래 `'여기에-비밀번호'`를 관리자 비밀번호로 바꾸고 **Run**
5. **Project Settings → API** (또는 API Keys)에서 두 값을 복사
   - Project URL (`https://xxxx.supabase.co`)
   - anon public 키 또는 publishable 키 (`service_role`/`secret` 키는 절대 넣지 않음)

### 2. config.js 수정
```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_KEY: '복사한 anon(publishable) 키',
};
```

### 3. GitHub
1. 새 저장소 만들기 (예: `jjg-app`)
2. **Add file → Upload files**로 zip을 푼 파일을 **폴더 구조 그대로** 올리기
   (`index.html`이 저장소 맨 위에 있어야 함)

### 4. Vercel
1. **Add New → Project** → 방금 만든 GitHub 저장소 **Import**
2. Framework Preset: **Other**, 나머지는 그대로 → **Deploy**
3. 이후 GitHub에 파일을 다시 올리면 자동으로 다시 배포됨

## 관리자 비밀번호 바꾸기
Supabase SQL Editor에서 실행:
```sql
update jjg_settings
set value = extensions.crypt('새 비밀번호', extensions.gen_salt('bf'))
where key = 'admin_password_hash';
```

## 참고
- Supabase를 연결하지 않아도 기본 정정 기능은 그대로 동작합니다.
- 학교 표기 사전·추가 규칙은 누구나 볼 수 있고, 추가·삭제는 관리자 비밀번호가 있어야 합니다.
- 정정 기록은 [기록 저장]을 누른 것만 남습니다. 삭제는 관리자만 할 수 있습니다.
- 기록에는 작성한 문장이 그대로 저장되므로 실명 등 개인정보는 ○ 마스킹 후 저장하세요.
