# 🚀 Lộ Trình Kiểm Tra & Tối Ưu AI Bot FinTrack

## 📋 Tóm Tắt Nhanh
- **Mục tiêu**: Kiểm tra AI training/prompts, Bot NLP, UX/UI có oki chưa
- **Giai đoạn**: 4 tuần (Phase 1-4)
- **Deliverable**: Bot classification accuracy ≥ 90%, advisor responses chất lượng, UI smooth

---

## 🎯 PHASE 1: AI PROMPT REVIEW & OPTIMIZATION (Tuần 1)

### Mục tiêu
- Review hiện tại AI prompts
- Phát hiện vấn đề trong prompt logic
- Tối ưu prompts để output chất lượng cao
- Validate prompt engineering best practices

### 1.1 Kiểm Tra Advisor Prompt
**File**: `AI/services/advisor_service.py` (lines 10-37)

**Current Prompt Analysis**:
```python
System Prompt: "Bạn là chuyên gia tư vấn tài chính thông minh của ứng dụng FinTrack..."
Context Inject: Thu nhập | Chi tiêu | Số dư | Top 5 danh mục | Xu hướng tháng
Max Tokens: 512
Temperature: 0.6
Penalty: 1.1
```

**Kiểm Tra Checklist**:
- [ ] System prompt rõ ràng & có tính cách?
- [ ] Context đủ để LLM hiểu tình huống thực tế?
- [ ] Max tokens (512) có phù hợp độ dài reply?
- [ ] Temperature 0.6 có balanced (không quá random)?
- [ ] Penalty 1.1 có avoid repetition?
- [ ] Xử lý edge case (dữ liệu rỗng)?

**Test Script**: `test_advisor_prompt.py`
```bash
# 1. Test với high balance + low expenses
# 2. Test với low balance + high expenses
# 3. Test với dữ liệu thiếu (empty categories)
# 4. Test response time
# 5. Evaluate response quality (logic, tone)
```

**Expected Output**:
✓ Advisor response có:
  - Phân tích dữ liệu cụ thể (không chung chung)
  - Lời khuyên action-oriented
  - Tiếng Việt chuẩn, tự nhiên
  - Thời gian response < 5s

**Optimization Tasks** (nếu cần):
- [ ] Thêm more specific instructions nếu response quá generic
- [ ] Adjust temperature (↑ creative, ↓ precise)
- [ ] Thêm more context (trend data, anomalies)
- [ ] Test role-playing variations ("nhà tài chính thận trọng" vs "tư vấn viên tích cực")

---

### 1.2 Kiểm Tra NLP/Chatbot Prompts & Keyword Mapping
**File**: `AI/services/nlp_service.py`

**Current Implementation**:
```
CATEGORY_KEYWORDS: 14 categories
Regex Patterns: Amount parsing (50k → 50000, 1.5tr → 1500000, etc.)
POS Tagging: Fallback với underthesea khi không match keyword
Date Handling: "hôm qua" → yesterday
```

**Kiểm Tra Checklist**:
- [ ] 14 danh mục keywords có cover phổ biến?
- [ ] Regex patterns handle tất cả format (k, tr, tỷ, đ, phẩy)?
- [ ] POS tagging fallback có hoạt động?
- [ ] Date parsing (hôm qua, ngày mai, etc.) correct?
- [ ] Amount parsing edge cases ("1 củ", "2 lốp", "3 lít")?

**Test Script**: `test_nlp_extraction.py`
```bash
# Run 20+ test cases:
test_inputs = [
    ("Chi 50k ăn sáng", {"amount": 50000, "cat": "Ăn uống"}),
    ("Vừa nhận lương 15 triệu", {"amount": 15000000, "cat": "Lương"}),
    ("Hôm qua đổ xăng 80 ngàn", {"amount": 80000, "cat": "Di chuyển"}),
    ("Được mẹ cho 1 củ tiêu vặt", {"amount": 1000000, "cat": "Thu nhập"}),
    ("Mua sắm 500.000 đồng", {"amount": 500000, "cat": "Mua sắm"}),
    ...
]

# Expected: ≥ 90% accuracy (18/20 correct)
```

