# UI/UX Testing Checklist

## 📱 Phase 3: Complete Manual UI/UX Testing Checklist

### Test Environment Setup
- [ ] Frontend running: http://localhost:3000
- [ ] Browser DevTools open (F12)
- [ ] Test user credentials ready:
  - Email: `testuser@example.com`
  - Password: `123456`

---

## 🔐 Feature 1: Login Page

### UI Elements
- [ ] Email input field visible & functional
- [ ] Password input field visible & masked (•••)
- [ ] "Sign in" button visible & clickable
- [ ] No console errors (F12 → Console)

### Functionality
- [ ] Can input valid email
- [ ] Can input password
- [ ] Submit button disabled during loading
- [ ] Invalid credentials show error message
- [ ] Valid credentials redirect to /dashboard

### Responsive
- [ ] Mobile (375px): All elements visible, clickable
- [ ] Tablet (768px): Form centered, readable
- [ ] Desktop (1024px): Professional appearance

### Accessibility
- [ ] Email input has label
- [ ] Password input has label
- [ ] Submit button keyboard accessible (Tab + Enter)
- [ ] Error message displayed clearly in red or similar
- [ ] Color contrast meets accessibility standards

---

## 📊 Feature 2: Dashboard Page

### UI Components
- [ ] Header/Navigation visible
- [ ] Stat cards render (Income, Expense, Balance)
- [ ] Category breakdown displays
- [ ] Recent transactions list shows
- [ ] Charts render (if applicable)

### Data Display
- [ ] Income amount correct (formatted with commas)
- [ ] Expense amount correct
- [ ] Balance calculated correctly (Income - Expense)
- [ ] Category totals add up to Expense total
- [ ] Recent transactions sorted by date (newest first)

### Responsiveness
- [ ] Mobile: Stat cards stack vertically
- [ ] Tablet: Cards in 2-column layout
- [ ] Desktop: Full 3-4 column layout
- [ ] No horizontal scroll at any breakpoint
- [ ] Text readable at mobile size

### Performance
- [ ] Page load < 2s (F12 → Network)
- [ ] No console errors
- [ ] Charts render smoothly (no lag)
- [ ] Numbers formatted properly (1.5M not 1500000)

---

## 💬 Feature 3: Chat/Transaction Input

### UI Elements
- [ ] Chat input field visible
- [ ] Placeholder text: "Chi 50k ăn sáng..."
- [ ] Send button visible & clickable
- [ ] Recent chat history displays

### Interaction
- [ ] Can type in input field
- [ ] Submit on Enter key works
- [ ] Manual entry shows in chat
- [ ] Bot extracts amount correctly
- [ ] Bot extracts category correctly
- [ ] Confirm button creates transaction

### Response Quality
- [ ] Bot response appears after input (< 2s)
- [ ] Response shows extracted fields: Amount, Category, Type
- [ ] Extracted data matches input
- [ ] Error messages display if parsing fails (e.g., no amount detected)

### Test Cases
Run each and verify correct extraction:

```
Input                           Expected
────────────────────────────────────────────────────────
Chi 50k ăn sáng              → 50,000 VND | Ăn uống | Expense
Vừa nhận lương 15 triệu     → 15,000,000 VND | Lương | Income
Hôm qua đổ xăng 80 ngàn     → 80,000 VND | Di chuyển | Expense
Mua sắm 500.000 đ            → 500,000 VND | Mua sắm | Expense
Được mẹ cho 1 triệu          → 1,000,000 VND | Thu nhập | Income
```

---

## 📸 Feature 4: Receipt Upload

### UI Elements
- [ ] File input visible ("Choose file" or drag-drop)
- [ ] Upload button visible
- [ ] Progress indicator during OCR (spinner/percentage)
- [ ] Preview of uploaded image shows
- [ ] Extracted amount displays below image

### Functionality
- [ ] Can select image file
- [ ] Show loading state during OCR (< 3s)
- [ ] Display extracted amount (e.g., "Detected: 250,000 VND")
- [ ] Allow editing extracted amount (if needed)
- [ ] Confirm button creates transaction
- [ ] Transaction appears in dashboard

### Responsiveness
- [ ] Mobile: File input centered, preview full width
- [ ] Tablet/Desktop: Upload form and preview side-by-side

### Edge Cases
- [ ] Upload non-image file → Show error message
- [ ] Upload very large image → Handle gracefully (no crash)
- [ ] Upload blurry/low-quality receipt → OCR should try (may fail)
- [ ] Cancel upload → Return to form state

