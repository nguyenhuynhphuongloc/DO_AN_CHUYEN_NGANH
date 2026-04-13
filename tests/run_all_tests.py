#!/usr/bin/env python3
"""
Automated Test Execution Script for FinTrack AI
Chạy all tests, lưu kết quả vào files, generate summary

Usage:
    python run_all_tests.py

Output:
    test_results/
    ├── phase_1_ai_prompt/
    ├── phase_2_bot/
    ├── phase_3_ui_ux/
    └── TESTING_RESULTS_[DATE].txt
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Setup
BASE_DIR = Path(__file__).parent
TEST_DIR = BASE_DIR / "test_results"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")

def create_test_structure():
    """Create test_results directory structure"""
    folders = [
        TEST_DIR,
        TEST_DIR / "phase_1_ai_prompt",
        TEST_DIR / "phase_2_bot",
        TEST_DIR / "phase_3_ui_ux",
        TEST_DIR / "phase_4_signoff",
    ]
    for folder in folders:
        folder.mkdir(parents=True, exist_ok=True)
    print("✓ Test directory structure created")

def run_command(cmd, output_file=None, label=""):
    """Run command and capture output"""
    print(f"\n{'='*70}")
    print(f"Running: {label}")
    print(f"Command: {cmd}")
    print('='*70)
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        
        output = result.stdout + result.stderr
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# {label}\n")
                f.write(f"# Executed: {datetime.now().isoformat()}\n")
                f.write(f"# Command: {cmd}\n\n")
                f.write(output)
            print(f"✓ Output saved to: {output_file}")
        
        print(output[:500])  # Print first 500 chars
        if len(output) > 500:
            print(f"... (total {len(output)} chars)")
        
        return {
            "status": "success" if result.returncode == 0 else "failed",
            "return_code": result.returncode,
            "output_file": str(output_file) if output_file else None,
            "output_length": len(output)
        }
    
    except subprocess.TimeoutExpired:
        return {
            "status": "timeout",
            "return_code": -1,
            "output_file": str(output_file) if output_file else None,
            "error": "Test execution timed out (>5 minutes)"
        }
    
    except Exception as e:
        return {
            "status": "error",
            "return_code": -1,
            "output_file": str(output_file) if output_file else None,
            "error": str(e)
        }

def run_phase1_tests():
    """PHASE 1: AI Prompt Review"""
    print("\n" + "="*70)
    print("PHASE 1: AI PROMPT REVIEW")
    print("="*70)
    
    results = {
        "phase": "Phase 1: AI Prompt Review",
        "timestamp": datetime.now().isoformat(),
        "tests": {}
    }
    
    # Test 1: NLP Extraction
    nlp_output = TEST_DIR / "phase_1_ai_prompt" / "01_nlp_test_output.txt"
    cmd = f"cd {BASE_DIR} && python tests/test_nlp_extraction.py"
    nlp_result = run_command(cmd, nlp_output, "NLP Extraction Test")
    results["tests"]["nlp_extraction"] = nlp_result
    
    # Test 2: Advisor Quality (if possible)
    advisor_output = TEST_DIR / "phase_1_ai_prompt" / "02_advisor_test_output.txt"
    cmd = f"cd {BASE_DIR} && python tests/test_advisor_quality.py"
    advisor_result = run_command(cmd, advisor_output, "Advisor Quality Test")
    results["tests"]["advisor_quality"] = advisor_result
    
    # Save summary
    summary_file = TEST_DIR / "phase_1_ai_prompt" / "PHASE_1_SUMMARY.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Phase 1 summary saved: {summary_file}")
    return results

def run_phase2_tests():
    """PHASE 2: Bot Testing"""
    print("\n" + "="*70)
    print("PHASE 2: BOT TESTING")
    print("="*70)
    
    results = {
        "phase": "Phase 2: Bot Testing",
        "timestamp": datetime.now().isoformat(),
        "tests": {},
        "manual_required": [
            "E2E flow testing (chat, receipt, advisor)",
            "Screenshot capture of flows"
        ]
    }
    
    # Re-run NLP with extended dataset (if available)
    nlp_output = TEST_DIR / "phase_2_bot" / "01_nlp_extended_test.txt"
    cmd = f"cd {BASE_DIR} && python tests/test_nlp_extraction.py"
    nlp_result = run_command(cmd, nlp_output, "NLP Extended Test")
    results["tests"]["nlp_extended"] = nlp_result
    
    # Re-run Advisor test
    advisor_output = TEST_DIR / "phase_2_bot" / "02_advisor_comprehensive_test.txt"
    cmd = f"cd {BASE_DIR} && python tests/test_advisor_quality.py"
    advisor_result = run_command(cmd, advisor_output, "Advisor Comprehensive Test")
    results["tests"]["advisor_comprehensive"] = advisor_result
    
    # Manual E2E note
    e2e_note = TEST_DIR / "phase_2_bot" / "02_e2e_flow_notes.txt"
    with open(e2e_note, 'w') as f:
        f.write("""# E2E Flow Testing Notes