**Expected Output**:
✓ NLP bot correctly extract:
  - Amount (with various formats)
  - Category (mapped or inferred)
  - Type (expense vs income)
  - Date (today vs historical)

**Optimization Tasks** (nếu < 90% accuracy):
- [ ] Thêm missing keywords vào CATEGORY_KEYWORDS
- [ ] Improve Regex patterns cho tricky cases
- [ ] Enhance POS tagging fallback logic
- [ ] Add more stop words vào stop_words list

---

### 1.3 Kiểm Tra OCR Prompts & Patterns
**File**: `AI/services/ocr_service.py`

**Current Implementation**:
```
Engine: Tesseract (Vietnamese)
Patterns: Tổng cộng, Thành tiền, Total, TOTAL
Confidence: Depends on image quality
```

**Kiểm Tra Checklist**:
- [ ] Tesseract Vietnamese trained data có cài?
- [ ] Regex patterns cover receipts format Vietnamese?
- [ ] Xử lý numbers với dấu chấm/phẩy đúng?
- [ ] Fallback khi không tìm thấy total (return 0)?
- [ ] Performance: < 2s per image?

**Test Script**: `test_ocr_extraction.py`
```bash
# Need 10 test receipt images
# Run on variety:
#   - Clear text (high quality)
#   - Fuzzy text (low quality, angles)
#   - Different layouts (supermarket vs restaurant)

# Expected: ≥ 85% amount extraction accuracy
```

**Expected Output**:
✓ OCR correctly extract:
  - Total amount (±5% tolerance)
  - No crashes on low-quality images
  - Graceful fallback (amount=0 + warning)

**Optimization Tasks** (nếu accuracy < 85%):
- [ ] Thêm image preprocessing (rotate, enhance)
- [ ] Expand regex patterns cho uncommon layouts
- [ ] Add more currency/language support

---

### 1.4 Kiểm Tra Prediction Prompts & Logic
**File**: `AI/services/prediction_service.py`

**Current Implementation**:
```
Prediction: mean(expenses) * 1.05 (5% growth)
Anomaly Detection: mean + 2*std
Confidence: 0.7 (hardcoded)
```

**Kiểm Tra Checklist**:
- [ ] 5% growth assumption hợp lý?
- [ ] Anomaly detection threshold (2σ) phù hợp?
- [ ] Handling min data (< 3 transactions)?
- [ ] Confidence score realistic?
- [ ] Trends (increasing/stable) correct?

**Expected Output**:
✓ Prediction model:
  - Gives reasonable forecast
  - Detects outliers correctly
  - Handles edge cases gracefully

**Optimization Tasks** (nếu cần):
- [ ] Use seasonal adjustment thay 5% flat growth
- [ ] Tune anomaly threshold (1.5σ → 3σ based on biz logic)
- [ ] Add trend analysis (linear regression)

---

## 📊 PHASE 2: BOT TESTING (Tuần 2)

### 2.1 NLP Bot Accuracy Testing
**Objective**: Validate NLP extraction accuracy ≥ 90%

**Test Dataset** (20-30 samples):
```
Category 1: Simple expense
  "Chi 50k ăn sáng" → E:50k,Ăn
  "Xăng 100k" → E:100k,Di chuyển

Category 2: Complex grammar
  "Mẹ cho tôi 1 triệu" → I:1M,Thu nhập
  "Hôm qua bị mất ví 500k" → E:500k,Mất mát

Category 3: Ambiguous
  "Mua cái này 200k không biết dùng gì" → E:200k,Mua sắm (guess)

Category 4: Edge cases
  "Vài ba tá" → E:144,unknown (fail expected)
  "" → No extraction
```

