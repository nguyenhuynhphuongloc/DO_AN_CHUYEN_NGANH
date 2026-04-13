# 📋 TEST EXECUTION GUIDE - FinTrack AI Testing

## 🎯 Mục Tiêu
Kiểm tra toàn diện Bot AI, Prompt, và UX/UI để xác định sẵn sàng công bố.

**Kết quả cuối**: Thư mục `test_results/` với tất cả scores, screenshots, và sign-off.

---

## ⏱️ Timeline & Thời Gian

| Tuần | Phase | Thời Gian Dự Kiến | Tên Thư Mục Kết Quả |
|-----|-------|------------------|---------------------|
| 1 | AI Prompt Review | 3-4 giờ | `test_results/phase_1_ai_prompt/` |
| 2 | Bot Testing | 3-4 giờ | `test_results/phase_2_bot/` |
| 3 | UX/UI Testing | 2-3 giờ | `test_results/phase_3_ui_ux/` |
| 4 | Integration & Sign-off | 2 giờ | `test_results/phase_4_signoff/` |

**Tổng cộng**: ~12-14 giờ testing trên 4 tuần

---

## 🚀 PHASE 1: AI PROMPT REVIEW (Tuần 1)

### Bước 1.1: Chuẩn Bị (15 phút)

```bash
# 1. Tạo thư mục kết quả
mkdir -p test_results/phase_1_ai_prompt

# 2. Mở terminal mới (nếu cần)
cd d:\Đồ án chuyên ngành\DO_AN_CHUYEN_NGANH

# 3. Check Python version
python --version
# Expected: Python 3.8+
```

**✓ Kết quả mong chờ**: Terminal sẵn sàng, Python installed

---

### Bước 1.2: Test NLP Bot Extraction (30 phút)

```bash
# 1. Chạy NLP test script
python tests/test_nlp_extraction.py

# 2. Script sẽ output:
#    - Từng test case (✓ PASS / ✗ FAIL)
#    - Accuracy %
#    - Danh sách failed cases
```

**Làm gì**:
```
a) Chạy lệnh trên
b) Chụp screenshot (full terminal output)
c) Lưu vào: test_results/phase_1_ai_prompt/01_nlp_test_output.txt
   (hoặc copy-paste kết quả vào file text)
d) Ghi nhớ accuracy %, failed cases (nếu có)
```

**✓ Target**: Accuracy ≥ 90%
**⚠️ Nếu < 90%**: 
```
Cần optimize:
  1. Thêm keywords vào nlp_service.py
  2. Improve regex patterns
  3. Adjust amount parsing logic
  
Document: cái gì failed, tại sao lỗi, đã fix chưa
```

**File to save**:
- `test_results/phase_1_ai_prompt/01_nlp_test_output.txt` ← Kết quả test

---

### Bước 1.3: Test Advisor Quality (30 phút)

**Điều kiện**: Qwen2.5-3B model installed & accessible

```bash
# 1. Check if model available
python -c "from transformers import AutoTokenizer; print('✓ Transformers library ready')"

# 2. Chạy Advisor test
python tests/test_advisor_quality.py

# 3. Script sẽ output:
#    - 5 scenarios + quality scores
#    - Individual evaluation points
#    - Overall score /5.0
```

**Làm gì**:
```bash
a) Chạy lệnh trên
b) Chụp screenshot hoặc copy output
c) Lưu vào: test_results/phase_1_ai_prompt/02_advisor_test_output.txt
d) Ghi nhớ overall score
```

**✓ Target**: Overall ≥ 4.0/5.0
**⚠️ Nếu < 4.0**:
```
Cần optimize:
  1. Rewrite system prompt (more specific)
  2. Inject more context (trend data)
  3. Adjust temperature (0.5 vs 0.7)
  4. Increase max_tokens if responses cut off

Document: thay đổi gì, test lại, score mới bao nhiêu
```

**File to save**:
- `test_results/phase_1_ai_prompt/02_advisor_test_output.txt` ← Kết quả test

---

### Bước 1.4: Review Advisor Prompt (Optional but Recommended)