## Manual Testing Required

### Flow A: Chat Transaction Input
- [ ] Input: "Chi 50k ăn sáng"
- [ ] Verify: Amount extracted, category correct
- [ ] Screenshot: ../03_flow_a_chat_input.png
- [ ] Status: ✓ PASS / ✗ FAIL
- [ ] Notes: ...

### Flow B: Receipt Upload  
- [ ] Upload receipt image
- [ ] Verify: OCR parses amount correctly
- [ ] Screenshot: ../04_flow_b_receipt_upload.png
- [ ] Status: ✓ PASS / ✗ FAIL
- [ ] Notes: ...

### Flow C: Advisor Question
- [ ] Input: "Tháng này tôi chi tiêu thế nào?"
- [ ] Verify: Response relevant with specific numbers
- [ ] Screenshot: ../05_flow_c_advisor_question.png
- [ ] Status: ✓ PASS / ✗ FAIL
- [ ] Notes: ...

### Flow D: Dashboard Update
- [ ] Verify: New transaction appears
- [ ] Verify: Balance updated
- [ ] Screenshot: ../06_dashboard_updated.png
- [ ] Status: ✓ PASS / ✗ FAIL
- [ ] Notes: ...

## Summary
Date tested: _________
Tester: _________
Flows passed: __/4
Issues found: ___________
""")
    print(f"✓ E2E flow template created: {e2e_note}")
    
    # Save summary
    summary_file = TEST_DIR / "phase_2_bot" / "PHASE_2_SUMMARY.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Phase 2 summary saved: {summary_file}")
    return results

def run_phase3_tests():
    """PHASE 3: UX/UI Testing"""
    print("\n" + "="*70)
    print("PHASE 3: UX/UI TESTING")
    print("="*70)
    
    results = {
        "phase": "Phase 3: UX/UI Testing",
        "timestamp": datetime.now().isoformat(),
        "manual_required": [
            "UI component testing (login, dashboard, etc)",
            "Lighthouse performance audit (DevTools)",
            "WAVE accessibility audit (browser extension)",
            "Responsive design testing (mobile, tablet, desktop)",
            "UI_TESTING_CHECKLIST.md completion"
        ],
        "next_steps": [
            "1. Copy UI_TESTING_CHECKLIST.md to test_results/phase_3_ui_ux/CHECKLIST_COMPLETED.md",
            "2. Go through checklist systematically",
            "3. Take screenshots for each feature",
            "4. Run Lighthouse: DevTools → Lighthouse → Analyze",
            "5. Run WAVE: Install WAVE extension → Click on page",
            "6. Test responsive: DevTools → Toggle device toolbar (Ctrl+Shift+M)",
            "7. Document all findings in PHASE_3_SUMMARY.md"
        ]
    }
    
    # Create UI testing guide
    ui_guide = TEST_DIR / "phase_3_ui_ux" / "UI_TESTING_INSTRUCTIONS.md"
    with open(ui_guide, 'w') as f:
        f.write("""# Phase 3: UI/UX Testing Instructions

## Quick Start

1. **Frontend must be running**
   ```bash
   # Terminal: http://localhost:3000
   ```

2. **Complete UI Checklist** (2-3 hours)
   ```bash
   cp tests/UI_TESTING_CHECKLIST.md test_results/phase_3_ui_ux/CHECKLIST_COMPLETED.md
   # Then fill in as you test
   ```

3. **Performance Audit** (30 min)
   - Open browser DevTools (F12)
   - Click "Lighthouse" tab
   - Click "Analyze page load"
   - Screenshot results → save as 05_lighthouse_performance.png

4. **Accessibility Audit** (15 min)
   - Install WAVE extension: https://wave.webaim.org/extension/
   - Open http://localhost:3000/dashboard
   - Click WAVE icon
   - Screenshot → save as 09_wave_audit.png

