type ReaderBridgeMessage =
  | { type: 'position'; heading: string; fraction: number }
  | { type: 'article'; id: string; fragment: string }
  | { type: 'copy'; text: string }

interface ReaderRestoreState { fontScale?: number; fraction?: number; heading?: string }
interface ReaderAPI {
  setFontScale(value: number | undefined): void
  goToHeading(id: unknown): boolean
  restore(value?: ReaderRestoreState): void
}
interface Window {
  webkit?: { messageHandlers?: { reader?: { postMessage(message: ReaderBridgeMessage): void } } }
  reader: Readonly<ReaderAPI>
  readerStatusTimer?: ReturnType<typeof setTimeout>
}
