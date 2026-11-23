# 🍽️ 오늘 뭐 먹지? (random-food)

회사 근처 식당 중 점심 메뉴를 랜덤으로 골라주는 웹앱입니다. `index.html` 파일 하나로 동작합니다.

## 기능
- 식당 추가/삭제, 종류(한식·중식·일식·양식·분식·기타) 필터
- 최근 3번 간 곳 제외 옵션, 룰렛 효과
- 카카오맵으로 회사 주변 식당 자동 불러오기 (JavaScript 키 필요)
- 공유 식당 목록은 레포의 `restaurants.json` 파일에 저장 (모든 사람이 같은 목록을 봄)

## 카카오 키 설정
1. https://developers.kakao.com → 애플리케이션 추가
2. 앱 키 중 **JavaScript 키** 복사 → 앱 화면에 붙여넣기
3. 플랫폼 → Web → 사이트 도메인에 배포 주소 등록 (예: https://xxx.vercel.app)

## 배포
Vercel에서 이 저장소를 Import → 설정 변경 없이 Deploy

## 식당 목록 관리 (restaurants.json)
- 앱에서 식당을 추가/삭제하면 "GitHub에 저장하기" 버튼이 나타납니다 → 복사 → GitHub 편집 화면에 붙여넣기 → Commit
- 또는 GitHub에서 `restaurants.json`을 직접 수정해도 됩니다.
- `kakaoKey`에 카카오 JavaScript 키를 넣으면 사용자가 키를 입력할 필요가 없습니다.