---

## 🤖 Feature 5: AI Advisor (if implemented)

### UI Elements
- [ ] Chat widget or advisor section visible
- [ ] Question input field
- [ ] Send button
- [ ] Response display area

### Interaction
- [ ] Can input question
- [ ] Submit works
- [ ] Show typing indicator ("Thinking...")
- [ ] Advisor response appears

### Test Queries
```
Query                               Expected
──────────────────────────────────────────────────────────
Tháng này tôi chi tiêu thế nào?  → Summary with specific amounts
Tôi có nên mua iPhone không?    → Analysis + advice (yes/no/wait)
Khoản chi nào lớn nhất?         → Top 3-5 categories
Làm sao tiết kiệm hơn?          → Concrete suggestions (giảm X)
```

### Response Quality
- [ ] Mentions specific amounts (not generic)
- [ ] Mentions categories (not vague)
- [ ] Tone professional & helpful
- [ ] Advice is actionable
- [ ] Response < 5 secondss

---

## 🔄 Feature 6: Transaction List / History

### UI Elements
- [ ] Transaction list displays with headers (Date, Amount, Category, Type)
- [ ] Each transaction shows all fields
- [ ] List scrollable if many transactions
- [ ] Filter/sort buttons visible (if applicable)

### Functionality
- [ ] Transactions sorted by date (newest first)
- [ ] Expense transactions show in red/different color
- [ ] Income transactions show in green/different color
- [ ] Amounts formatted correctly
- [ ] Can click to view/edit transaction (if allowed)

### Responsiveness
- [ ] Mobile: Table converts to card layout
- [ ] Tablet/Desktop: Table layout works

---

## 🧭 Feature 7: Navigation & Routing

### Page Navigation
- [ ] Home/Dashboard link works
- [ ] Transactions link works
- [ ] Receipts link works
- [ ] Back button works (browser back)
- [ ] Logout link works
- [ ] Can navigate from /dashboard → /transactions → /receipts → /dashboard

### Routing
- [ ] Direct URL navigation works (e.g., type /dashboard in address bar)
- [ ] Protected pages redirect to login if not authenticated
- [ ] After logout, redirected to login page
- [ ] Cannot access protected pages without token

---

## 📱 Feature 8: Responsive Design

### Viewport Tests
Test each viewport size using DevTools (F12 → Toggle device toolbar):

**Mobile (375px width)**
- [ ] All buttons clickable (min 44px height)
- [ ] Text readable (min 16px font)
- [ ] Forms single column
- [ ] No horizontal scroll
- [ ] Margins/padding appropriate

**Tablet (768px width)**
- [ ] 2-column layout works
- [ ] Charts readable
- [ ] Spacing balanced

**Desktop (1024px+ width)**
- [ ] 3-column layout works
- [ ] Full sidebar/navigation visible
- [ ] Hover states work
- [ ] Everything centered with max-width

### Common Issues to Check
- [ ] Text not cut off at edges
- [ ] Images not overflow container
- [ ] Buttons not too small to click
- [ ] No elements overlapping
- [ ] White space proportional at all sizes

---

## ⚡ Feature 9: Performance & Loading

### Page Load Times (F12 → Network)
- [ ] Login page: < 1s
- [ ] Dashboard: < 2s
- [ ] Transactions page: < 1.5s
- [ ] Receipts upload: < 2s

### API Response Times
- [ ] Login request: < 1s
- [ ] Fetch dashboard: < 1s
- [ ] Fetch transactions: < 1s
- [ ] Create transaction: < 1s

### Lighthouse Audit (F12 → Lighthouse)
- [ ] Performance: ≥ 80
- [ ] Accessibility: ≥ 90
- [ ] Best Practices: ≥ 85
- [ ] SEO: ≥ 90

If scores are low, check:
- [ ] Large images → optimize/compress
- [ ] Unused CSS/JS → remove/tree-shake
- [ ] Missing alt text → add for all images
- [ ] Color contrast issues → fix foreground/background colors

---

## ♿ Feature 10: Accessibility

### Keyboard Navigation
- [ ] Tab through all form inputs (should follow logical order)
- [ ] Shift+Tab goes backward
- [ ] Enter submits forms
- [ ] Space activates buttons
- [ ] Escape closes modals (if any)