**Test Script**: `tests/test_nlp_bot.py`
```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '../AI/services')
from nlp_service import extract_transaction_info

test_cases = [
    ("Chi 50k ăn sáng sáng nay", {"amount": 50000, "cat": "Ăn uống", "type": "expense"}),
    ("Vừa nhận lương 15 triệu", {"amount": 15000000, "cat": "Lương", "type": "income"}),
    ("Hôm qua đổ xăng hết 80 ngàn", {"amount": 80000, "cat": "Di chuyển", "type": "expense"}),
    # ... more test cases
]

passed = 0
for input_text, expected in test_cases:
    result = extract_transaction_info(input_text)
    if (result["amount"] == expected["amount"] and 
        result["category"] == expected["cat"] and
        result["type"] == expected["type"]):
        passed += 1
        print(f"✓ {input_text}")
    else:
        print(f"✗ {input_text}")
        print(f"  Expected: {expected}")
        print(f"  Got: {result}")

accuracy = (passed / len(test_cases)) * 100
print(f"\nAccuracy: {accuracy:.1f}%")
```

**Success Criteria**:
- ✓ Accuracy ≥ 90%
- ✓ Response time < 100ms per input
- ✓ No crashes on weird inputs

---

### 2.2 Advisor Quality Testing
**Objective**: Validate advisor response quality & relevance

**Test Scenarios**:
```
Scenario 1: Normal user (healthy balance, stable spending)
  Input: "Tháng này tôi chi tiêu thế nào?"
  Expected: Positive feedback, constructive insights

Scenario 2: High spender (balance low, expense high)
  Input: "Tôi có nên mua laptop mới không?"
  Expected: Caution + concrete advice on saving

Scenario 3: Data sparse (< 5 transactions)
  Input: "Phân tích chi tiêu của tôi"
  Expected: "Chưa có đủ dữ liệu..."

Scenario 4: Edge case (empty context)
  Input: "Hãy cho lời khuyên tài chính"
  Expected: Generic advice or error message
```

**Evaluation Rubric** (qualitative):
```
Relevance (1-5): Does advisor mention specific numbers?
  5 = Cites exact amounts, categories
  3 = Generic numbers
  1 = No numbers

Actionability (1-5): Can user act on advice?
  5 = Concrete actions (giảm 500k/tháng ở X)
  3 = Vague suggestions
  1 = No actions

Tone (1-5): Professional & helpful?
  5 = Warm, expert
  3 = Neutral
  1 = Cold, confusing

Overall Quality = (Relevance + Actionability + Tone) / 3
Target: ≥ 4.0
```

**Test Script**: `tests/test_advisor_quality.py`
```python
# Manual evaluation OR automated via another LLM scoring
# Run 5-10 advisor queries, rate each, calculate average

test_queries = [
    ("Tháng này tôi chi tiêu thế nào?", "summary"),
    ("Tôi có nên mua iPhone không?", "decision"),
    ("Khoản chi nào lớn nhất?", "insights"),
]

for query, category in test_queries:
    response = get_financial_advice(query, context)
    score = manual_evaluation(response)  # or LLM scoring
    print(f"{query} → Score: {score}/5")
```

---

### 2.3 OCR Bot Testing
**Objective**: Validate OCR accuracy on real receipt images

**Test Dataset**: 10-15 receipt images
```
Group 1: Clear receipts (supermarket, restaurant)
  - Expected: 100% amount extraction
  
Group 2: Fuzzy/angled receipts
  - Expected: ≥ 90% correct amount
  
Group 3: Complex layouts
  - Expected: ≥ 80% correct amount (tricky)
```

