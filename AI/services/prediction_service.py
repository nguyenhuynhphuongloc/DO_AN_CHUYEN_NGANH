import numpy as np
from datetime import datetime
from typing import List, Dict, Any

def _get_expense_amounts(data: List[Dict[str, Any]]) -> List[float]:
  """Extract expense amounts from data."""
  return [d.get("amount", 0) for d in data if d.get("type") == "expense"]

def predict_future_spending(data: List[Dict[str, Any]]) -> Dict[str, Any]:
  """Predict next month's spending based on historical data."""
  if not data:
    return {"prediction": 0, "confidence": 0}
    
  amounts = _get_expense_amounts(data)
  if not amounts:
    return {"prediction": 0, "confidence": 0}
    
  mean = np.mean(amounts)
  prediction = mean * 1.05
  return {
    "prediction": round(prediction, 2),
    "confidence": 0.7,
    "trend": "increasing" if prediction > mean else "stable"
  }

def detect_anomalies_in_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  """Detect unusually high transactions (> mean + 2*std)."""
  if not data:
    return []
    
  amounts = _get_expense_amounts(data)
  if len(amounts) < 3:
    return []
    
  threshold = np.mean(amounts) + 2 * np.std(amounts)
  return [
    {**d, "reason": "Số tiền cao bất thường"} 
    for d in data 
    if d.get("type") == "expense" and d.get("amount", 0) > threshold
  ]
