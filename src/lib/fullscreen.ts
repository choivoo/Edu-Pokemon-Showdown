/** 전체화면 + 가로 고정 (지원하는 브라우저에서만 동작) */
export async function enterLandscapeFullscreen(): Promise<void> {
  try { await document.documentElement.requestFullscreen?.() } catch { /* 무시 */ }
  try { await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape') } catch { /* 무시 */ }
}