**Test Script**: `tests/test_ocr_bot.py`
```python
import os
from ocr_service import process_receipt_image

test_images_dir = "test_receipts/"
results = []

for img_file in os.listdir(test_images_dir):
    img_path = os.path.join(test_images_dir, img_file)
    
    # Ground truth (manual check)
    expected_amount = get_ground_truth(img_file)  # from CSV
    
    # OCR extraction
    with open(img_path, 'rb') as f:
        result = process_receipt_image(f.read())
    
    actual_amount = result["amount"]
    error = abs(actual_amount - expected_amount) / expected_amount * 100
    
    status = "✓" if error < 5 else "✗"
    results.append({
        "file": img_file,
        "expected": expected_amount,
        "actual": actual_amount,
        "error%": error,
        "status": status
    })
    
    print(f"{status} {img_file}: ${expected_amount} → ${actual_amount} (error: {error:.1f}%)")

accuracy = sum(1 for r in results if r["status"] == "✓") / len(results) * 100
print(f"\nOCR Accuracy: {accuracy:.1f}%")
```

---

### 2.4 End-to-End Bot Flow Testing
**Objective**: Validate entire chat flow (input → extraction → storage)

**Flow Test**:
```
User Input: "Chi 50k ăn sáng hôm nay"
          ↓
    NLP Extract
          ↓
{amount: 50k, category: "Ăn uống", type: "expense", date: today}
          ↓
Create Transaction (mock DB)
          ↓
Verify in Dashboard
```

**Test Script**: `tests/test_e2e_flow.py`
```bash
# 1. Send chat input via API
# 2. Verify extraction correct
# 3. Check transaction created in dashboard
# 4. Validate balance updated
```

---

## 🎨 PHASE 3: UX/UI TESTING (Tuần 3)

### 3.1 Frontend Component Testing
**Objective**: Validate UI renders correctly & responsive

**Components to Test**:
```
1. login/page.tsx
   - [ ] Form validation (email format)
   - [ ] Submit button disabled when loading
   - [ ] Error message display
   - [ ] Redirect to dashboard on success

2. dashboard/page.tsx
   - [ ] Stat cards load & display
   - [ ] Charts render
   - [ ] Recent transactions show
   - [ ] Responsive on mobile/tablet/desktop

3. transactions/page.tsx
   - [ ] List transactions
   - [ ] Filter by category
   - [ ] Pagination works
   - [ ] Edit/delete transactions

4. receipts/upload/page.tsx
   - [ ] File input works
   - [ ] OCR parsing shows progress
   - [ ] Display extracted amount
   - [ ] Confirm button creates transaction
```

**Test Script**: `tests/test_ui.spec.ts` (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('Login page renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Check form elements
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  
  // Fill & submit
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});

test('Dashboard is responsive', async ({ page }) => {
  // Test mobile viewport (375x667)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000/dashboard');
  
  // Check stat cards stack vertically
  const statCards = page.locator('[data-testid="stat-card"]');
  for (let i = 0; i < await statCards.count(); i++) {
    const card = statCards.nth(i);
    await expect(card).toBeVisible();
  }
});
```

**Run Tests**:
```bash
# Install Playwright
npm install -D @playwright/test

# Run tests
npx playwright test

# Expected: All tests pass
```

---

### 3.2 User Flow Testing
**Objective**: Test typical user journeys

**Flow 1: Create Transaction Manually**
```
1. Login ✓
2. Go to Dashboard ✓
3. Click "+ New Transaction" ✓
4. Type "Chi 50k ăn sáng" ✓
5. Bot extracts: amount=50k, category=Ăn uống ✓
6. Confirm → Transaction created ✓
7. Dashboard updates: balance ↓, category breakdown ↑ ✓
```

**Flow 2: Upload Receipt**
```
1. Go to "Upload Receipt" ✓
2. Select image ✓
3. OCR processing (show spinner) ✓
4. Display extracted amount (e.g., 250k) ✓
5. User can edit amount if wrong ✓
6. Click "Confirm" → Transaction created ✓
7. Back to dashboard ✓
```

**Flow 3: Ask Financial Advisor**
```
1. Open chat widget ✓
2. Type "Tháng này tôi chi tiêu thế nào?" ✓
3. Show typing indicator ✓
4. Advisor responds with specific insights ✓
5. Can ask follow-up questions ✓
```

**Test Script**: `tests/test_flows.md`
```markdown
# Manual Testing Checklist