5. **Responsive Design** (30 min)
   - DevTools → Toggle device toolbar (Ctrl+Shift+M)
   - Test 3 sizes with screenshots:
     - 375px (mobile)  → 10_mobile_375px.png
     - 768px (tablet)  → 11_tablet_768px.png
     - 1024px (desktop) → 12_desktop_1024px.png

6. **Create Summary** (20 min)
   - Create PHASE_3_SUMMARY.md with all findings

## Target Scores

| Metric | Target | Your Score |
|--------|--------|-----------|
| Lighthouse Performance | ≥ 80 | ___ |
| Lighthouse Accessibility | ≥ 90 | ___ |
| Lighthouse Best Practices | ≥ 85 | ___ |
| Lighthouse SEO | ≥ 90 | ___ |
| WAVE Errors | 0 | ___ |
| All features work | ✓ | ___ |
| Mobile responsive | ✓ | ___ |
| Desktop responsive | ✓ | ___ |

## Files to Create

- test_results/phase_3_ui_ux/
  ├── CHECKLIST_COMPLETED.md (from template)
  ├── 05_lighthouse_performance.png
  ├── 06_lighthouse_accessibility.png
  ├── 07_lighthouse_best_practices.png
  ├── 08_lighthouse_seo.png
  ├── 09_wave_audit.png
  ├── 10_mobile_375px.png
  ├── 11_tablet_768px.png
  ├── 12_desktop_1024px.png
  └── PHASE_3_SUMMARY.md
""")
    
    print(f"✓ UI testing guide created: {ui_guide}")
    
    # Save summary
    summary_file = TEST_DIR / "phase_3_ui_ux" / "PHASE_3_SUMMARY.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ Phase 3 summary saved: {summary_file}")
    return results

def run_phase4_tests():
    """PHASE 4: Integration & Sign-off"""
    print("\n" + "="*70)
    print("PHASE 4: INTEGRATION & SIGN-OFF")
    print("="*70)
    
    results = {
        "phase": "Phase 4: Integration & Sign-off",
        "timestamp": datetime.now().isoformat(),
        "manual_required": [
            "Review all phase results",
            "Compile bug list",
            "Quality gate review",
            "Final sign-off"
        ],
        "next_steps": [
            "1. Review test_results/ folder structure",
            "2. Check all PHASE_X_SUMMARY.md files",
            "3. Compile final bug list → 02_bug_list_final.md",
            "4. Review quality gates → 03_quality_gates_final.md",
            "5. Create comprehensive FINAL_TESTING_REPORT.md",
            "6. Get team sign-off"
        ]
    }
    
    # Create sign-off template
    signoff_template = TEST_DIR / "phase_4_signoff" / "SIGN_OFF_TEMPLATE.md"
    with open(signoff_template, 'w') as f:
        f.write("""# FinTrack AI - Sign-Off Document

**Date**: ___________
**Testing Duration**: 4 weeks

## Quality Gates Summary

| Gate | Target | Actual | Status |
|------|--------|--------|--------|
| Phase 1: NLP Accuracy | ≥90% | __% | ✓/✗ |
| Phase 1: Advisor Quality | ≥4.0/5 | __/5 | ✓/✗ |
| Phase 2: E2E Flows | 4/4 pass | __/4 | ✓/✗ |
| Phase 3: Lighthouse Perf | ≥80 | ___ | ✓/✗ |
| Phase 3: WAVE Errors | 0 | ___ | ✓/✗ |
| Phase 3: Mobile Responsive | ✓ | ✓/✗ | ✓/✗ |

## Critical Issues

- [ ] Issue 1: None found
- [ ] Issue 2: [Add if any]

## Overall Assessment

✓ PRODUCTION READY
  All quality gates passed, no critical issues found.
  Ready to deploy and announce to users.

OR

⚠ CONDITIONAL APPROVAL  
  Most quality gates passed, but [X] known issues:
  - [Issue] - Fix in next sprint
  Can deploy with documented limitations.

OR

✗ NOT READY
  [X] quality gates failed:
  - [Blocker 1]
  - [Blocker 2]
  Needs significant work before deployment.

## Team Sign-Off

**Tester**: _____________ Date: _____
**Tech Lead**: _____________ Date: _____
**PM**: _____________ Date: _____

## Notes

[Any additional comments]
""")
    
    print(f"✓ Sign-off template created: {signoff_template}")
    
    # Save summary
    summary_file = TEST_DIR / "phase_4_signoff" / "PHASE_4_SUMMARY.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ Phase 4 summary saved: {summary_file}")
    return results

def create_master_summary(results):
    """Create overall testing summary"""
    summary_file = TEST_DIR / f"TESTING_RESULTS_{TIMESTAMP}.txt"
    
    summary_text = f"""
