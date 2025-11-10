# Banner Carousel Dynamic Linking

## Overview
The banner carousel now supports fully dynamic linking based on data from Supabase. Each banner's destination is determined by its `target_type` and `target_value` fields.

## Supported Link Types

### Internal Links (Using Next.js Link)
These links use Next.js client-side routing for fast navigation:

1. **Product Links**
   - `target_type`: `"product"`
   - `target_value`: Product slug (e.g., `"glow-recipe-watermelon-sleeping-mask"`)
   - Destination: `/product/[slug]`

2. **Category Links**
   - `target_type`: `"category"`
   - `target_value`: Category slug (e.g., `"skincare"`)
   - Destination: `/category/[slug]`

3. **Brand Links**
   - `target_type`: `"brand"`
   - `target_value`: Brand slug (e.g., `"olaplex"`)
   - Destination: `/brand/[slug]`

4. **Collection Links**
   - `target_type`: `"collection"`
   - `target_value`: Collection slug (e.g., `"staff-favorites"`)
   - Destination: `/collection/[slug]`

### External Links (Using Standard <a> Tag)
External links open in a new tab with proper security attributes:

- `target_type`: `"external"`
- `target_value`: Full URL (e.g., `"https://instagram.com"`)
- Opens in new tab with `target="_blank"` and `rel="noopener noreferrer"`

## Implementation Details

### Component Updates
File: `/components/BannerCarousel.tsx`

**Key Changes:**
1. Added support for `external` target type
2. Conditional rendering based on link type:
   - Internal links use `<Link>` from Next.js
   - External links use `<a>` tag with new tab attributes
3. Extracted banner content rendering to reusable function
4. Maintained all existing functionality (auto-scroll, navigation, responsiveness)

### Code Structure
```typescript
const getTargetUrl = (banner: Banner) => {
  switch (banner.target_type) {
    case 'product': return `/product/${banner.target_value}`;
    case 'category': return `/category/${banner.target_value}`;
    case 'brand': return `/brand/${banner.target_value}`;
    case 'collection': return `/collection/${banner.target_value}`;
    case 'external': return banner.target_value;
    default: return '/';
  }
};

const isExternalLink = (banner: Banner) => {
  return banner.target_type === 'external';
};
```

## Testing

### Current Test Data
The database includes banners demonstrating all link types:

1. ✅ Collection: "New Arrivals" → `/collection/staff-favorites`
2. ✅ Category: "Summer Glow" → `/category/skincare`
3. ✅ Category: "Makeup Must-Haves" → `/category/makeup`
4. ✅ Brand: "Hair Repair Heroes" → `/brand/olaplex`
5. ✅ Product: "Clean Beauty Edit" → `/product/glow-recipe-watermelon-sleeping-mask`
6. ✅ External: "Visit Our Instagram" → `https://instagram.com` (new tab)

### Verification Steps
1. Navigate to homepage (`/`)
2. Observe banner carousel cycling through banners
3. Click each banner and verify:
   - Internal links navigate within the app
   - External links open in new tab
   - All destinations are correct

## Features Preserved
- ✅ Auto-scroll every 5 seconds
- ✅ Navigation arrows (previous/next)
- ✅ Dot indicators with click-to-navigate
- ✅ Smooth fade transitions
- ✅ Image optimization with Next.js Image
- ✅ Responsive design (400px mobile, 500px desktop)
- ✅ Gradient overlay for text readability
- ✅ Priority loading for first banner

## Best Practices

### Adding New Banners
```sql
-- Internal link example
INSERT INTO banners (
  title,
  description,
  image_url,
  target_type,
  target_value,
  sort_order,
  active
) VALUES (
  'Sale Alert',
  'Up to 50% off selected items',
  'https://images.pexels.com/photos/...',
  'category',
  'skincare',
  1,
  true
);

-- External link example
INSERT INTO banners (
  title,
  description,
  image_url,
  target_type,
  target_value,
  sort_order,
  active
) VALUES (
  'Read Our Blog',
  'Latest beauty tips and trends',
  'https://images.pexels.com/photos/...',
  'external',
  'https://blog.example.com/latest',
  2,
  true
);
```

### Image Recommendations
- **Dimensions**: 1600x600px (optimal for desktop and mobile)
- **Format**: JPEG or WebP
- **File size**: Under 200KB for fast loading
- **Text placement**: Bottom third of image (text overlay area)

## Security Considerations

External links include proper security attributes:
- `target="_blank"`: Opens in new tab
- `rel="noopener noreferrer"`: Prevents security vulnerabilities
  - `noopener`: Prevents new page from accessing `window.opener`
  - `noreferrer`: Doesn't send referrer information

## Future Enhancements

Potential improvements for banner system:
- [ ] Add analytics tracking for banner clicks
- [ ] Support for video banners
- [ ] A/B testing for banner effectiveness
- [ ] Scheduled banner campaigns (start/end dates)
- [ ] Banner click-through tracking in dashboard
- [ ] Personalized banners based on user behavior
