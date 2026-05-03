import numpy as np
from datetime import datetime
from typing import List, Dict, Any

def predict_future_spending(data: List[Dict[str, Any]]) -> Dict[str, Any]:
  if not data:
    return {"prediction": 0, "confidence": 0}

  amounts = [d.get("amount", 0) for d in data if d.get("type") == "expense"]
  if not amounts:
    return {"prediction": 0, "confidence": 0}

  prediction = np.mean(amounts) * 1.05
  return {
    "prediction": round(prediction, 2),
    "confidence": 0.7,
    "trend": "increasing" if prediction > np.mean(amounts) else "stable"
  }

def detect_anomalies_in_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  if not data:
    return []

  amounts = [d.get("amount", 0) for d in data if d.get("type") == "expense"]
  if len(amounts) < 3:
    return []

  mean = np.mean(amounts)
  std = np.std(amounts)

  anomalies = []
  for d in data:
    if d.get("type") == "expense" and d.get("amount", 0) > mean + 2 * std:
      anomalies.append({**d, "reason": "Số tiền cao bất thường"})

  return anomalies
