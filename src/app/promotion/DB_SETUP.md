# Promotion API Setup

홍보 게시글 데이터는 `the_full_web_api`를 통해 조회/저장됩니다.  
프론트(`the_full_web`)에서는 DB 직접 연결을 사용하지 않습니다.

```env
# 8090 변경시: 아래 두 값(8081)을 함께 8090으로 변경
WEB_API_BASE_URL=http://127.0.0.1:8081
# 또는
THE_FULL_WEB_API_BASE_URL=http://127.0.0.1:8081
```

- 게시글 목록: `GET /api/promotion/posts`
- 게시글 상세: `GET /api/promotion/posts/{id}`
- 인접글 조회: `GET /api/promotion/posts/{id}/adjacent`
- 게시글 등록: `POST /api/promotion/posts`
- 게시글 수정: `PATCH /api/promotion/posts/{id}`
- 게시글 삭제: `DELETE /api/promotion/posts/{id}` (소프트삭제)

- 실제 테이블 생성/마이그레이션은 `the_full_web_api` 쪽에서 관리합니다.
- 참고용 SQL은 `mysql-schema.sql`을 사용하시면 됩니다.
