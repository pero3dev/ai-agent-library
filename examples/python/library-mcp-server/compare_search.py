"""Offline search comparison: choose on development, then measure frozen holdout once.

This experiment does not alter the public index or either production runtime.
Pass --phase development first and use its output as --selection for holdout.
"""

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import statistics
import time

from evaluate import canonical_sha256, evaluate, validate_dataset
from library import Library, MAX_INDEX_BYTES, MAX_RESPONSE_CHARS, _normal, _tokens, serialize


HERE = Path(__file__).resolve().parent
METHODS = ("current", "headings-4", "section-bm25")


def section_texts(markdown: str) -> list[str]:
    """Split ATX sections; omit YAML, code, links/URLs and reference-only sections."""
    markdown = re.sub(r"\A---\r?\n.*?\r?\n---\r?\n", "", markdown, flags=re.S)
    sections, lines = [], []
    fence = None
    omit = False
    for line in markdown.splitlines():
        match = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if fence:
            if match and match[1][0] == fence[0] and len(match[1]) >= fence[1] and not match[2].strip():
                fence = None
            continue
        if match:
            fence = (match[1][0], len(match[1]))
            continue
        heading = re.match(r"^ {0,3}#{1,6}\s+(.+)", line)
        if heading:
            if lines:
                sections.append(" ".join(lines))
                lines = []
            omit = heading[1].strip() in ("参考資料", "関連ドキュメント")
        if not omit:
            line = re.sub(r"!?\[([^\]]+)\]\([^)]*\)", r"\1", line)
            line = re.sub(r"https?://\S+|<[^>]+>", " ", line)
            line = re.sub(r"[#*`_|>\[\]{}]", " ", line)
            line = re.sub(r"\s+", " ", line).strip()
            if line:
                lines.append(line)
    if lines:
        sections.append(" ".join(lines))
    return sections


def term_counts(value: str) -> Counter:
    """Same Japanese bigram/English token vocabulary as production, with frequency."""
    value = _normal(value)
    counts = Counter(re.findall(r"[a-z0-9]+", value))
    for stop in ("a", "an", "the", "is", "of", "to", "and", "for", "in", "how", "what"):
        counts.pop(stop, None)
    for run in re.findall(r"[\u3040-\u30ff\u3400-\u9fff]+", value):
        counts.update(run[i:i + 2] for i in range(len(run) - 1))
        if len(run) == 1:
            counts[run] += 1
    return counts


def preference(metrics: dict) -> tuple:
    return metrics["top5_hit_rate"], metrics["mrr_at_5"], metrics["top1_hit_rate"]


class ExperimentalLibrary(Library):
    """Local candidate rankers; retain production result envelope and character cap."""

    def __init__(self, index: dict, method: str, sections: dict[str, list[str]]):
        super().__init__(offline=True)
        self._index = Library.from_data(index).index
        self._markdowns = {}
        self._cache = {"index": {"state": "memory", "fetched_at": None, "expires_at": None}}
        self.method = method
        self.features = []
        self.df = Counter()
        self.passages = []
        self.passage_df = Counter()
        for article in self._index["articles"]:
            weights = Counter()
            fields = ((article["title"], 8), (" ".join(article["tags"]), 7),
                      (article["slug"], 4), (article["description"], 2),
                      (" ".join(h["text"] for h in article["headings"]), 4 if method == "headings-4" else 1))
            for text, weight in fields:
                weights.update({token: weight for token in _tokens(text)})
            self.features.append(weights)
            self.df.update(weights.keys())
            if method == "section-bm25":
                for text in sections[article["slug"]]:
                    counts = term_counts(text)
                    if counts:
                        self.passages.append((article["slug"], counts, sum(counts.values())))
                        self.passage_df.update(counts.keys())
        self.average_length = statistics.mean(length for _, _, length in self.passages) if self.passages else 1

    def search_articles(self, query, limit=5):
        if self.method == "current":
            # Pin the pre-improvement baseline even after production is updated.
            self.features, self.df = [], Counter()
            for article in self.index["articles"]:
                weights = Counter()
                for text, weight in ((article["title"], 8), (" ".join(article["tags"]), 7),
                                     (article["slug"], 4), (article["description"], 2),
                                     (" ".join(h["text"] for h in article["headings"]), 1)):
                    weights.update({token: weight for token in _tokens(text)})
                self.features.append(weights)
                self.df.update(weights.keys())
        tokens = _tokens(query)
        articles = self.index["articles"]
        scores = {}
        for article, weights in zip(articles, self.features):
            score = sum(weights.get(token, 0) * (math.log((len(articles) + 1) / (self.df[token] + 1)) + 1) for token in tokens)
            if _normal(query).strip() in _normal(article["title"] + " " + " ".join(article["tags"])):
                score += 30
            scores[article["slug"]] = score
        if self.method == "section-bm25":
            body_scores = Counter()
            for slug, counts, length in self.passages:
                score = 0.0
                for token in tokens:
                    tf = counts[token]
                    if tf:
                        idf = math.log(1 + (len(self.passages) - self.passage_df[token] + .5) / (self.passage_df[token] + .5))
                        score += idf * tf * 2.2 / (tf + 1.2 * (.25 + .75 * length / self.average_length))
                body_scores[slug] = max(body_scores[slug], score)
            max_metadata, max_body = max(scores.values(), default=0) or 1, max(body_scores.values(), default=0) or 1
            scores = {slug: score / max_metadata + body_scores[slug] / max_body for slug, score in scores.items()}
        ranked = sorted((article for article in articles if scores[article["slug"]] > 0), key=lambda a: (-scores[a["slug"]], a["slug"]))
        result = self._base(last_updated=max((a["last_updated"] for a in articles if a["last_updated"]), default=None))
        result["articles"] = [{key: article[key] for key in ("slug", "title", "description", "last_updated", "url")} for article in ranked[:limit]]
        result["total_matches"] = len(ranked)
        while len(serialize(result)) > MAX_RESPONSE_CHARS and result["articles"]:
            result["articles"].pop()
            result["truncated"] = True
            result["continuation"] = "queryを具体化するかlimitを小さくして再検索してください。本文は記事URLを参照してください。"
        return self._bounded(result)