### Screen Reader Compatibility (use NVDA/JAWS or built-in)
- [ ] Form labels associated with inputs
- [ ] Buttons have text labels
- [ ] Images have alt text
- [ ] Links have descriptive text (not "click here")
- [ ] Lists marked with <ul>/<ol>

### Color Contrast (WAVE extension)
- [ ] Text contrast ≥ 4.5:1 on white background
- [ ] Large text (24px+) ≥ 3:1 contrast
- [ ] Don't rely on color alone for meaning

### WAVE Extension Check
1. Install WAVE: https://wave.webaim.org/extension/
2. Click WAVE icon → Check for errors (red flags)
3. Review warnings (yellow)
4. Target: 0 errors, <5 warnings

### Checklist
- [ ] No color-only instructions (e.g., "click the red button")
- [ ] Form error messages clear and associated
- [ ] Focus indicators visible on all interactive elements
- [ ] Page structure with proper heading hierarchy (h1 → h2 → h3)

---

## 🐛 Feature 11: Error Handling & Edge Cases

### Network Errors
- [ ] Disconnect API (DevTools → Network → Offline)
- [ ] Display error message (not blank page)
- [ ] Retry button works
- [ ] Graceful fallback to cached data (if applicable)

### Invalid Input
- [ ] Empty email submitted → Show error "Email required"
- [ ] Invalid email format → Show error
- [ ] Empty password → Show error
- [ ] Chat with no amount → Show "No amount detected"

### Session Expiry
- [ ] Token expires → Redirect to login
- [ ] Can't access dashboard without token
- [ ] Error message clear: "Please log in again"

### Data Loading
- [ ] No transactions → Show "No transactions yet" (not blank)
- [ ] Slow API response → Show loading skeleton/spinner
- [ ] API error → Show retry button

---

## ✅ Final Sign-Off Checklist

### All Features Tested
- [ ] Login page - all checks passed
- [ ] Dashboard - all checks passed
- [ ] Transaction input/chat - all checks passed
- [ ] Receipt upload - all checks passed
- [ ] AI Advisor - all checks passed (if implemented)
- [ ] Transaction list - all checks passed
- [ ] Navigation - all checks passed
- [ ] Responsive design - all breakpoints pass
- [ ] Performance - Lighthouse scores ≥ target
- [ ] Accessibility - WAVE check passed

### Quality Gates
- [ ] No console errors (F12 → Console is clean)
- [ ] No network errors (F12 → Network all 2xx/3xx)
- [ ] No crashes with weird input
- [ ] Mobile UX smooth (no jank/lag)
- [ ] Professional appearance (colors, spacing, typography)

### Sign-Off
```
Date: _______________
Tester: _______________
Overall Status: [ ] PASS  [ ] FAIL

Pass Criteria:
  ✓ All features work as expected
  ✓ No critical bugs
  ✓ Mobile responsive
  ✓ Accessible
  ✓ Performance acceptable

Bugs Found (if any):
  1. _______________
  2. _______________
  3. _______________

Sign-off: _______________
```

---

## 📸 Screenshots to Take

Take screenshots at key points to document testing:
1. Login page - successful authentication
2. Dashboard - with data displayed
3. Mobile dashboard - responsive layout
4. Chat/transaction input - captured extraction
5. Receipt upload - OCR result
6. Transaction list - multiple items
7. Lighthouse audit results

---

## 🎯 Next Steps

1. **Before Testing**: Prepare test environment
   - [ ] Start frontend dev server
   - [ ] Open browser DevTools
   - [ ] Have test credentials ready

2. **During Testing**: Check off features systematically
   - [ ] Don't skip accessibility checks
   - [ ] Note any UX friction/confusion
   - [ ] Test on real mobile device if possible

3. **After Testing**: Summarize findings
   - [ ] Document all bugs
   - [ ] Rate overall quality (1-5)
   - [ ] Recommend improvements
   - [ ] Sign off if all checks pass

---

## 💡 Tips for Better Testing

- **Test on real devices**: Emulators don't catch everything (battery, actual touch, etc)
- **Test in different browsers**: Chrome, Firefox, Safari behaviors vary
- **User perspective**: Use features like a real user would
- **Read error messages**: They often tell you what to do
- **Check console**: F12 → Console (errors might not be visible in UI)
- **Test with slow connection**: DevTools Network → throttle to 3G
- **Test with data**: Use real transaction amounts, dates, categories

Good luck! 🚀