╔════════════════════════════════════════════════════════════════════════════╗
║                 FINTRACK AI SYSTEM - TEST EXECUTION SUMMARY                ║
╚════════════════════════════════════════════════════════════════════════════╝

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Timestamp: {TIMESTAMP}

═══════════════════════════════════════════════════════════════════════════════

PHASE 1: AI PROMPT REVIEW
───────────────────────────────────────────────────────────────────────────────

NLP Extraction Test
  Status: {results['phase1'].get('tests', {}).get('nlp_extraction', {}).get('status', 'unknown')}
  Output: {results['phase1'].get('tests', {}).get('nlp_extraction', {}).get('output_file', 'N/A')}
  ➜ Check: test_results/phase_1_ai_prompt/01_nlp_test_output.txt
  
Advisor Quality Test  
  Status: {results['phase1'].get('tests', {}).get('advisor_quality', {}).get('status', 'unknown')}
  Output: {results['phase1'].get('tests', {}).get('advisor_quality', {}).get('output_file', 'N/A')}
  ➜ Check: test_results/phase_1_ai_prompt/02_advisor_test_output.txt

Summary: test_results/phase_1_ai_prompt/PHASE_1_SUMMARY.json

═══════════════════════════════════════════════════════════════════════════════

PHASE 2: BOT TESTING
───────────────────────────────────────────────────────────────────────────────

NLP Extended Test
  Status: {results['phase2'].get('tests', {}).get('nlp_extended', {}).get('status', 'unknown')}
  Output: {results['phase2'].get('tests', {}).get('nlp_extended', {}).get('output_file', 'N/A')}
  ➜ Check: test_results/phase_2_bot/01_nlp_extended_test.txt

Advisor Comprehensive Test
  Status: {results['phase2'].get('tests', {}).get('advisor_comprehensive', {}).get('status', 'unknown')}
  Output: {results['phase2'].get('tests', {}).get('advisor_comprehensive', {}).get('output_file', 'N/A')}
  ➜ Check: test_results/phase_2_bot/02_advisor_comprehensive_test.txt

E2E Flow Testing
  Manual testing required - see: test_results/phase_2_bot/02_e2e_flow_notes.txt
  ➜ Test: Chat → Receipt → Advisor → Dashboard
  
Summary: test_results/phase_2_bot/PHASE_2_SUMMARY.json

═══════════════════════════════════════════════════════════════════════════════

PHASE 3: UX/UI TESTING  
───────────────────────────────────────────────────────────────────────────────

Manual Testing Required
  - UI components: Login, Dashboard, Chat, Receipt, Advisor
  - Performance: Lighthouse audit (DevTools)
  - Accessibility: WAVE extension check
  - Responsive: Mobile (375px), Tablet (768px), Desktop (1024px)
  
Instructions: test_results/phase_3_ui_ux/UI_TESTING_INSTRUCTIONS.md
Checklist: test_results/phase_3_ui_ux/CHECKLIST_COMPLETED.md (to be filled)

Target Scores:
  ✓ Lighthouse Performance: ≥ 80/100
  ✓ Lighthouse Accessibility: ≥ 90/100
  ✓ Lighthouse Best Practices: ≥ 85/100
  ✓ Lighthouse SEO: ≥ 90/100
  ✓ WAVE Audit: 0 critical errors
  ✓ Mobile Responsive: PASS
  ✓ Desktop Responsive: PASS

Summary: test_results/phase_3_ui_ux/PHASE_3_SUMMARY.json

═══════════════════════════════════════════════════════════════════════════════

PHASE 4: INTEGRATION & SIGN-OFF
───────────────────────────────────────────────────────────────────────────────

Quality Gates Review
  - All phases passed? [Review each phase]
  - Critical bugs? [Check bug_list_final.md]
  - Ready for production? [Team decision]

Sign-off Template: test_results/phase_4_signoff/SIGN_OFF_TEMPLATE.md

Summary: test_results/phase_4_signoff/PHASE_4_SUMMARY.json

═══════════════════════════════════════════════════════════════════════════════

📂 ALL TEST RESULTS ARE IN: test_results/

Structure:
{summary_structure()}

═══════════════════════════════════════════════════════════════════════════════

🎯 NEXT STEPS