- [ ] Can login with test credentials
- [ ] Can create transaction via chat
- [ ] Can upload receipt and extract amount
- [ ] Can ask advisor questions
- [ ] Dashboard updates in real-time
- [ ] Can navigate between pages
- [ ] No console errors (F12 DevTools)
- [ ] Mobile view works (DevTools toggle)
```

---

### 3.3 Responsive Design Testing
**Device Breakpoints to Test**:
```
Mobile (375px):
  - [ ] Buttons clickable (not crowded)
  - [ ] Forms readable (font size ≥ 16px)
  - [ ] No horizontal scroll
  - [ ] Bottom nav/tabs accessible

Tablet (768px):
  - [ ] 2-column layouts works
  - [ ] Charts readable
  - [ ] Spacing balanced

Desktop (1024px+):
  - [ ] 3-column layouts works
  - [ ] Full width usage
  - [ ] Hover states visible
```

**Test Tools**:
- Chrome DevTools: Ctrl+Shift+M
- Responsively App: https://responsively.app

---

### 3.4 Performance Testing
**Objective**: Page load < 3s, Interactions smooth

**Metrics**:
```
Lighthouse Score (DevTools → Lighthouse):
  - Performance: ≥ 80
  - Accessibility: ≥ 90
  - Best Practices: ≥ 85
  - SEO: ≥ 90

Time to Interactive (TTI): < 3s
Cumulative Layout Shift (CLS): < 0.1
First Contentful Paint (FCP): < 1.8s
```

**Test**:
```bash
# Run Lighthouse audit
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Mobile" + click "Analyze"
4. Target scores: P:80, A:90, BP:85, SEO:90
```

---

### 3.5 Accessibility Testing
**Checklist**:
```
- [ ] All form labels have <label> or aria-label
- [ ] Buttons have :focus styles
- [ ] Color contrast ≥ 4.5:1 (AA level)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Images have alt text
- [ ] Page structure with <h1>, <h2>, etc.
```

**Tool**: WAVE Browser Extension
```
https://wave.webaim.org/extension/
Click extension → Check for accessibility issues
```

---

## ✅ PHASE 4: INTEGRATION & SIGN-OFF (Tuần 4)

### 4.1 Full Integration Testing
**Objective**: All systems work together

**Test**:
```
1. Frontend → Mock API (login, dashboard)
2. Dashboard calls `/api/finance/dashboard/summary` ✓
3. Bot calls NLP extraction ✓
4. OCR service integration ready ✓
5. Advisor service integration ready ✓
```

### 4.2 Quality Gate Checklist
```
AI PROMPT QUALITY
- [ ] Advisor response quality ≥ 4.0/5
- [ ] NLP extraction accuracy ≥ 90%
- [ ] OCR accuracy ≥ 85%
- [ ] Prediction logic sensible ✓

BOT TESTING
- [ ] All 30 NLP test cases pass
- [ ] Advisor handles 5+ scenarios well
- [ ] OCR test set accuracy ≥ 85%
- [ ] E2E flows work end-to-end

UX/UI TESTING
- [ ] All Playwright tests pass
- [ ] Manual flow tests pass
- [ ] Responsive on 3 breakpoints
- [ ] Lighthouse scores ≥ target
- [ ] No accessibility issues
- [ ] < 3s page load time
```

### 4.3 Sign-Off Checklist
```
□ Phase 1: AI Prompt Review DONE
  - Advisor prompt optimized
  - NLP keywords expanded (90%+ accuracy)
  - OCR patterns validated (85%+ accuracy)
  - Prediction logic confirmed

□ Phase 2: Bot Testing DONE
  - NLP accuracy ≥ 90%
  - Advisor quality ≥ 4.0/5
  - OCR accuracy ≥ 85%
  - E2E flows validated