```bash
# 1. Mở file advisor prompt
# File: AI/services/advisor_service.py (lines 10-37)

# 2. Checklist:
#    ✓ System prompt rõ ràng & specific?
#    ✓ Context injection đầy đủ (thu, chi, dư, trend)?
#    ✓ Temperature/token settings hợp lý?
#    ✓ Handling edge cases (sparse data)?

# 3. Nếu cần optimize:
#    - Edit file
#    - Re-run test
#    - Document changes
```

**File to save**:
- `test_results/phase_1_ai_prompt/03_prompt_review_notes.md`

Template:
```markdown
# Advisor Prompt Review

## Current System Prompt
[Copy paste from code]

## Issues Found
- [ ] Issue 1: ...
- [ ] Issue 2: ...

## Optimization Applied
- Change 1: [What was changed] → [Why]
- Change 2: ...

## Retest Results
Before: [score]
After: [score]
```

---

### Bước 1.5: Create Phase 1 Summary (15 phút)

Tạo file `test_results/phase_1_ai_prompt/PHASE_1_SUMMARY.md`:

```markdown
# PHASE 1: AI PROMPT REVIEW - RESULTS

## Date: [YYYY-MM-DD]

### 1.1 NLP Extraction Test
- Status: ✓ PASS / ⚠ FAIL
- Accuracy: __% (Target: ≥90%)
- Test cases passed: __/25
- Failed cases: [list if any]
- Time elapsed: __ minutes

**Files**:
- test_nlp_extraction.py execution result → 01_nlp_test_output.txt

### 1.2 Advisor Quality Test
- Status: ✓ PASS / ⚠ FAIL
- Overall score: __/5.0 (Target: ≥4.0)
- Scenario 1 (Normal): __/5.0
- Scenario 2 (Low balance): __/5.0
- Scenario 3 (Sparse data): __/5.0
- Scenario 4 (Money advice): __/5.0
- Scenario 5 (Edge case): __/5.0
- Time elapsed: __ minutes

**Files**:
- test_advisor_quality.py execution result → 02_advisor_test_output.txt

### 1.3 Advisor Prompt Review
- Reviewed: ✓ YES / ⚗ SKIPPED
- Issues found: __ (list below)
- Optimizations applied: __ (list below)

**Issues Found**:
1. ...

**Optimizations**:
1. ...

**Files**:
- Prompt review notes → 03_prompt_review_notes.md

### 1.4 Quality Gates

| Gate | Status | Notes |
|------|--------|-------|
| NLP ≥ 90% | ✓ PASS / ✗ FAIL | Accuracy: _% |
| Advisor ≥ 4.0 | ✓ PASS / ✗ FAIL | Score: _/5 |
| Prompt optimized | ✓ DONE / ⚠ SKIPPED | If needed |

### 1.5 Overall Phase Status

- [ ] All tests passed
- [ ] Issues documented
- [ ] Ready for Phase 2

**Sign-off**: ___________
**Date**: ___________
```

---

## 🤖 PHASE 2: BOT TESTING (Tuần 2)

### Bước 2.1: Full NLP Test Dataset (1 giờ)

Tiếp tục từ Phase 1, nhưng với thêm edge cases.

```bash
# 1. Chạy extended NLP test
python tests/test_nlp_extension.py

# 2. Nếu file này không tồn tại, dùng test_nlp_extraction.py lại
python tests/test_nlp_extraction.py > test_results/phase_2_bot/01_nlp_extended_test.txt
```

**File to save**:
- `test_results/phase_2_bot/01_nlp_extended_test.txt`

---

### Bước 2.2: Advisor Comprehensive Test (1 giờ)

```bash
# Run test multiple times with different contexts
# Save results to file

python tests/test_advisor_quality.py > test_results/phase_2_bot/02_advisor_comprehensive_test.txt

# If upgrading to real Qwen model, re-run with actual model
# Document any improvements/regressions
```

**File to save**:
- `test_results/phase_2_bot/02_advisor_comprehensive_test.txt`

---

### Bước 2.3: E2E Flow Testing (1.5 giờ)

Manual testing - Chat input → Transaction creation:

