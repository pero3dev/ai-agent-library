import SwiftUI
import Foundation

struct ContentStoragePreviewView: View {
    @ObservedObject var store: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @State private var preview: ContentStoragePreview?
    @State private var loading = true
    @State private var request = UUID()

    var body: some View {
        NavigationStack {
            List {
                if loading {
                    Section { ProgressView("保存コンテンツの容量を確認しています") }
                } else if let preview {
                    Section(preview.isComplete ? "確認したファイルサイズ" : "確認できた範囲のファイルサイズ") {
                        LabeledContent("合計", value: ByteCountFormatter.string(fromByteCount: preview.observedLogicalBytes, countStyle: .file))
                            .accessibilityIdentifier("storage-usage-total")
                        Text("ファイルの大きさを集計した目安です。端末の空き容量や、整理で増える容量を示すものではありません。")
                            .font(.footnote).foregroundStyle(.secondary)
                        Text("本文が正常に読めるかどうかは、この確認では判定していません。")
                            .font(.footnote).foregroundStyle(.secondary)
                        if preview.rootState == .absent { Text("保存コンテンツのフォルダはまだありません。") }
                    }
                    Section("保存版と参照") {
                        LabeledContent("確認した保存版", value: "\(preview.generations.count)件")
                        LabeledContent("現在の選択", value: referenceLabel(preview.currentCount, expected: preview.currentReference, preview: preview))
                        LabeledContent("前の選択", value: referenceLabel(preview.previousCount, expected: preview.previousReference, preview: preview))
                        LabeledContent("使用中の保存版（参考）", value: "\(preview.usedGenerationCount)件")
                        LabeledContent("その他の保存版", value: preview.pointerState == .observed
                                       ? "\(preview.otherGenerationCount)件" : "未確認")
                        LabeledContent("取り込み作業領域", value: "\(preview.stagingCount)件")
                        Text("同じ保存版に複数の参照がある場合も、容量は一度だけ集計します。使用中の表示は、このアプリ内で確認した時点の参考情報です。")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    if !preview.isComplete {
                        Section("未確認の項目があります") {
                            Text(preview.issues.contains(.changed)
                                 ? "確認中に保存内容が変わりました。最新の状態を確認するには「再確認」を押してください。"
                                 : "読み取り上限や、確認できない項目があるため、合計は一部だけの集計です。")
                            if preview.unknownEntryCount > 0 {
                                LabeledContent("分類できなかった項目", value: "\(preview.unknownEntryCount)件")
                            }
                            if preview.unobservedUseCount > 0 {
                                LabeledContent("確認できなかった参照", value: "\(preview.unobservedUseCount)件")
                            }
                        }
                    }
                } else {
                    Section { Text("容量を確認できませんでした。ほかの読み込みが終わってから、再確認してください。") }
                }
                Section {
                    Button("再確認", systemImage: "arrow.clockwise") { request = UUID() }
                        .accessibilityIdentifier("storage-usage-refresh")
                        .disabled(loading)
                }
            }
            .accessibilityIdentifier("storage-usage-list")
            .navigationTitle("保存コンテンツの容量")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("閉じる") { dismiss() }.accessibilityIdentifier("storage-usage-close") } }
        }
        .task(id: request) {
            loading = true
            preview = nil
            let value = await store.previewStorageUsage()
            guard !Task.isCancelled else { return }
            preview = value
            loading = false
        }
    }

    private func referenceLabel(_ count: Int, expected: UUID?, preview: ContentStoragePreview) -> String {
        if preview.rootState == .absent { return "なし" }
        guard preview.pointerState == .observed else { return "未確認" }
        guard expected != nil else { return "なし" }
        return count > 0 ? "\(count)件" : "未確認"
    }
}
