# 카드와 리스트

대상 컴포넌트: `NoteItem`, `NoteList`.

- **The Divider Prohibition**: 리스트 항목을 선으로 구분하지 않는다. **간격**으로 구분한다.
  항목 사이 표준 간격은 `spacing.4`(1.4rem).
- **기본**: 사이드바(`surface_container_low`) 안의 카드는 `surface_container_lowest`(흰색)로 띄운다. 테두리와 그림자는 쓰지 않는다.
- **Hover**: 배경을 `surface_container_lowest`에서 `surface_container`로 한 단계 어둡게 바꾼다.
  배경이 `surface`인 리스트라면 `surface` → `surface_container_low`로 바꾼다.
  hover 색이 부모 배경과 같으면 구분이 안 되므로, 부모 배경보다 한 단계 깊은 색을 고른다.
- **선택됨**: 선택 상태는 `surface_container_highest`.

```html
<!-- 사이드바(bg-surface-container-low) 안의 목록 -->
<ul class="flex flex-col gap-[1.4rem]">
  <li class="rounded-md bg-surface-container-lowest p-4 hover:bg-surface-container">노트 A</li>
  <li class="rounded-md bg-surface-container-highest p-4">노트 B (선택됨)</li>
</ul>
```

## 관련 문서

- 카드 띄우기(Tonal Layering): [elevation.md](../foundations/elevation.md)
- 간격: [spacing.md](../foundations/spacing.md)
- 금지 규칙: [do-and-dont.md](../rules/do-and-dont.md)