1. START PHASE 1 NOW:
   - Open: test_results/phase_1_ai_prompt/01_nlp_test_output.txt
   - Verify the NLP accuracy ≥ 90%
   - Review advisor quality ≥ 4.0/5

2. WEEK 2 - PHASE 2:
   - Run extended tests
   - Manual E2E flow testing
   - Document results

3. WEEK 3 - PHASE 3:
   - Complete UI testing checklist
   - Run Lighthouse audit
   - Run WAVE accessibility check
   - Test responsive design

4. WEEK 4 - PHASE 4:
   - Compile all results
   - Create final report
   - Get team sign-off

═══════════════════════════════════════════════════════════════════════════════

✓ Test environment ready for execution
✓ All template files created
✓ Ready to collect results

For detailed instructions, see: TEST_EXECUTION_GUIDE.md

═══════════════════════════════════════════════════════════════════════════════
"""
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary_text)
    
    print(f"\n✓ Master summary saved: {summary_file}")
    
    # Also print to console
    print(summary_text)

def summary_structure():
    """Return directory structure"""
    return """
test_results/
├── TESTING_RESULTS_[TIMESTAMP].txt ← Summary (you are reading this)
├── FINAL_TESTING_REPORT.md (after week 4)
├── phase_1_ai_prompt/
│   ├── 01_nlp_test_output.txt
│   ├── 02_advisor_test_output.txt
│   ├── 03_prompt_review_notes.md
│   ├── PHASE_1_SUMMARY.json
│   └── PHASE_1_SUMMARY.md
├── phase_2_bot/
│   ├── 01_nlp_extended_test.txt
│   ├── 02_advisor_comprehensive_test.txt
│   ├── 02_e2e_flow_notes.txt
│   ├── 03_flow_a_chat_input.png (to be added)
│   ├── 04_flow_b_receipt_upload.png (to be added)
│   ├── 05_flow_c_advisor_question.png (to be added)
│   ├── 06_dashboard_updated.png (to be added)
│   ├── PHASE_2_SUMMARY.json
│   └── PHASE_2_SUMMARY.md (to be created)
├── phase_3_ui_ux/
│   ├── CHECKLIST_COMPLETED.md (from template)
│   ├── UI_TESTING_INSTRUCTIONS.md
│   ├── 05_lighthouse_performance.png (to be added)
│   ├── 09_wave_audit.png (to be added)
│   ├── 10_mobile_375px.png (to be added)
│   ├── 11_tablet_768px.png (to be added)
│   ├── 12_desktop_1024px.png (to be added)
│   ├── PHASE_3_SUMMARY.json
│   └── PHASE_3_SUMMARY.md (to be created)
└── phase_4_signoff/
    ├── 01_integration_checklist.txt (to be created)
    ├── 02_bug_list_final.md (to be created)
    ├── 03_quality_gates_final.md (to be created)
    ├── SIGN_OFF_TEMPLATE.md
    ├── PHASE_4_SUMMARY.json
    └── PHASE_4_SUMMARY.md (to be created)
"""

def main():
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║            FinTrack AI - Automated Test Execution                          ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝\n")
    
    # Phase 0: Setup
    print("Phase 0: Setting up test infrastructure...")
    create_test_structure()
    
    # Phase 1: AI Prompt Review
    print("\n\nPhase 1: AI Prompt Review...")
    phase1_results = run_phase1_tests()
    
    # Phase 2: Bot Testing
    print("\n\nPhase 2: Bot Testing...")
    phase2_results = run_phase2_tests()
    
    # Phase 3: UX/UI Testing
    print("\n\nPhase 3: UX/UI Testing...")
    phase3_results = run_phase3_tests()
    
    # Phase 4: Integration & Sign-off
    print("\n\nPhase 4: Integration & Sign-off...")
    phase4_results = run_phase4_tests()
    
    # Create master summary
    all_results = {
        "timestamp": TIMESTAMP,
        "phase1": phase1_results,
        "phase2": phase2_results,
        "phase3": phase3_results,
        "phase4": phase4_results
    }
    
    create_master_summary(all_results)
    
    # Save all results as JSON
    json_summary = TEST_DIR / f"all_results_{TIMESTAMP}.json"
    with open(json_summary, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n✓ All results saved to: {json_summary}")
    
    print("\n" + "="*70)
    print("✓ TEST EXECUTION COMPLETE")
    print("="*70)
    print(f"All results are in: {TEST_DIR}/")
    print(f"\nNext: Review test_results/TESTING_RESULTS_{TIMESTAMP}.txt")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
