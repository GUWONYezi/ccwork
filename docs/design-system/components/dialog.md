# 다이얼로그 (Floating 요소)

대상 컴포넌트: 모달과 드롭다운 등 떠 있는 요소 전반.
`Alert`, `Confirm`의 상태별 색과 구조는 [alert-confirm.md](./alert-confirm.md)를 따른다.

[colors.md](../foundations/colors.md)의 Glass 규칙(`surface` 80% + blur 12px)과
[elevation.md](../foundations/elevation.md)의 Ambient Shadow를 함께 적용한다.

- 배경은 Glass, 텍스트는 `on_surface`.
- 순백 배경, `border-gray-*`, 검정 기반 그림자는 쓰지 않는다.
- 경계가 꼭 필요하면 Ghost Border(`outline_variant` 15%)만 쓴다.

```html
<div
  class="bg-surface/80 backdrop-blur-[12px] rounded-md p-6 shadow-[0_16px_32px_rgba(43,52,55,0.06)]"
>
  <p class="text-on-surface">정말 삭제할까요?</p>
</div>
```

## 오버레이 (배경 막)

모달은 화면 전체를 덮는 오버레이 위에 가운데 정렬로 띄운다. 구현은 `src/components/DialogOverlay.tsx`다.

- 배경 막은 `on_surface` 20% 투명 틴트(`bg-on-surface/20`)를 쓴다. 순수 검정(`bg-black`)은 쓰지 않는다.
- `fixed inset-0 z-50`으로 화면을 덮고 `flex items-center justify-center`로 가운데에 놓는다.
- 오버레이에는 테두리와 그림자를 쓰지 않는다. 떠 있는 느낌은 안쪽 대화상자의 Glass + Ambient Shadow가 만든다.

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 p-4">
  <!-- Alert 또는 Confirm -->
</div>
```

## 관련 문서

- 버튼: [button.md](./button.md)
- 금지 규칙: [do-and-dont.md](../rules/do-and-dont.md)
