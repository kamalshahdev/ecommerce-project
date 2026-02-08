from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


app = FastAPI(title="Sage Studio Recommendation Engine", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------
# Models (API)
# -----------------------


class ProductIn(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = ""
    tags: List[str] = Field(default_factory=list)
    brand: str = ""
    price: float = 0.0


class InteractionIn(BaseModel):
    user_id: str
    product_id: str
    action: str
    timestamp: Optional[str] = None  # ISO string (optional)


class SyncRequest(BaseModel):
    products: List[ProductIn]
    interactions: List[InteractionIn] = Field(default_factory=list)


class SyncResponse(BaseModel):
    products_loaded: int
    users_loaded: int
    interactions_loaded: int


class RecommendationResponse(BaseModel):
    context: str
    requested_id: str
    recommended_ids: List[str]
    scores: List[float]
    method: str
    explanation: Optional[str] = None


class EvaluateResponse(BaseModel):
    k: int
    users_evaluated: int
    test_fraction: float
    min_interactions: int
    positive_actions: List[str]
    precision_at_k: float
    recall_at_k: float
    ndcg_at_k: float
    hit_rate_at_k: float
    coverage_at_k: float


# -----------------------
# Recommendation engine
# -----------------------


ACTION_WEIGHTS = {
    "purchase": 5.0,
    "add_to_cart": 3.0,
    "click": 2.0,
    "view": 1.0,
    "wishlist": 1.5,
    "reco_click": 1.5,
    "reco_impression": 0.1,
}


@dataclass
class _Interaction:
    product_id: str
    action: str
    timestamp: Optional[str] = None


class RecommendationEngine:
    def __init__(self, products: List[Dict[str, Any]], interactions_by_user: Dict[str, List[_Interaction]]):
        self.products: List[Dict[str, Any]] = products
        self.product_dict: Dict[str, Dict[str, Any]] = {p["id"]: p for p in products}
        self.interactions_by_user: Dict[str, List[_Interaction]] = interactions_by_user

        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self._build_tfidf()

        self.user_item_matrix: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self._build_user_item_matrix()

    def _build_tfidf(self) -> None:
        docs: List[str] = []
        for p in self.products:
            # Weighting: name x3, category x2, brand x1, tags, description
            name = (p.get("name") or "").strip()
            desc = (p.get("description") or "").strip()
            category = (p.get("category") or "").strip()
            brand = (p.get("brand") or "").strip()
            tags = " ".join(p.get("tags") or [])
            text = f"{name} {name} {name} {category} {category} {brand} {tags} {desc}".lower()
            docs.append(text)

        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=5000)
        self.tfidf_matrix = self.vectorizer.fit_transform(docs) if docs else None

    def _build_user_item_matrix(self) -> None:
        for user_id, interactions in self.interactions_by_user.items():
            for it in interactions:
                w = ACTION_WEIGHTS.get(it.action, 1.0)
                self.user_item_matrix[user_id][it.product_id] += w

    def _product_index(self, product_id: str) -> int:
        for i, p in enumerate(self.products):
            if p["id"] == product_id:
                return i
        raise ValueError(f"Product {product_id} not found")

    def item_to_item_content(self, product_id: str, top_n: int = 10) -> Tuple[List[str], List[float]]:
        if product_id not in self.product_dict:
            raise ValueError(f"Product {product_id} not found")
        if self.tfidf_matrix is None:
            return [], []

        idx = self._product_index(product_id)
        vec = self.tfidf_matrix[idx]
        sims = cosine_similarity(vec, self.tfidf_matrix).flatten()

        # light boosts: same category and same brand
        prod = self.product_dict[product_id]
        cat = prod.get("category")
        brand = prod.get("brand")
        cat_boost = np.array([1.15 if p.get("category") == cat and cat else 1.0 for p in self.products])
        brand_boost = np.array([1.08 if p.get("brand") == brand and brand else 1.0 for p in self.products])
        sims = sims * cat_boost * brand_boost

        order = sims.argsort()[::-1]
        rec_ids: List[str] = []
        rec_scores: List[float] = []
        for j in order:
            pid = self.products[int(j)]["id"]
            if pid == product_id:
                continue
            rec_ids.append(pid)
            rec_scores.append(float(sims[int(j)]))
            if len(rec_ids) >= top_n:
                break
        return rec_ids, rec_scores

    def item_to_item_collab(self, product_id: str, top_n: int = 10) -> Tuple[List[str], List[float]]:
        # Users who interacted with X also interacted with Y
        users = [u for u, items in self.user_item_matrix.items() if product_id in items]
        if not users:
            return [], []

        scores: Dict[str, float] = defaultdict(float)
        for u in users:
            for pid, w in self.user_item_matrix[u].items():
                if pid == product_id:
                    continue
                scores[pid] += w

        sorted_recs = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        rec_ids = [pid for pid, _ in sorted_recs]
        rec_scores_raw = [float(s) for _, s in sorted_recs]
        if rec_scores_raw:
            mx = max(rec_scores_raw)
            rec_scores = [s / mx for s in rec_scores_raw]
        else:
            rec_scores = []
        return rec_ids, rec_scores

    def item_to_item_hybrid(self, product_id: str, top_n: int = 10) -> Tuple[List[str], List[float]]:
        c_ids, c_scores = self.item_to_item_content(product_id, top_n * 2)
        k_ids, k_scores = self.item_to_item_collab(product_id, top_n * 2)

        combined: Dict[str, float] = {}
        for i, pid in enumerate(c_ids):
            combined[pid] = combined.get(pid, 0.0) + c_scores[i] * 0.7
        for i, pid in enumerate(k_ids):
            combined[pid] = combined.get(pid, 0.0) + k_scores[i] * 0.3

        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [pid for pid, _ in sorted_recs], [float(s) for _, s in sorted_recs]

    def user_personalized(self, user_id: str, top_n: int = 12, exclude_seen: bool = True) -> Tuple[List[str], List[float]]:
        if self.tfidf_matrix is None:
            return [], []
        if user_id not in self.interactions_by_user:
            return [], []

        interactions = self.interactions_by_user[user_id]
        if not interactions:
            return [], []

        # Build a weighted user profile vector
        idxs: List[int] = []
        weights: List[float] = []
        seen: set[str] = set()
        for it in interactions:
            if it.product_id not in self.product_dict:
                continue
            seen.add(it.product_id)
            idxs.append(self._product_index(it.product_id))
            weights.append(ACTION_WEIGHTS.get(it.action, 1.0))

        if not idxs:
            return [], []

        # Weighted average of item vectors
        mat = self.tfidf_matrix[idxs]
        w = np.array(weights).reshape(-1, 1)
        user_vec = (mat.multiply(w)).sum(axis=0) / (w.sum() + 1e-9)

        sims = cosine_similarity(user_vec, self.tfidf_matrix).flatten()
        if exclude_seen:
            for pid in seen:
                try:
                    sims[self._product_index(pid)] = -1.0
                except Exception:
                    pass

        order = sims.argsort()[::-1]
        rec_ids: List[str] = []
        rec_scores: List[float] = []

        # simple diversity: max 3 items per category
        cat_counts: Dict[str, int] = defaultdict(int)
        for j in order:
            pid = self.products[int(j)]["id"]
            if exclude_seen and pid in seen:
                continue
            cat = (self.product_dict[pid].get("category") or "").strip().lower()
            if cat and cat_counts[cat] >= 3:
                continue
            cat_counts[cat] += 1
            rec_ids.append(pid)
            rec_scores.append(float(sims[int(j)]))
            if len(rec_ids) >= top_n:
                break

        return rec_ids, rec_scores

    def evaluate_precision_recall(
        self,
        k: int = 10,
        test_fraction: float = 0.2,
        min_interactions: int = 5,
        positive_actions: Optional[List[str]] = None,
    ) -> Dict[str, float]:
        """Offline evaluation with a time-based split per user.

        Train = earliest (1 - test_fraction)
        Test  = latest test_fraction

        Relevance is defined as test items whose action is in positive_actions.
        """
        positive_actions = positive_actions or ["purchase", "add_to_cart", "click"]

        precisions: List[float] = []
        recalls: List[float] = []
        ndcgs: List[float] = []
        hits: List[float] = []
        coverage_items: set[str] = set()

        users = 0
        for user_id, interactions in self.interactions_by_user.items():
            # keep only interactions that reference known products
            filtered = [it for it in interactions if it.product_id in self.product_dict]
            if len(filtered) < min_interactions:
                continue
            # sort by timestamp if provided, else keep as-is
            filtered = sorted(filtered, key=lambda x: (x.timestamp or ""))

            n = len(filtered)
            test_size = max(1, int(np.ceil(n * test_fraction)))
            train = filtered[:-test_size]
            test = filtered[-test_size:]

            test_items = {it.product_id for it in test if it.action in positive_actions}
            if not test_items:
                continue

            # Temporary engine that uses only train interactions for this user
            tmp = RecommendationEngine(self.products, {user_id: train})
            rec_ids, _ = tmp.user_personalized(user_id, top_n=k, exclude_seen=True)
            if not rec_ids:
                continue

            rec_set = set(rec_ids)
            hits_count = len(rec_set.intersection(test_items))

            precisions.append(hits_count / float(k))
            recalls.append(hits_count / float(len(test_items)))
            hits.append(1.0 if hits_count > 0 else 0.0)

            # NDCG@k (binary relevance)
            dcg = 0.0
            for rank, pid in enumerate(rec_ids, start=1):
                if pid in test_items:
                    dcg += 1.0 / np.log2(rank + 1)
            # ideal DCG
            ideal = 0.0
            ideal_hits = min(len(test_items), k)
            for rank in range(1, ideal_hits + 1):
                ideal += 1.0 / np.log2(rank + 1)
            ndcgs.append(dcg / ideal if ideal > 0 else 0.0)

            coverage_items.update(rec_ids)
            users += 1

        if users == 0:
            return {
                "users_evaluated": 0,
                "precision_at_k": 0.0,
                "recall_at_k": 0.0,
                "ndcg_at_k": 0.0,
                "hit_rate_at_k": 0.0,
                "coverage_at_k": 0.0,
            }

        coverage = len(coverage_items) / float(len(self.products) or 1)
        return {
            "users_evaluated": users,
            "precision_at_k": float(np.mean(precisions)),
            "recall_at_k": float(np.mean(recalls)),
            "ndcg_at_k": float(np.mean(ndcgs)),
            "hit_rate_at_k": float(np.mean(hits)),
            "coverage_at_k": float(coverage),
        }


# -----------------------
# Global in-memory store
# -----------------------


DEFAULT_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": "demo-1",
        "name": "Demo Wireless Headphones",
        "description": "Noise-cancelling wireless headphones",
        "category": "Electronics",
        "tags": ["audio", "wireless", "headphones"],
        "brand": "DemoBrand",
        "price": 199.99,
    },
    {
        "id": "demo-2",
        "name": "Demo Mechanical Keyboard",
        "description": "RGB mechanical keyboard",
        "category": "Electronics",
        "tags": ["keyboard", "mechanical", "rgb"],
        "brand": "DemoBrand",
        "price": 129.99,
    },
]