```bash
# 1. Keep frontend running
# http://localhost:3000

# 2. Open browser DevTools (F12)
# Go to Console tab - watch for errors

# 3. Test Flow A: Create transaction via chat
#    Input: "Chi 50k ăn sáng"
#    Check: Amount extracted correctly? Category correct?
#    Screenshot: test_results/phase_2_bot/03_flow_a_chat_input.png

# 4. Test Flow B: Upload receipt
#    Steps: Upload image → OCR parses → Amount shows → Confirm
#    Screenshot: test_results/phase_2_bot/04_flow_b_receipt_upload.png

# 5. Test Flow C: Ask Advisor
#    Input: "Tháng này tôi chi tiêu thế nào?"
#    Check: Response relevant & specific?
#    Screenshot: test_results/phase_2_bot/05_flow_c_advisor_question.png

# 6. Verify in Dashboard
#    Transaction created? Balance updated?
#    Screenshot: test_results/phase_2_bot/06_dashboard_updated.png
```

**Files to save**:
```
test_results/phase_2_bot/
├── 03_flow_a_chat_input.png (hoặc.txt)
├── 04_flow_b_receipt_upload.png
├── 05_flow_c_advisor_question.png
└── 06_dashboard_updated.png
```

**Ghi chú vào**: `test_results/phase_2_bot/02_e2e_flow_notes.txt`
```
Flow A: Chat Input
Status: ✓ PASS / ✗ FAIL
Notes: [Ghi chú chi tiết]

Flow B: Receipt Upload
Status: ✓ PASS / ✗ FAIL
Notes: [Ghi chú chi tiết]

Flow C: Advisor Question
Status: ✓ PASS / ✗ FAIL
Notes: [Ghi chú chi tiết]

Flow D: Dashboard Update
Status: ✓ PASS / ✗ FAIL
Notes: [Ghi chú chi tiết]
```

---

### Bước 2.4: Bot Quality Gate (15 phút)

Tạo `test_results/phase_2_bot/PHASE_2_SUMMARY.md`:

```markdown
# PHASE 2: BOT TESTING - RESULTS

## Date: [YYYY-MM-DD]

### 2.1 NLP Extended Test
- Status: ✓ PASS / ✗ FAIL
- Improvement from Phase 1: +_% (or same)
- Accuracy: __% 
- Files: 01_nlp_extended_test.txt

### 2.2 Advisor Comprehensive Test
- Status: ✓ PASS / ✗ FAIL
- Score: __/5.0
- Consistent with Phase 1? ✓ YES / ⚠ REGRESSION
- Files: 02_advisor_comprehensive_test.txt

### 2.3 E2E Flow Testing
- Flow A (Chat): ✓ PASS / ✗ FAIL
- Flow B (Receipt): ✓ PASS / ✗ FAIL
- Flow C (Advisor): ✓ PASS / ✗ FAIL
- Flow D (Dashboard): ✓ PASS / ✗ FAIL
- Screenshots: 03_*, 04_*, 05_*, 06_*
- Notes: 02_e2e_flow_notes.txt

### 2.4 Quality Gates

| Gate | Status | Metric |
|------|--------|--------|
| NLP ≥ 90% | ✓/✗ | __% |
| Advisor ≥ 4.0 | ✓/✗ | __/5 |
| E2E Flows | ✓/✗ | _/4 pass |

### 2.5 Bugs Found

- [ ] Bug 1: [Description]
  - Severity: Critical / High / Medium / Low
  - Status: New / In Progress / Fixed
  - Notes: ...

- [ ] Bug 2: ...

### 2.6 Overall Phase Status

- [ ] All bots working correctly
- [ ] E2E flows pass
- [ ] Ready for Phase 3 (UX/UI)

**Sign-off**: ___________
**Date**: ___________
```

---

## 🎨 PHASE 3: UX/UI TESTING (Tuần 3)

### Bước 3.1: Automated UI Testing (30 phút)

**Nếu có Playwright installed**:
```bash
# Run UI tests (if available)
# npm test (hoặc npx playwright test)

# Save output
# test_results/phase_3_ui_ux/01_playwright_test_results.txt
```

**Nếu không có Playwright**: Skip step này, do manual testing thay thế.

---

### Bước 3.2: Manual UI Testing (2 giờ)

Sử dụng file `tests/UI_TESTING_CHECKLIST.md`:

```bash
# 1. Mở file checklist
cat tests/UI_TESTING_CHECKLIST.md

# 2. Go through từng feature:
#    - Login page
#    - Dashboard
#    - Chat/Transaction input
#    - Receipt upload
#    - AI Advisor
#    - Navigation
#    - Responsive design
#    - Accessibility
#    - Performance

# 3. Untuk mỗi feature, chụp screenshot & ghi kết quả

# 4. Lưu vào test_results/phase_3_ui_ux/
#    02_feature_login.png
#    03_feature_dashboard.png
#    04_feature_chat.png
#    ... etc
```

