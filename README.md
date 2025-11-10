# Good Looks - Premium E-Commerce Platform

A fully-featured Next.js e-commerce website with dynamic data fetching from Supabase, client-side cart, and premium UI/UX.

## Features

### Dynamic Content Management
- **Auto-updating Navigation**: Categories, brands, and collections menus update automatically when new items are added to Supabase
- **Tag-Based Carousels**: Homepage automatically generates carousels for each unique product tag (featured, best_seller, new, etc.)
- **Collection Support**: Collections can use product IDs or tags, with automatic product aggregation
- **Banner Carousel**: Rotating banners with dynamic linking
  - Uses `target_type` and `target_value` from Supabase to determine destination
  - Supports internal links (product, category, brand, collection) using Next.js Link
  - Supports external links with `target="_blank"` for external URLs
  - Auto-scroll with navigation arrows and dots
  - Fully responsive

### Product Management
- **Variant Support**: Products have multiple variants (size, color, flavor, etc.) with separate pricing, images, stock, and specs
- **Dynamic Pricing**: Variant selection updates price, stock availability, and product images
- **Brand Integration**: All products link to their brand pages

### Shopping Experience
- **Client-Side Cart**: LocalStorage-based shopping cart with persistence across sessions
- **Mini-Cart Dropdown**: Quick cart access in header with item management
- **Add to Cart**: One-click add to cart with toast notifications
- **Sorting & Filtering**: Category and collection pages support sorting by name, price, newest, and best-seller

### Pages

#### Home (`/`)
- Dynamic banner carousel from `banners` table
- Auto-generated carousels for each unique tag
- Collection-based carousels for collections with `display_on_home = true`

#### Category Pages (`/category/[slug]`)
- Shows all products in category
- Sorting options (Name, Newest, Best Seller, Price)
- Product count display

#### Product Pages (`/product/[slug]`)
- Image gallery with thumbnail navigation
- Variant selector with dynamic updates
- Product specs and details
- Stock availability
- Brand link
- Add to cart functionality

#### Brand Pages (`/brand/[slug]`)
- Brand logo and description
- All products from brand
- Sorting options

#### Brands Index (`/brands`)
- Grid of all brands with logos

#### Collection Pages (`/collection/[slug]`)
- Products from `product_ids` or `product_tags`
- Sorting options

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API (Cart)
- **Storage**: LocalStorage (Cart persistence)
- **Images**: Next.js Image optimization

## Database Schema

### Tables

#### `categories`
- id, slug, name, description
- Automatically updates navbar dropdown

#### `brands`
- id, slug, name, description, logo_url
- Automatically updates navbar dropdown

#### `products`
- id, slug, name, description, category, category_id, brand_id
- tags (array), is_featured, is_best_seller, is_new
- Supports dynamic tag-based filtering

#### `product_variants`
- id, product_id, name, price, compare_at_price, stock
- images (array), specs (jsonb)
- Each product must have at least one variant

#### `banners`
- id, title, description, image_url
- target_type (product/category/brand/collection), target_value
- sort_order, active
- Powers homepage carousel

#### `collections`
- id, name, slug, product_ids (array), product_tags (array)
- display_on_home, sort_order
- Flexible product inclusion via IDs or tags

## Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Deployment

This project is ready to deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- Any platform supporting Next.js

### Deployment Steps

1. Connect your repository to Vercel/Netlify
2. Add environment variables in deployment settings
3. Deploy

## Data Management

### Adding Products
1. Create product in `products` table with tags array
2. Add variants in `product_variants` table with images, pricing, and stock
3. Products automatically appear in:
   - Category pages (if category_id is set)
   - Tag-based carousels (if tags are set)
   - Collections (if included in collection)
   - Brand pages (if brand_id is set)

### Creating Collections
1. Add collection to `collections` table
2. Set `display_on_home = true` to show on homepage
3. Add products via:
   - `product_ids`: Specific product IDs
   - `product_tags`: Auto-include products with matching tags
4. Collection appears in navbar collections dropdown

### Managing Banners
1. Add banner to `banners` table with:
   - `title`: Banner headline
   - `description`: Banner subtext
   - `image_url`: Banner image (recommended: 1600x600px)
   - `target_type`: Where the banner should link
     - `"product"` - Links to a product page
     - `"category"` - Links to a category page
     - `"brand"` - Links to a brand page
     - `"collection"` - Links to a collection page
     - `"external"` - Links to an external URL (opens in new tab)
   - `target_value`: The slug (for internal links) or full URL (for external)
   - `sort_order`: Display order (lower numbers appear first)
   - `active`: Set to `true` to display on homepage

**Examples:**
```sql
-- Link to a product
INSERT INTO banners (title, description, image_url, target_type, target_value, sort_order, active)
VALUES ('New Product Launch', 'Check out our latest serum', 'https://...', 'product', 'glow-recipe-plum-plump-serum', 1, true);

-- Link to a category
INSERT INTO banners (title, description, image_url, target_type, target_value, sort_order, active)
VALUES ('Summer Skincare', 'Refresh your routine', 'https://...', 'category', 'skincare', 2, true);

-- Link to external site
INSERT INTO banners (title, description, image_url, target_type, target_value, sort_order, active)
VALUES ('Read Our Blog', 'Latest beauty tips', 'https://...', 'external', 'https://blog.example.com', 3, true);
```

## Features Roadmap

- [ ] User authentication
- [ ] Order management
- [ ] Payment integration
- [ ] Product search
- [ ] Product reviews
- [ ] Wishlist functionality
- [ ] Email notifications
- [ ] Analytics dashboard

## License

MIT
