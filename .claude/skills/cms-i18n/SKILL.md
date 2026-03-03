---
name: cms-i18n
description: CMS-UI 다국어 번역 작업을 지원합니다. 번역 키 추가, 수정, 다국어 파일 관리에 사용합니다. i18n, locales, 번역, translation 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# CMS-UI 다국어(i18n) 지원 Skill

## 개요
CMS-UI 프로젝트의 다국어 지원을 위한 번역 작업 가이드입니다.

## 지원 언어
| 코드 | 언어 | 파일 경로 |
|------|-----|----------|
| ko | 한국어 (기본) | `frontend/src/locales/ko/*.json` |
| en | English | `frontend/src/locales/en/*.json` |
| it | Italiano | `frontend/src/locales/it/*.json` |
| ja | 日本語 | `frontend/src/locales/ja/*.json` |
| zh-CN | 简体中文 | `frontend/src/locales/zh-CN/*.json` |
| zh-TW | 繁體中文 | `frontend/src/locales/zh-TW/*.json` |

## 번역 파일 구조
```
frontend/src/locales/
├── ko/
│   ├── common.json      # 공통 UI 텍스트
│   ├── dashboard.json   # 대시보드 관련
│   ├── devices.json     # 기기 관리
│   ├── products.json    # 상품 관리
│   ├── organization.json # 조직 관리
│   ├── users.json       # 사용자 관리
│   └── errors.json      # 에러 메시지
├── en/
│   └── ... (동일 구조)
└── ... (기타 언어)
```

## 번역 키 추가 워크플로우

### 1단계: 키 설계
```json
// 네이밍 컨벤션: camelCase 또는 dot.notation
{
  "pageTitle": "페이지 제목",
  "buttons.save": "저장",
  "buttons.cancel": "취소",
  "messages.success": "성공적으로 처리되었습니다",
  "validation.required": "필수 입력 항목입니다"
}
```

### 2단계: 모든 언어 파일에 동시 추가
**중요**: 새 키 추가 시 반드시 6개 언어 모두에 추가해야 합니다.

### 3단계: React 컴포넌트에서 사용
```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation('common'); // namespace

  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      <button>{t('buttons.save')}</button>
    </div>
  );
};
```

## 번역 키 검색 명령

### 사용되지 않는 키 찾기
```bash
# 특정 키가 코드에서 사용되는지 확인
grep -r "t('keyName')" frontend/src/
```

### 누락된 번역 찾기
```bash
# ko와 en 파일 비교
diff <(jq -r 'keys[]' frontend/src/locales/ko/common.json) \
     <(jq -r 'keys[]' frontend/src/locales/en/common.json)
```

## 번역 작업 체크리스트

- [ ] 한국어(ko) 기준으로 키와 값 작성
- [ ] 영어(en) 번역 추가
- [ ] 이탈리아어(it) 번역 추가
- [ ] 일본어(ja) 번역 추가
- [ ] 중국어 간체(zh-CN) 번역 추가
- [ ] 중국어 번체(zh-TW) 번역 추가
- [ ] JSON 문법 검증 (쉼표, 따옴표)
- [ ] 컴포넌트에서 사용 확인

## 주의사항

1. **JSON 문법**: 마지막 항목에 쉼표 금지
2. **인코딩**: UTF-8 필수
3. **플레이스홀더**: `{{변수명}}` 형식 사용
   ```json
   {
     "greeting": "안녕하세요, {{name}}님"
   }
   ```
4. **복수형**: 영어의 경우 `_plural` 접미사 사용
   ```json
   {
     "item": "{{count}} item",
     "item_plural": "{{count}} items"
   }
   ```

## 자주 사용하는 번역 패턴

### 버튼 텍스트
| 키 | ko | en | it | ja |
|---|---|---|---|---|
| save | 저장 | Save | Salva | 保存 |
| cancel | 취소 | Cancel | Annulla | キャンセル |
| delete | 삭제 | Delete | Elimina | 削除 |
| edit | 수정 | Edit | Modifica | 編集 |
| add | 추가 | Add | Aggiungi | 追加 |
| confirm | 확인 | Confirm | Conferma | 確認 |
| close | 닫기 | Close | Chiudi | 閉じる |

### 메시지
| 키 | ko | en | it | ja |
|---|---|---|---|---|
| success | 성공 | Success | Successo | 成功 |
| error | 오류 | Error | Errore | エラー |
| loading | 로딩 중... | Loading... | Caricamento... | 読み込み中... |
| noData | 데이터가 없습니다 | No data | Nessun dato | データがありません |