def benchmark(library: Library, queries: list[str]) -> dict:
    """One warmup, three local passes; repeats measure latency, not extra cases."""
    library.search_articles(queries[0], 5)
    timings, response_sizes = [], []
    for _ in range(3):
        for query in queries:
            started = time.perf_counter()
            response = library.search_articles(query, 5)
            timings.append((time.perf_counter() - started) * 1000)
            response_sizes.append(len(serialize(response)))
    return {"calls": len(timings), "median_ms": statistics.median(timings),
            "p95_ms": sorted(timings)[math.ceil(.95 * len(timings)) - 1],
            "max_response_chars": max(response_sizes), "response_cap_chars": MAX_RESPONSE_CHARS}


def compare(index: dict, dataset: dict, sections: dict[str, list[str]], methods: tuple[str, ...]) -> dict:
    report = {}
    # Holdout is scored exactly once here; latency uses development queries separately.
    for method in methods:
        report[method] = evaluate(ExperimentalLibrary(index, method, sections), dataset)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--phase", choices=("development", "holdout"), required=True)
    parser.add_argument("--selection", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("output already exists; preserve the first measurement and use a new path for independent reproduction")
    index_bytes = args.index.read_bytes()
    index = Library.from_data(json.loads(index_bytes)).index
    legacy = validate_dataset(json.loads((HERE / "evaluation.json").read_text(encoding="utf-8")))
    development = {**legacy, "cases": [c for c in legacy["cases"] if c["split"] == "development"]}
    sections = {a["slug"]: section_texts((args.repo / a["source_path"]).read_text(encoding="utf-8")) for a in index["articles"]}
    augmented = {**index, "articles": [{**a, "search_sections": sections[a["slug"]]} for a in index["articles"]]}
    # Match the public generator's pretty JSON, including its trailing newline.
    augmented_bytes = len((json.dumps(augmented, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    result = {"schema_version": 1, "phase": args.phase, "measured_at": datetime.now(timezone.utc).isoformat(),
              "index_sha256": canonical_sha256(index), "index_bytes": len(index_bytes),
              "section_index_bytes": augmented_bytes, "section_index_increase_bytes": augmented_bytes - len(index_bytes),
              "index_cap_bytes": MAX_INDEX_BYTES, "section_content_sha256": canonical_sha256(sections)}
    if args.phase == "development":
        result["comparison"] = compare(index, development, sections, METHODS)
        selected = max(METHODS, key=lambda method: preference(result["comparison"][method]["metrics"]))
        result["selected"] = selected
        result["selection_rule"] = "Top5, MRR@5, Top1 lexicographic; current wins ties. No holdout loaded."
    else:
        if not args.selection:
            parser.error("holdout requires development --selection")
        selection = json.loads(args.selection.read_text(encoding="utf-8"))
        if selection.get("phase") != "development" or selection.get("index_sha256") != result["index_sha256"] or selection.get("section_content_sha256") != result["section_content_sha256"]:
            parser.error("selection index/body must match this measurement")
        selected = selection["selected"]
        if selected not in METHODS:
            parser.error("unknown candidate")
        unseen = validate_dataset(json.loads((HERE / "evaluation-unseen.json").read_text(encoding="utf-8")))
        result["selection_sha256"] = canonical_sha256(selection)
        result["selected"] = selected
        result["comparison"] = compare(index, unseen, sections, tuple(dict.fromkeys(("current", selected))))
        current, candidate = (result["comparison"][name]["metrics"] for name in ("current", selected))
        fits_index = selected != "section-bm25" or augmented_bytes <= MAX_INDEX_BYTES
        result["adopt"] = selected != "current" and preference(candidate) > preference(current) and candidate["top5_hit_rate"] >= current["top5_hit_rate"] and fits_index
        result["decision_reason"] = "Adopt only a strict held-out improvement under frozen rule, without Top5 regression and within index cap. No tuning after this measurement."
    queries = [c["query"] for c in development["cases"]]
    result["performance_development_only"] = {method: benchmark(ExperimentalLibrary(index, method, sections), queries) for method in result["comparison"]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"phase": args.phase, "selected": result["selected"], "adopt": result.get("adopt"),
                      "index_bytes": result["index_bytes"], "section_index_bytes": augmented_bytes,
                      "metrics": {m: r["metrics"] for m, r in result["comparison"].items()},
                      "performance": result["performance_development_only"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