**Checklist Completion**:
```bash
# Copy tests/UI_TESTING_CHECKLIST.md về
cp tests/UI_TESTING_CHECKLIST.md test_results/phase_3_ui_ux/CHECKLIST_COMPLETED.md

# Sau khi test xong, fill in:
#   - Thay [ ] thành [✓] nếu pass
#   - Ghi notes lại vấn đề tìm được
#   - Tính tổng điểm pass/fail
```

---

### Bước 3.3: Performance Audit (30 phút)

```bash
# 1. Mở DevTools (F12) trong browser
# 2. Tab → Lighthouse
# 3. Click "Analyze page load"
# 4. Wait → Results show scores
# 5. Screenshot results

# Save:
#   test_results/phase_3_ui_ux/05_lighthouse_performance.png
#   test_results/phase_3_ui_ux/06_lighthouse_accessibility.png
#   test_results/phase_3_ui_ux/07_lighthouse_best_practices.png
#   test_results/phase_3_ui_ux/08_lighthouse_seo.png

# Or export as JSON:
#   test_results/phase_3_ui_ux/lighthouse_report.json
```

**Targets**:
```
Performance: ≥ 80 (Green)
Accessibility: ≥ 90 (Green)
Best Practices: ≥ 85 (Green)
SEO: ≥ 90 (Green)
```

---

### Bước 3.4: Accessibility Audit (15 phút)

```bash
# 1. Install WAVE extension (if not already)
# https://wave.webaim.org/extension/

# 2. Open http://localhost:3000/dashboard
# 3. Click WAVE icon
# 4. Review errors (red) and warnings (yellow)
# 5. Screenshot results

# Save:
#   test_results/phase_3_ui_ux/09_wave_audit.png

# Summary:
#   - Errors found: __
#   - Warnings found: __
#   - All labels present? ✓/✗
#   - Keyboard navigation works? ✓/✗
#   - Color contrast OK? ✓/✗
```

---

### Bước 3.5: Responsive Design Testing (30 phút)

```bash
# 1. DevTools → Toggle device toolbar (Ctrl+Shift+M)
# 2. Test 3 breakpoints:

# Mobile (375px)
#   - Check all elements visible
#   - No horizontal scroll
#   - Buttons clickable (>44px)
#   - Font size ≥ 16px
#   Screenshot: test_results/phase_3_ui_ux/10_mobile_375px.png

# Tablet (768px)
#   - 2-column layout works
#   - Spacing balanced
#   Screenshot: test_results/phase_3_ui_ux/11_tablet_768px.png

# Desktop (1024px)
#   - Full layout
#   - All features visible
#   Screenshot: test_results/phase_3_ui_ux/12_desktop_1024px.png
```

---

### Bước 3.6: UI/UX Summary (20 phút)

Tạo `test_results/phase_3_ui_ux/PHASE_3_SUMMARY.md`:

