# 🚀 Deployment Checklist

## Before Every Production Deployment:

### 1. Update Cache Version
- [ ] Change `CACHE_NAME` in `/public/sw.js` 
- [ ] Example: `"dandyprime-cache-v5"` → `"dandyprime-cache-v6"`

### 2. Test Locally
- [ ] Run `npm run build` to test production build
- [ ] Test critical features work
- [ ] Check for console errors

### 3. Deploy Steps
- [ ] Deploy to production
- [ ] Monitor for any errors
- [ ] Check that new features are working

## How Cache Updates Work:

✅ **Automatic Updates**: Users get new version within 30 seconds  
✅ **Service Worker**: Auto-refreshes page when update is available  
✅ **API Cache Busting**: Fresh data every 1-5 minutes based on endpoint  

## Emergency Cache Clear:

If users report issues, they can:
1. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear site data**: Chrome Settings → Privacy → Site Settings → Your Site → Clear Data

## Version History:
- v5: Added cache busting and auto-updates
- v6: [Your next update]
- v7: [Future update]
