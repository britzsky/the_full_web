# Contact Inquiry API Setup

고객문의 데이터는 `the_full_web_api`를 통해 조회/저장됩니다.  
프론트(`the_full_web`)에서는 DB 직접 연결을 사용하지 않습니다.

```env
# the_full_web_api 서버 주소
WEB_API_BASE_URL=http://127.0.0.1:8090
```

- 고객문의 등록: `POST /api/contact/manage`
- 문의관리 목록: `GET /api/contact/manage`
- 문의관리 상세: `GET /api/contact/manage/{id}`
- 문의관리 답변 조회/저장: `GET|POST /api/contact/manage/{id}/reply`
- 문의관리 삭제: `DELETE /api/contact/manage/{id}` (소프트삭제)

- 실제 테이블 생성/마이그레이션은 `the_full_web_api` 쪽에서 관리합니다.
- 참고용 SQL은 `inquiry_inquiry_reply.sql`을 사용하시면 됩니다.

## 문의관리 메뉴 권한

- `문의관리` 메뉴/페이지는 `thefull_admin=1` 쿠키가 있을 때만 보입니다.
- 개발 중 항상 노출하려면 `.env.local`에 `ADMIN_ALWAYS_ON=true`를 설정하세요.
