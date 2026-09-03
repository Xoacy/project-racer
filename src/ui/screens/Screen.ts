/** Minimal contract every menu screen implements. Screens only ever talk to
 *  gameplay through `eventBus` (see EventBus.ts) — never a direct import. */
export interface Screen {
  readonly element: HTMLElement;
  onShow?(): void;
  onHide?(): void;
  dispose?(): void;
}
