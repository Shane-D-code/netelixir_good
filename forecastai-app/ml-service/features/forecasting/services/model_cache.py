"""
Model and prediction caching to avoid retraining on identical data.
Uses content-based hashing with configurable TTL.
"""

import hashlib
import json
import os
import pickle
import tempfile
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


class ModelCache:
    def __init__(self, ttl_hours: int = 24, cache_dir: Optional[str] = None):
        if cache_dir is None:
            cache_dir = os.path.join(tempfile.gettempdir(), "forecastai_cache")
        self.cache_dir = cache_dir
        self.ttl = timedelta(hours=ttl_hours)
        os.makedirs(cache_dir, exist_ok=True)

    def _hash(self, data: List[Dict], params: Dict) -> str:
        normalised = {
            "data": sorted(data, key=lambda x: (x.get("date", ""), x.get("channel", ""))),
            "params": {k: v for k, v in sorted(params.items())},
        }
        content = json.dumps(normalised, sort_keys=True, default=str)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def get(self, data: List[Dict], params: Dict) -> Optional[Any]:
        key = self._hash(data, params)
        path = os.path.join(self.cache_dir, f"{key}.pkl")
        if not os.path.exists(path):
            return None
        mtime = datetime.fromtimestamp(os.path.getmtime(path))
        if datetime.now() - mtime > self.ttl:
            try:
                os.remove(path)
            except OSError:
                pass
            return None
        try:
            with open(path, "rb") as f:
                return pickle.load(f)
        except Exception:
            return None

    def set(self, data: List[Dict], params: Dict, result: Any) -> None:
        key = self._hash(data, params)
        path = os.path.join(self.cache_dir, f"{key}.pkl")
        try:
            with open(path, "wb") as f:
                pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
        except Exception:
            pass

    def clear_old(self, max_age_hours: int = 24) -> int:
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        removed = 0
        for filename in os.listdir(self.cache_dir):
            if not filename.endswith(".pkl"):
                continue
            path = os.path.join(self.cache_dir, filename)
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(path))
                if mtime < cutoff:
                    os.remove(path)
                    removed += 1
            except OSError:
                pass
        return removed

    def get_stats(self) -> Dict:
        try:
            files = [f for f in os.listdir(self.cache_dir) if f.endswith(".pkl")]
        except OSError:
            files = []
        total_size = 0
        for f in files:
            try:
                total_size += os.path.getsize(os.path.join(self.cache_dir, f))
            except OSError:
                pass
        return {
            "cache_entries": len(files),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "cache_dir": self.cache_dir,
        }
