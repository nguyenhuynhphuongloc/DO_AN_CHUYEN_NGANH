from statistics import mean, stdev
from typing import List, Dict, Any

def _get_expense_amounts(data: List[Dict[str, Any]]) -> List[float]:
  """Extract numeric expense amounts from data."""
  amounts: List[float] = []
  for d in data:
    if d.get("type") != "expense":
      continue
    amount = d.get("amount", 0)
    if isinstance(amount, (int, float)):
      amounts.append(float(amount))
  return amounts

def predict_future_spending(data: List[Dict[str, Any]]) -> Dict[str, Any]:
  """Predict next month's spending based on historical data."""
  if not data:
    return {"prediction": 0, "confidence": 0}

  amounts = _get_expense_amounts(data)
  if not amounts:
    return {"prediction": 0, "confidence": 0}

  avg_amount = mean(amounts)
  prediction = avg_amount * 1.05
  confidence = min(0.9, 0.5 + 0.05 * len(amounts))

  return {
    "prediction": round(prediction, 2),
    "confidence": round(confidence, 2),
    "trend": "increasing" if prediction > avg_amount else "stable"
  }

def detect_anomalies_in_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  """Detect unusually high expense transactions (> mean + 2*std)."""
  if not data:
    return []

  amounts = _get_expense_amounts(data)
  if len(amounts) < 3:
    return []

  threshold = mean(amounts) + 2 * stdev(amounts)
  return [
    {**d, "reason": "Số tiền cao bất thường"}
    for d in data
    if d.get("type") == "expense"
    and isinstance(d.get("amount", 0), (int, float))
    and d.get("amount", 0) > threshold
  ]