□ Phase 3: UX/UI Testing DONE
  - Component tests pass
  - User flows work
  - Responsive design ✓
  - Performance ≥ 80
  - Accessibility ✓

□ Phase 4: Ready for Production
  - All quality gates met
  - No critical bugs
  - Documentation complete
  - Team sign-off ✓
```

---

## 📝 Testing Tools & Resources

### Tools to Have Ready
```
API Testing:
  - Postman (or VS Code REST Client)
  - curl CLI
  - Python requests library

UI Testing:
  - Playwright (automated)
  - Browser DevTools (manual)
  - Responsively App (responsive testing)
  - WAVE Extension (accessibility)

Performance:
  - Chrome Lighthouse
  - Pagespeed Insights

Code Quality:
  - lint: npm run lint
  - type-check: tsc --noEmit
```

### Test Data Preparation
```
1. Prepare 20-30 NLP test cases
   → samples/nlp_test_cases.json

2. Prepare 10-15 receipt images for OCR
   → samples/receipts/ (with ground truth CSV)

3. Prepare 5-10 advisor test queries
   → samples/advisor_queries.txt

4. Prepare UI test scenarios
   → tests/flows.md
```

---

## 🎯 Success Criteria Summary

| Phase | Metric | Target | Actual |
|-------|--------|--------|--------|
| Phase 1 | Advisor Quality | 4.0/5 | [ ] |
| Phase 1 | NLP Accuracy | ≥90% | [ ] |
| Phase 1 | OCR Accuracy | ≥85% | [ ] |
| Phase 2 | Bot E2E Flows | Pass | [ ] |
| Phase 3 | UI Tests Pass | Pass | [ ] |
| Phase 3 | Lighthouse Score | 80+ | [ ] |
| Phase 3 | Mobile Responsive | Pass | [ ] |
| Phase 4 | All Quality Gates | PASS | [ ] |

---

## 🚀 Getting Started This Week

### Week 1 Actions
1. [ ] Clone & review AI services
2. [ ] Create `test_nlp_extraction.py`
3. [ ] Run 30 NLP test cases → Calculate accuracy
4. [ ] Review advisor prompts → Optimize if < 4.0/5
5. [ ] Prepare OCR test set (10-15 images)

### Week 2 Actions
1. [ ] Run OCR tests → Validate accuracy
2. [ ] Create advisor test harness
3. [ ] Run 10 advisor queries → Evaluate quality
4. [ ] Setup Playwright for UI tests
5. [ ] Create test dataset for manual flows

### Week 3-4 Actions
1. [ ] Run full Playwright test suite
2. [ ] Manual UX flow testing
3. [ ] Performance audit (Lighthouse)
4. [ ] Accessibility audit (WAVE)
5. [ ] Sign-off & documentation

---

## 📞 Troubleshooting

### NLP Accuracy < 90%
```
1. Check test cases are realistic
2. Review keyword mapping for gaps
3. Test POS tagging on complex inputs
4. Add more stop words if needed
5. Tune regex patterns for edge cases
```

### Advisor Response Poor Quality
```
1. Check context injection complete
2. Review system prompt clarity
3. Test with different temperatures (0.5 vs 0.7)
4. Verify token limits adequate
5. Test with more realistic financial data
```

### OCR Accuracy < 85%
```
1. Verify Tesseract Vietnamese trained data
2. Add image preprocessing (rotate, enhance)
3. Expand regex patterns for layouts
4. Test on more image samples
5. Consider Tesseract v5 or alternative (PaddleOCR)
```

### UI Tests Failing
```
1. Check selectors in Playwright (data-testid)
2. Verify port 3000 server running
3. Check for race conditions (add waits)
4. Review console errors (F12)
5. Test in Chromium vs Firefox
```

---

## 📚 References

- [Prompt Engineering Best Practices](https://github.com/dair-ai/Prompt-Engineering-Guide)
- [Playwright Testing Docs](https://playwright.dev)
- [Web Vitals Guide](https://web.dev/vitals/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
