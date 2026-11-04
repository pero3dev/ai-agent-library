"""固定30問によるメタデータ検索評価。MCP SDK・LLM・有料APIは使わない。"""

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

from library import Library


DATASET_PATH = Path(__file__).with_name("evaluation.json")


def canonical_sha256(value: object) -> str:
    """内容を同定する。ファイルの改行やJSONの字下げには依存しない。"""
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def validate_dataset(dataset: object) -> dict:
    if not isinstance(dataset, dict) or dataset.get("schema_version") != 1:
        raise ValueError("評価セットのschema_versionは1が必要です")
    cases = dataset.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("評価セットにcasesが必要です")
    ids = set()
    for case in cases:
        if not isinstance(case, dict):
            raise ValueError("caseはオブジェクトが必要です")
        for key in ("id", "query", "expected_slug", "split", "stratum", "rationale"):
            if not isinstance(case.get(key), str) or not case[key].strip():
                raise ValueError(f"caseの{key}は空でない文字列が必要です")
        if case["id"] in ids:
            raise ValueError(f"重複したcase id: {case['id']}")
        if case["split"] not in ("development", "holdout"):
            raise ValueError("splitはdevelopment又はholdoutが必要です")
        ids.add(case["id"])
    return dataset


def _metrics(rows: list[dict]) -> dict:
    count = len(rows)
    return {
        "cases": count,
        "top1_hits": sum(row["rank"] == 1 for row in rows),
        "top5_hits": sum(row["rank"] is not None for row in rows),
        "top1_hit_rate": sum(row["rank"] == 1 for row in rows) / count,
        "top5_hit_rate": sum(row["rank"] is not None for row in rows) / count,
        "mrr_at_5": sum(1 / row["rank"] for row in rows if row["rank"]) / count,
    }


def evaluate(library: Library, dataset: dict) -> dict:
    """ラベルを変更せず、最初の一致順位と失敗ケースを保存する。"""
    validate_dataset(dataset)
    # Library.indexは検証済み索引。未知slugは評価データの不整合として止める。
    available = {article["slug"] for article in library.index["articles"]}
    unknown = sorted({case["expected_slug"] for case in dataset["cases"]} - available)
    if unknown:
        raise ValueError("評価の期待slugが索引にありません: " + ", ".join(unknown))
    rows = []
    for case in dataset["cases"]:
        result = library.search_articles(case["query"], limit=5)
        slugs = [article["slug"] for article in result["articles"]]
        expected = case["expected_slug"]
        rows.append({
            "id": case["id"],
            "query": case["query"],
            "split": case["split"],
            "stratum": case["stratum"],
            "expected_slug": expected,
            "result_slugs": slugs,
            "rank": slugs.index(expected) + 1 if expected in slugs else None,
        })
    return {
        "schema_version": 1,
        "dataset_id": dataset["dataset_id"],
        "dataset_sha256": canonical_sha256(dataset),
        "index_sha256": canonical_sha256(library.index),
        "article_count": len(available),
        "k": 5,
        "metrics": _metrics(rows),
        "by_split": {
            split: _metrics([row for row in rows if row["split"] == split])
            for split in sorted({row["split"] for row in rows})
        },
        "by_stratum": {
            stratum: _metrics([row for row in rows if row["stratum"] == stratum])
            for stratum in sorted({row["stratum"] for row in rows})
        },
        "missed_ids": [row["id"] for row in rows if row["rank"] is None],
        "results": rows,
        "limitations": [
            "設計者が作った想定シナリオ30件。本番利用者の分布や実Agentのツール選択を測らない。",
            "developmentを検索改善に使う。holdoutも初回測定後は既知になる。",
            "記事検索の包含率であり、本文の正確性・引用の妥当性・回答品質の指標ではない。",
            "検索が決定的なので反復実行を独立ケース数として数えない。",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", type=Path, help="保存したlibrary-index.jsonを使う（通信なし）")
    parser.add_argument("--dataset", type=Path, default=DATASET_PATH)
    parser.add_argument("--cache-dir", type=Path, help="公開索引取得時のキャッシュ保存先")
    parser.add_argument("--offline", action="store_true", help="取得済みキャッシュだけを使う")
    parser.add_argument("--output", type=Path, help="全ケースの結果をJSONに保存する")
    parser.add_argument("--min-hit-rate", type=float, help="明示したtop5包含率の下限をCI等で強制する")
    args = parser.parse_args()
    if args.min_hit_rate is not None and not 0 <= args.min_hit_rate <= 1:
        parser.error("--min-hit-rateは0〜1を指定してください")
    try:
        dataset = validate_dataset(json.loads(args.dataset.read_text(encoding="utf-8")))
        if args.index:
            library = Library.from_data(json.loads(args.index.read_text(encoding="utf-8")))
            source = str(args.index.resolve())
        else:
            library = Library(cache_dir=args.cache_dir, offline=args.offline)
            source = "published-index-cache" if args.offline else "published-index-with-cache"
        report = evaluate(library, dataset)
        report["measured_at"] = datetime.now(timezone.utc).isoformat()
        report["source"] = source
        report["min_hit_rate"] = args.min_hit_rate
        passed = args.min_hit_rate is None or report["metrics"]["top5_hit_rate"] >= args.min_hit_rate
        report["threshold_passed"] = passed if args.min_hit_rate is not None else None
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({
            "dataset_id": report["dataset_id"],
            "index_sha256": report["index_sha256"],
            "metrics": report["metrics"],
            "by_split": report["by_split"],
            "missed_ids": report["missed_ids"],
            "threshold_passed": report["threshold_passed"],
        }, ensure_ascii=False, indent=2))
        return 0 if passed else 1
    except (OSError, ValueError, KeyError) as error:
        print(f"評価失敗: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
