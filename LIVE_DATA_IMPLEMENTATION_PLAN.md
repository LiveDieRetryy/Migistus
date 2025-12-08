# Live Data Implementation Plan

## Overview
This document identifies all instances of fake/test data in the Migistus codebase and provides a comprehensive plan to replace them with live backend connections.

**Date**: December 6, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH - Removing all test data for production-ready application

---

## Critical Issues Found

### 🔴 HIGH PRIORITY - Hardcoded Test Data

#### 1. **ProductPoolEditor Component** (Kingdom Management)
**Location**: `src/components/kingdom/ProductPoolEditor.tsx` (Lines 57-162)
**Issue**: Contains 8 hardcoded products with fake data
**Current State**:
```tsx
const [products, setProducts] = useState<Product[]>([
  {
    id: 1,
    name: "Gilded Vanguard Headset",
    image: "https://placehold.co/400x400?text=Headset",
    votes: 73,
    // ... 7 more hardcoded products
  }
])
```

**Solution**:
- Replace with API call to `/api/products` or `/api/voting/polls`
- Use `useProducts` or `useProductsEnhanced` hook
- Connect to real product data from `public/data/products.json`

---

#### 2. **Suppliers Page Testimonials**
**Location**: `src/pages/suppliers.tsx` (Lines 121-143)
**Issue**: Hardcoded fake testimonials
**Current State**:
```tsx
const testimonials = [
  {
    name: "Sarah Chen",
    company: "TechGear Innovations",
    quote: "MIGISTUS helped us validate...",
    avatar: "/Icons/SupplierPlaceHolder.png"
  },
  // ... 2 more fake testimonials
]
```

**Solution**:
- Create testimonials API endpoint: `/api/suppliers/testimonials`
- Store real testimonials in `public/data/supplier-testimonials.json`
- Fetch and display actual supplier feedback
- Remove placeholder avatars, use real supplier logos/photos

---

#### 3. **BlockPanel Placeholder Images**
**Location**: `src/components/kingdom/content/BlockPanel.tsx`
**Issue**: Using `https://via.placeholder.com/` and example URLs
**Current State**:
- Line 64: `https://via.placeholder.com/400x200`
- Line 150: `https://www.youtube.com/embed/dQw4w9WgXcQ` (Rick Roll example)
- Line 159: Multiple `https://via.placeholder.com/200` gallery images

**Solution**:
- Remove all placeholder URLs
- Update image blocks to use upload system
- Connect to ImageRegistry for real uploaded images
- Update video/iframe blocks to require real URLs

---

### 🟡 MEDIUM PRIORITY - Mock/Example Data

#### 4. **Terms of Service Placeholder**
**Location**: `src/pages/terms.tsx` (Line 16)
**Issue**: "This is a placeholder for the full Terms of Service"

**Solution**:
- Create real Terms of Service content
- Store in `public/data/legal/terms.json` or markdown file
- Fetch and render actual legal terms

---

#### 5. **Wallet Transaction History**
**Location**: `src/pages/wallet.tsx` (Line 267)
**Issue**: "Transaction History Placeholder" comment

**Solution**:
- Create `/api/wallet/transactions` endpoint
- Store transaction history in `public/data/wallets.json`
- Display real transaction records with pagination

---

#### 6. **User Activity Mock Data**
**Location**: `src/utils/userDataAggregator.ts` (Line 397)
**Issue**: "Create mock session data from current session if available"

**Solution**:
- Use actual session data from `user-sessions.json`
- Remove mock data generation
- Fetch real user activity from tracking system

---

### 🟢 LOW PRIORITY - UI Placeholders (OK to keep)

These are legitimate UI placeholders for empty states:
- Input field placeholders (`placeholder="Enter amount"`) - ✅ Keep
- Image alt text placeholders - ✅ Keep
- Form field helpers - ✅ Keep

---

## Implementation Steps

### Phase 1: Core Product Data (Week 1)

1. **Fix ProductPoolEditor**
   ```tsx
   // BEFORE
   const [products, setProducts] = useState<Product[]>([...hardcoded...])
   
   // AFTER
   const { data: products, isLoading, error } = useProductsEnhanced({ status: 'voting' })
   ```

2. **Update BlockPanel**
   - Remove all `placehold.co` URLs
   - Update default blocks to use empty states
   - Connect image uploads to ImageRegistry

### Phase 2: Supplier & User Data (Week 2)

3. **Create Testimonials System**
   - Create `public/data/supplier-testimonials.json`
   - Build `/api/suppliers/testimonials` API endpoint
   - Update `suppliers.tsx` to fetch real data
   - Add admin interface to manage testimonials

4. **Complete Wallet Transactions**
   - Create `/api/wallet/transactions` endpoint
   - Add transaction history UI component
   - Connect to real wallet data

### Phase 3: Content & Legal (Week 3)

5. **Legal Content**
   - Write actual Terms of Service
   - Write Privacy Policy
   - Store in proper data files
   - Create legal content API

6. **User Activity Cleanup**
   - Remove mock session generation
   - Use real tracking data exclusively
   - Verify all activity sources are live

---

## Verification Checklist

### Before Starting
- [ ] Backup current codebase
- [ ] Create feature branch `live-data-implementation`
- [ ] Document current API endpoints

### During Implementation
- [ ] Remove all hardcoded product arrays
- [ ] Remove all placeholder image URLs
- [ ] Remove all fake testimonials
- [ ] Replace mock data with API calls
- [ ] Test all data fetching with real data
- [ ] Verify real-time updates still work

### After Completion
- [ ] Search codebase for: `placehold.co`, `example.com`, `mock`, `fake`, `test data`
- [ ] Verify no console warnings about missing data
- [ ] Test all pages load with real data
- [ ] Confirm all images come from ImageRegistry
- [ ] Validate all user data is from actual users
- [ ] Check all product data is from products.json
- [ ] Test real-time product updates
- [ ] Verify wallet shows actual transactions

---

## Files Requiring Changes

### Must Update:
1. `src/components/kingdom/ProductPoolEditor.tsx` - Remove 8 hardcoded products
2. `src/pages/suppliers.tsx` - Remove fake testimonials
3. `src/components/kingdom/content/BlockPanel.tsx` - Remove placeholder URLs
4. `src/pages/wallet.tsx` - Add transaction history
5. `src/pages/terms.tsx` - Add real legal content
6. `src/utils/userDataAggregator.ts` - Remove mock session logic

### Must Create:
1. `public/data/supplier-testimonials.json`
2. `src/pages/api/suppliers/testimonials.ts`
3. `src/pages/api/wallet/transactions.ts`
4. `public/data/legal/terms.json`
5. `public/data/legal/privacy.json`

---

## Success Metrics

✅ **Zero hardcoded product arrays**  
✅ **Zero placeholder image URLs**  
✅ **Zero fake user/supplier data**  
✅ **All API endpoints return real data**  
✅ **Real-time updates work with live data**  
✅ **All images from ImageRegistry**  
✅ **All user activity from tracking system**  

---

## Notes

- The existing real-time update system (productUpdateManager) is already production-ready
- Image upload system with ImageRegistry is functional
- Most pages already use live data correctly
- This cleanup focuses on the few remaining hardcoded sections
- After this, the entire application will be 100% data-driven

---

## Next Steps

1. Review this plan with team
2. Create feature branch
3. Start with Phase 1 (ProductPoolEditor)
4. Test thoroughly after each change
5. Deploy to staging before production