```markdown
# PHASE 3: UX/UI TESTING - RESULTS

## Date: [YYYY-MM-DD]

### 3.1 Manual UI Testing
- Status: ✓ PASS / ✗ FAIL
- Features tested: __ / 7
  - [ ] Login page
  - [ ] Dashboard
  - [ ] Chat input
  - [ ] Receipt upload
  - [ ] AI Advisor
  - [ ] Navigation
  - [ ] Responsive design
- Bugs found: __ (see CHECKLIST_COMPLETED.md)
- Files: CHECKLIST_COMPLETED.md

### 3.2 Performance (Lighthouse)
- Performance: __ / 100 (Target: ≥80)
- Accessibility: __ / 100 (Target: ≥90)
- Best Practices: __ / 100 (Target: ≥85)
- SEO: __ / 100 (Target: ≥90)
- Files: 05_*, 06_*, 07_*, 08_*

### 3.3 Accessibility (WAVE)
- Errors: __ (Target: 0)
- Warnings: __ (Target: <5)
- All labels present: ✓/✗
- Keyboard navigation: ✓/✗
- Color contrast: ✓/✗
- Files: 09_wave_audit.png

### 3.4 Responsive Design
- Mobile (375px): ✓ PASS / ✗ FAIL
- Tablet (768px): ✓ PASS / ✗ FAIL
- Desktop (1024px): ✓ PASS / ✗ FAIL
- Files: 10_*, 11_*, 12_*

### 3.5 Quality Gates

| Gate | Status | Notes |
|------|--------|-------|
| Features ✓ | __/7 | List any failed |
| Performance ≥80 | ✓/✗ | Score: __ |
| Accessibility ≥90 | ✓/✗ | Score: __ |
| Best Practices ≥85 | ✓/✗ | Score: __ |
| SEO ≥90 | ✓/✗ | Score: __ |
| Mobile responsive | ✓/✗ | Issues: ... |

### 3.6 Bugs Found

- [ ] Bug 1: [UI issue]
  - Component: ...
  - Severity: Critical / High / Medium / Low
  - Status: New / Fixed
  
- [ ] Bug 2: ...

### 3.7 Overall Phase Status

- [ ] All features work
- [ ] Performance acceptable
- [ ] Accessibility meets standards
- [ ] Responsive on all devices
- [ ] Ready for Phase 4

**Sign-off**: ___________
**Date**: ___________
```

---

## ✅ PHASE 4: INTEGRATION & SIGN-OFF (Tuần 4)

### Bước 4.1: All Systems Integration Check (30 phút)

```bash
# Checklist:
# [ ] Frontend ✓ running & responsive
# [ ] NLP Bot ✓ extraction accuracy ≥90%
# [ ] Advisor ✓ quality ≥4.0/5
# [ ] E2E flows ✓ working
# [ ] UI/UX ✓ professional & accessible
# [ ] Performance ✓ Lighthouse scores met
# [ ] No critical bugs

Document:
  test_results/phase_4_signoff/01_integration_checklist.txt
```

---

### Bước 4.2: Bug List & Fix Status (30 phút)

Create comprehensive bug report:

```markdown
# Bug Report - Final Status

## Critical Bugs
- [ ] Bug 1: [Description]
  - Status: ✓ FIXED / ⚠ KNOWN ISSUE
  - Severity: CRITICAL
  
## High Priority Bugs
- [ ] Bug 1: ...

## Medium Priority Bugs
- [ ] Bug 1: ...

## Low Priority (Nice-to-have)
- [ ] Bug 1: ...

## Summary
- Total bugs found: __
- Fixed: __
- Known issues (documented): __
- Blockers for production: ✓ NONE / ⚠ __ items
```

Save: `test_results/phase_4_signoff/02_bug_list_final.md`

---

### Bước 4.3: Final Quality Gate Review (15 phút)

```markdown
# QUALITY GATES - FINAL REVIEW

## AI PROMPT QUALITY
[x] NLP Extraction ≥ 90% ───────────── __% ✓
[x] Advisor Quality ≥ 4.0/5 ────────── __/5 ✓
[x] Prompt optimized ───────────────── ✓

## BOT TESTING
[x] E2E Flows working ────────────────── 4/4 ✓
[x] Chat extraction accurate ────────── ✓
[x] Advisor responses quality ───────── ✓

## UX/UI TESTING
[x] All features functional ────────── 7/7 ✓
[x] Mobile responsive ────────────────── ✓
[x] Desktop responsive ────────────────── ✓
[x] Accessibility (WAVE) ─────────────── ✓ 0 errors
[x] Performance (Lighthouse) ────────── 80+/100 ✓

## FINAL STATUS

✓ ALL QUALITY GATES PASSED - PRODUCTION READY

OR

⚠ QUALITY GATES: __ ISSUES REMAIN
   - Issue 1: [Can wait for next release]
   - Issue 2: [Low priority fix]
   [NOT production ready YET]
```

Save: `test_results/phase_4_signoff/03_quality_gates_final.md`

---

### Bước 4.4: Comprehensive Sign-Off Document (1 giờ)

Create final report: `test_results/FINAL_TESTING_REPORT.md`

