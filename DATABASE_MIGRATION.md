# Database Migration Instructions

## Required Schema Updates

For the new username and custom-short-id features to work, you need to add the following columns to your Supabase database:

### 1. Add `username` column to `profiles` table

Go to your Supabase dashboard:
1. Navigate to SQL Editor
2. Run this query:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
```

### 2. Add `custom_short_id` column to `wishes` table

Run this query:

```sql
ALTER TABLE wishes 
ADD COLUMN IF NOT EXISTS custom_short_id VARCHAR(20) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_wishes_custom_short_id ON wishes(custom_short_id);
```

## What These Changes Enable

- **username**: Allows users to set a custom username for public wishlist URLs
  - Default: First part of email (e.g., john from john@example.com)
  - Editable in profile settings
  - Used in public URLs: `/w/{username}/{wishlist-id}`

- **custom_short_id**: Allows users to customize their wishlist URL
  - Optional: If not set, uses the default short_id
  - Creates URLs like: `/w/{username}/my-wedding`
  - Must be 3-20 characters, alphanumeric with hyphens and underscores

## New API Endpoints

### Profile Management
- `GET /api/profile` - Get current user's profile with username
- `PUT /api/profile` - Update profile including username

### Public Wishlist with Username Support
- `GET /api/wishlists/public/[username]/[short_id]` - Get wishlist
- `POST /api/wishlists/public/[username]/[short_id]/reserve` - Reserve item

### URL Check
- `GET /api/wishlists/check-short-id?short_id=value` - Check if custom_short_id is available

## New Public Routes

- `/w/[username]/[short_id]` - Public wishlist with custom URL

## Old Routes (Still Supported)

- `/w/[short_id]` - Legacy URL structure still works

## Next Steps

1. Run the SQL migrations above in Supabase
2. Update your user's profile with a username (or auto-populate manually)
3. Edit wishlists to set custom short_ids if desired
4. Share new public URLs with friends: `yoursite.com/w/username/wishlist-name`
