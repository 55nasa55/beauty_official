export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          logo_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          logo_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          logo_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          category: string
          category_id: string | null
          brand_id: string | null
          tags: string[]
          is_featured: boolean
          is_best_seller: boolean
          is_new: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          category?: string
          category_id?: string | null
          brand_id?: string | null
          tags?: string[]
          is_featured?: boolean
          is_best_seller?: boolean
          is_new?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          category?: string
          category_id?: string | null
          brand_id?: string | null
          tags?: string[]
          is_featured?: boolean
          is_best_seller?: boolean
          is_new?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string | null
          name: string
          price: number
          compare_at_price: number
          stock: number
          images: string[]
          specs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku?: string | null
          name: string
          price: number
          compare_at_price?: number
          stock?: number
          images?: string[]
          specs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string | null
          name?: string
          price?: number
          compare_at_price?: number
          stock?: number
          images?: string[]
          specs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      banners: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          target_type: string
          target_value: string
          sort_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          image_url: string
          target_type?: string
          target_value?: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          target_type?: string
          target_value?: string
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          product_ids: string[]
          product_tags: string[]
          display_on_home: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          product_ids?: string[]
          product_tags?: string[]
          display_on_home?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          product_ids?: string[]
          product_tags?: string[]
          display_on_home?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Brand = Database['public']['Tables']['brands']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  brand?: Brand;
};