DEFAULT_INTERACTIONS: Dict[str, List[_Interaction]] = {
    "demo-user": [
        _Interaction(product_id="demo-1", action="purchase", timestamp="2026-01-01T00:00:00Z"),
        _Interaction(product_id="demo-2", action="view", timestamp="2026-01-02T00:00:00Z"),
    ]
}


CURRENT_PRODUCTS: List[Dict[str, Any]] = DEFAULT_PRODUCTS
CURRENT_INTERACTIONS: Dict[str, List[_Interaction]] = DEFAULT_INTERACTIONS
ENGINE: RecommendationEngine = RecommendationEngine(CURRENT_PRODUCTS, CURRENT_INTERACTIONS)


def _rebuild_engine() -> None:
    global ENGINE
    ENGINE = RecommendationEngine(CURRENT_PRODUCTS, CURRENT_INTERACTIONS)


# -----------------------
# Endpoints
# -----------------------


@app.get("/")
async def root():
    return {
        "message": "Sage Studio Recommendation Engine API",
        "version": app.version,
        "counts": {
            "products": len(CURRENT_PRODUCTS),
            "users": len(CURRENT_INTERACTIONS),
        },
        "endpoints": [
            "/recommend/item/{product_id}",
            "/recommend/user/{user_id}",
            "/evaluate",
            "/sync",
            "/health",
        ],
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "products_loaded": len(CURRENT_PRODUCTS),
        "users_tracked": len(CURRENT_INTERACTIONS),
    }


