import json
from rank_bm25 import BM25Okapi
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer, CrossEncoder
import faiss
import pickle
from app.core.config import settings


# ===================== 工具函数 =====================
def load_jsonl(path):
    import orjson
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:       # 跳过空行
                continue
            try:
                obj = orjson.loads(line)
                data.append(obj)



            except orjson.JSONDecodeError as e:
                print(f"[WARN] JSON decode error at line: {line[:50]}...  skip")
                continue
    return data



# ===================== Hybrid 检索器 =====================
class PersistentHybridRetriever:
    def __init__(self, storage_dir="storage"):
        self.storage = Path(storage_dir)
        self.storage.mkdir(exist_ok=True)

        self.embedder = SentenceTransformer(settings.EMBEDDER_MODEL)

        with open(self.storage / "bm25.pkl", "rb") as f:
            self.bm25 = pickle.load(f)

        self.index = faiss.read_index(str(self.storage / "faiss.index"))

        with open(self.storage / "corpus.json", "r", encoding="utf8") as f:
            self.corpus = json.load(f)         

        self.embeddings = np.load(self.storage / "embeddings.npy")

    def search(self, query, top_k=5):

        # BM25 得分
        token = query.split()
        bm25_scores = np.array(self.bm25.get_scores(token))

        # Embedding 得分
        q_emb = self.embedder.encode([query], convert_to_numpy=True)
        D, I = self.index.search(q_emb.astype("float32"), top_k * 2)

        embed_scores = np.zeros(len(self.corpus))
        embed_scores[I[0]] = 1 - D[0] / (D[0].max() + 1e-9)

        # 归一化
        def norm(x):
            return (x - x.min()) / (x.max() - x.min() + 1e-9)

        bm25_norm = norm(bm25_scores)
        embed_norm = norm(embed_scores)

        final_scores = 0.2 * bm25_norm + 0.8 * embed_norm
        idx = np.argsort(final_scores)[::-1][:top_k]

        results = []
        for i in idx:
            results.append({
                "content": self.corpus[i]["content"],
                "tag": self.corpus[i]["tag"],
                "score": float(final_scores[i])
            })
        return results


# ===================== Rerank =====================
class Reranker:
    def __init__(self, model=settings.RERANK_MODEL):
        self.model = CrossEncoder(model)

    def rerank(self, query, items):
        pairs = [[query, item["content"]] for item in items]
        scores = self.model.predict(pairs)

        for i, sc in enumerate(scores):
            items[i]["score_rerank"] = float(sc)

        return sorted(items, key=lambda x: x["score_rerank"], reverse=True)


retriever = PersistentHybridRetriever(storage_dir="data/storage")
Reranker_item=Reranker()
    

def get_related_posts(query, top_k=5):
    results = retriever.search(query, top_k=2*top_k)
    results_rerank=Reranker_item.rerank(query,results)
    return results_rerank[:top_k]