```markdown
# 🎉 FINTRACK AI - FINAL TESTING REPORT

**Project**: Personal Finance MVP (FinTrack)
**Date**: [YYYY-MM-DD]
**Tester**: [Your name]
**Testing Duration**: [4 weeks, ~12-14 hours total]

---

## EXECUTIVE SUMMARY

[1-2 paragraph overview of testing, major findings, recommendation]

### TEST RESULTS OVERVIEW

| Phase | Status | Key Metric |
|-------|--------|-----------|
| Phase 1: AI Prompt | ✓ PASS | NLP: __% / Advisor: __/5 |
| Phase 2: Bot Testing | ✓ PASS | E2E: 4/4 flows ✓ |
| Phase 3: UX/UI | ✓ PASS | Lighthouse: __ / Accessibility: ✓ |
| Phase 4: Integration | ✓ PASS | All gates: PASS |

### OVERALL RECOMMENDATION

- [ ] **✓ PRODUCTION READY** - Deploy with confidence
- [ ] **⚠ CONDITIONAL** - [X issues to fix before deploy]
- [ ] **✗ NOT READY** - [Major rework needed]

---

## DETAILED FINDINGS

### Phase 1: AI Prompt Review
[Summary of findings, scores, optimizations made]

### Phase 2: Bot Testing  
[Summary of bot accuracy, E2E flows, any regressions]

### Phase 3: UX/UI Testing
[Summary of UI quality, performance, accessibility, responsive design]

### Phase 4: Integration
[Summary of integration testing, final bug list]

---

## QUALITY METRICS

### AI Quality
- NLP Extraction Accuracy: __% (✓ Target ≥90%)
- Advisor Response Quality: __/5 (✓ Target ≥4.0)
- Prompt clarity: ✓ Good

### Bot Quality
- E2E Flow Success: 4/4 (✓ 100%)
- Chat extraction: ✓ Accurate
- Advisor responses: ✓ Relevant

### UX/UI Quality
- Feature completeness: 7/7 (✓ 100%)
- Lighthouse Performance: __ (✓ Target ≥80)
- Lighthouse Accessibility: __ (✓ Target ≥90)
- WAVE audit: ✓ 0 critical errors
- Mobile responsiveness: ✓ Pass
- Desktop responsiveness: ✓ Pass

### Performance Baselines
- Page load time: < 2s ✓
- Chat response: < 1s ✓
- OCR processing: < 3s ✓
- Advisor generation: < 5s ✓

---

## BUGS & ISSUES

### Critical Bugs
[List or "None found"]

### High Priority Bugs
[List or "None found"]

### Medium Priority Bugs
[List or "None found"]

### Low Priority / Nice-to-have
[List or "None - fully satisfied"]

---

## RECOMMENDATIONS

### For Production
1. [Action item with priority]
2. [Action item]

### For Future Improvements
1. [Nice-to-have enhancement]
2. [Performance optimization]

---

## TEST ARTIFACTS

All testing artifacts located in: `test_results/`

Structure:
```
test_results/
├── phase_1_ai_prompt/
│   ├── 01_nlp_test_output.txt
│   ├── 02_advisor_test_output.txt
│   ├── 03_prompt_review_notes.md
│   └── PHASE_1_SUMMARY.md
├── phase_2_bot/
│   ├── 01_nlp_extended_test.txt
│   ├── 02_advisor_comprehensive_test.txt
│   ├── 02_e2e_flow_notes.txt
│   ├── 03_flow_a_chat_input.png
│   ├── 04_flow_b_receipt_upload.png
│   ├── 05_flow_c_advisor_question.png
│   ├── 06_dashboard_updated.png
│   └── PHASE_2_SUMMARY.md
├── phase_3_ui_ux/
│   ├── CHECKLIST_COMPLETED.md (✓/✗ all items)
│   ├── 05_lighthouse_performance.png
│   ├── 09_wave_audit.png
│   ├── 10_mobile_375px.png
│   ├── 11_tablet_768px.png
│   ├── 12_desktop_1024px.png
│   └── PHASE_3_SUMMARY.md
├── phase_4_signoff/
│   ├── 01_integration_checklist.txt
│   ├── 02_bug_list_final.md
│   ├── 03_quality_gates_final.md
│   └── PHASE_4_SUMMARY.md
└── FINAL_TESTING_REPORT.md ← YOU ARE HERE
```

---

## SIGN-OFF

### Testing Lead
- **Name**: ___________________
- **Date**: ___________________
- **Signature**: ___________________

### Project Manager / Tech Lead
- **Name**: ___________________
- **Date**: ___________________
- **Signature**: ___________________
- **Decision**: ✓ APPROVED / ⚠ APPROVED WITH CONDITIONS / ✗ REJECTED

### Notes
[Any final comments or caveats]

---

## APPENDICES

### A. Full Test Scripts Output
[Link to individual test files]

### B. All Screenshots
[Links to screenshot files]

### C. Lighthouse Reports
[Links to performance reports]

### D. Code Changes Made During Testing
[Document any code optimizations applied]

### E. Test Request & Scope
[Original testing request details]

---

**Report Generated**: [Timestamp]
**Version**: 1.0
**Classification**: Internal / Confidential / Public
```