@app.post("/sync", response_model=SyncResponse)
async def sync_all(payload: SyncRequest):
    """Sync products + interactions from backend.

    The backend should call this after seeding products and collecting interactions.
    """
    global CURRENT_PRODUCTS, CURRENT_INTERACTIONS

    # Products
    CURRENT_PRODUCTS = [p.model_dump() for p in payload.products]

    # Interactions
    tmp: Dict[str, List[_Interaction]] = defaultdict(list)
    for it in payload.interactions:
        tmp[it.user_id].append(_Interaction(product_id=it.product_id, action=it.action, timestamp=it.timestamp))
    CURRENT_INTERACTIONS = dict(tmp)

    _rebuild_engine()

    return SyncResponse(
        products_loaded=len(CURRENT_PRODUCTS),
        users_loaded=len(CURRENT_INTERACTIONS),
        interactions_loaded=len(payload.interactions),
    )


@app.get("/recommend/item/{product_id}", response_model=RecommendationResponse)
async def recommend_item(product_id: str, method: str = "hybrid", top_n: int = 10):
    try:
        if method == "content":
            rec_ids, scores = ENGINE.item_to_item_content(product_id, top_n)
            expl = "Based on item content similarity (TF-IDF + cosine)"
        elif method == "collaborative":
            rec_ids, scores = ENGINE.item_to_item_collab(product_id, top_n)
            expl = "Based on what other users interacted with"
        elif method == "hybrid":
            rec_ids, scores = ENGINE.item_to_item_hybrid(product_id, top_n)
            expl = "Hybrid of content similarity and collaborative signals"
        else:
            raise HTTPException(status_code=400, detail="Invalid method")

        return RecommendationResponse(
            context="item",
            requested_id=product_id,
            recommended_ids=rec_ids,
            scores=[float(s) for s in scores],
            method=method,
            explanation=expl,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/recommend/user/{user_id}", response_model=RecommendationResponse)
async def recommend_user(user_id: str, top_n: int = 12):
    try:
        rec_ids, scores = ENGINE.user_personalized(user_id, top_n=top_n, exclude_seen=True)
        return RecommendationResponse(
            context="user",
            requested_id=user_id,
            recommended_ids=rec_ids,
            scores=[float(s) for s in scores],
            method="user_personalized",
            explanation="Weighted user profile built from historical interactions (views/clicks/cart/purchases)",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/evaluate", response_model=EvaluateResponse)
async def evaluate(
    k: int = 10,
    test_fraction: float = 0.2,
    min_interactions: int = 5,
    positive_actions: str = "purchase,add_to_cart,click",
):
    if k <= 0 or k > 50:
        raise HTTPException(status_code=400, detail="k must be between 1 and 50")
    if test_fraction <= 0.0 or test_fraction >= 0.9:
        raise HTTPException(status_code=400, detail="test_fraction must be between 0 and 0.9")
    if min_interactions < 2:
        raise HTTPException(status_code=400, detail="min_interactions must be >= 2")

    pos = [p.strip() for p in positive_actions.split(",") if p.strip()]
    result = ENGINE.evaluate_precision_recall(
        k=k,
        test_fraction=test_fraction,
        min_interactions=min_interactions,
        positive_actions=pos,
    )

    return EvaluateResponse(
        k=k,
        users_evaluated=int(result["users_evaluated"]),
        test_fraction=float(test_fraction),
        min_interactions=int(min_interactions),
        positive_actions=pos,
        precision_at_k=float(result["precision_at_k"]),
        recall_at_k=float(result["recall_at_k"]),
        ndcg_at_k=float(result["ndcg_at_k"]),
        hit_rate_at_k=float(result["hit_rate_at_k"]),
        coverage_at_k=float(result["coverage_at_k"]),
    )
