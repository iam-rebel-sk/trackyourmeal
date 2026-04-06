# 🚀 Testing Guide - Meal Tracker App

## Prerequisites Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Environment Variables

Create a `.env.local` file in the project root with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the URL and anon (public) key

---

## Running the App

### Development Server
```bash
npm run dev
```
The app will start on `http://localhost:5173`

### Typecheck (Optional)
```bash
npm run typecheck
```

---

## Testing Each Fixed Functionality

### ✅ Test 1: Display Total Remaining Amount

**Steps:**
1. Login to the app
2. Navigate to **Dashboard**
3. Add some meals via the `+` button
   - Select different members
   - Different meal types (lunch/dinner)
4. Check if the dashboard shows:
   - **Grand Total** (sum of all meals)
   - **Total Paid** (initially 0)
   - **Total Remaining** (should equal Grand Total)

**Expected Result:**
```
Grand Total: ₹XXX.XX
Total Paid: ₹0.00
Total Remaining: ₹XXX.XX (same as Grand Total)
```

---

### ✅ Test 2: Full Payment Selection (Remaining Amount)

**Steps:**
1. From Dashboard, click **"Add Payment"** button
2. Click on "Individual" mode (should be default)
3. For each member, you'll see:
   - Total: ₹XXX.XX
   - Remaining: ₹YYY.YY
4. Click **"Full Remaining"** button for any member
5. Check the input field

**Expected Result:**
- Input field should be filled with the **Remaining amount** (not Total)
- Example: If remaining is ₹500, it fills ₹500 (not the total ₹600)
- **Total Payment** at bottom updates correctly
- Click "Record Payment"

---

### ✅ Test 3: Payment History with Member Breakdown

**Steps:**
1. After recording payment in Test 2, go to **History** tab
2. Click on the **"Payments"** tab (should already be selected)
3. Find your recent payment transaction

**Expected Result:**
You should see:
- Payment amount (e.g., ₹500.00)
- Payment date (today's date)
- When you expand (click the card), you see breakdown:
  - Member Name: Amount Paid
  - E.g., "John: ₹500"

**Example Card:**
```
₹500.00
6 Apr 2026
Member Breakdown:
- John: ₹500.00
```

---

### ✅ Test 4: Dashboard Reflection After "Mark as Paid"

**Critical Test - Most Important**

**Steps:**
1. From Dashboard, ensure you have **active meals** (not archived)
2. Look at **Individual Splits** section
3. Note the amounts (e.g., John: ₹1000, Paid: ₹500, Remaining: ₹500)
4. Click **"Mark as Paid"** button
5. Confirm the dialog

**Expected Result - No Crash!**
- ✅ No error messages
- ✅ Meals get archived (removed from active meals list)
- ✅ Success message appears
- ✅ Dashboard refreshes automatically

**After Mark as Paid:**
- If no new meals added, the dashboard should show empty state or zeros
- The payment appears in **History → Payments** tab
- All paid amounts are recorded in payment_breakdown

**Advanced Check:**
1. Before marking as paid, note individual amounts
2. Go to History → check that payment record shows same breakdown
3. Come back to Dashboard and verify split cards updated

---

### ✅ Test 5: Individual Payment Records

**Steps:**
1. Add 3 meals with different members:
   - John: ₹600 (lunch)
   - Sarah: ₹600 (lunch)
   - Mike: ₹600 (dinner)
2. Record a partial payment:
   - Click "Add Payment"
   - Pay John ₹300 only
   - Record Payment
3. Check Dashboard Individual Splits:
   - John should show: Paid: ₹300, Remaining: ₹300
   - Sarah should show: Paid: ₹0, Remaining: ₹600
   - Mike should show: Paid: ₹0, Remaining: ₹600

**Expected Result:**
```
John: ₹600
  Paid: ₹300.00
  Remaining: ₹300.00

Sarah: ₹600
  (no paid/remaining shown if nothing paid yet, or shows ₹0/₹600)

Mike: ₹600
  (no paid/remaining shown if nothing paid yet, or shows ₹0/₹600)
```

---

## Complete Test Scenario

### Full Workflow Test (5-10 minutes)

1. **Setup:**
   ```
   - Create 3 members: John, Sarah, Mike
   - Add meals:
     * John: Lunch ₹60, Dinner ₹60
     * Sarah: Lunch ₹60
     * Mike: Dinner ₹60
   ```

2. **Verify Display:**
   ```
   - Check Grand Total = ₹240
   - Check Total Remaining = ₹240
   - Check splits show: John ₹120, Sarah ₹60, Mike ₹60
   ```

3. **First Payment:**
   ```
   - Add Payment (Individual mode)
   - Pay John ₹70
   - Record Payment
   - Check John now shows: Paid ₹70, Remaining ₹50
   ```

4. **History Check:**
   ```
   - Go to History
   - See payment transaction
   - See John: ₹70 in breakdown
   ```

5. **Second Payment:**
   ```
   - Add Payment (Individual mode)
   - Click "Full Remaining" for Sarah
   - Record Payment for ₹60
   - Check Sarah now shows: Paid ₹60, Remaining ₹0
   ```

6. **Mark as Paid:**
   ```
   - Click "Mark as Paid"
   - Confirm dialog
   - Check:
     ✓ No crash
     ✓ Success message
     ✓ Meals archived
     ✓ Dashboard updates
     ✓ Payment appears in History
   ```

7. **Verify Final State:**
   ```
   - Dashboard shows empty/zeros
   - History → Payments shows all 3 transactions
   - History → Archives shows the batch that was marked as paid
   ```

---

## Debugging Tips

### If Something Doesn't Work:

1. **Check Browser Console:**
   - Press F12 or Right-click → Inspect
   - Go to Console tab
   - Look for red error messages

2. **Check Network:**
   - Open DevTools → Network tab
   - Try the action again
   - Look for failed requests (red 4xx/5xx)
   - Check Supabase connection

3. **Check Supabase:**
   - Log into [Supabase Console](https://app.supabase.com)
   - Check if data appears in tables when you add meals
   - Check if payments table updates when you record payment

4. **Verify Environment:**
   - Make sure `.env.local` has correct Supabase credentials
   - Restart dev server after adding `.env.local`

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" errors | Run `npm install` |
| White screen / 404 | Make sure dev server is running on `localhost:5173` |
| Supabase connection error | Check `.env.local` has correct credentials |
| Meals don't save | Check Supabase RLS policies are enabled |
| "Mark as Paid" crashes | This should be FIXED - check browser console for errors |
| Payments don't show in history | Check if payment was recorded in Supabase |

---

## Success Checklist

After all tests pass, you should have:

- ✅ Dashboard shows correct grand total and remaining
- ✅ "Full Remaining" button works correctly
- ✅ Payments recorded with member breakdown
- ✅ History shows payment transactions
- ✅ "Mark as Paid" works without crashing
- ✅ Individual split amounts update after payments
- ✅ All data persists in Supabase