Save: `test_results/FINAL_TESTING_REPORT.md`

---

## 📂 Final Directory Structure

Sau khi hoàn tất, thư mục `test_results/` sẽ trông như thế:

```
test_results/
├── README.md (index của tất cả files)
├── FINAL_TESTING_REPORT.md (main report)
├── phase_1_ai_prompt/
│   ├── 01_nlp_test_output.txt
│   ├── 02_advisor_test_output.txt
│   ├── 03_prompt_review_notes.md
│   └── PHASE_1_SUMMARY.md
├── phase_2_bot/
│   ├── 01_nlp_extended_test.txt
│   ├── 02_advisor_comprehensive_test.txt
│   ├── 02_e2e_flow_notes.txt
│   ├── 03_flow_a_chat_input.png (hoặc .txt)
│   ├── 04_flow_b_receipt_upload.png
│   ├── 05_flow_c_advisor_question.png
│   ├── 06_dashboard_updated.png
│   └── PHASE_2_SUMMARY.md
├── phase_3_ui_ux/
│   ├── CHECKLIST_COMPLETED.md
│   ├── 05_lighthouse_performance.png
│   ├── 06_lighthouse_accessibility.png
│   ├── 07_lighthouse_best_practices.png
│   ├── 08_lighthouse_seo.png
│   ├── 09_wave_audit.png
│   ├── 10_mobile_375px.png
│   ├── 11_tablet_768px.png
│   ├── 12_desktop_1024px.png
│   └── PHASE_3_SUMMARY.md
├── phase_4_signoff/
│   ├── 01_integration_checklist.txt
│   ├── 02_bug_list_final.md
│   ├── 03_quality_gates_final.md
│   └── PHASE_4_SUMMARY.md
└── [archived test data if needed]
```

---

## 🎯 Quick Checklist - What to Do Each Week

### Week 1: Phase 1
- [ ] Run `test_nlp_extraction.py` → Save output
- [ ] Run `test_advisor_quality.py` → Save output
- [ ] Review advisor prompt → Document notes
- [ ] Create `PHASE_1_SUMMARY.md`

### Week 2: Phase 2
- [ ] Run NLP extended test → Save
- [ ] Run Advisor comprehensive test → Save
- [ ] Manual E2E flow testing → Screenshots
- [ ] Create `PHASE_2_SUMMARY.md`

### Week 3: Phase 3
- [ ] Manual UI testing all features → Screenshots & notes
- [ ] Lighthouse audit → Screenshot scores
- [ ] WAVE accessibility audit → Screenshot
- [ ] Responsive design testing → Screenshots (3 breakpoints)
- [ ] Complete `UI_TESTING_CHECKLIST.md`
- [ ] Create `PHASE_3_SUMMARY.md`

### Week 4: Phase 4
- [ ] Compile all bugs → `bug_list_final.md`
- [ ] Review all quality gates → `quality_gates_final.md`
- [ ] Create `FINAL_TESTING_REPORT.md`
- [ ] Get sign-offs from team

---

## 🚀 How to Get Started

```bash
# 1. Create test_results directory
mkdir -p test_results/{phase_1_ai_prompt,phase_2_bot,phase_3_ui_ux,phase_4_signoff}

# 2. Start Phase 1 (right now)
python tests/test_nlp_extraction.py

# 3. Document results as you go
# Save outputs, screenshots, notes into corresponding phase folders

# 4. Each week, create phase summary
nano test_results/phaseX_SUMMARY.md
```

**Expected Time**: 12-14 hours total over 4 weeks
**Expected Outcome**: Professional testing report + production readiness confirmation

Good luck! 🎉
