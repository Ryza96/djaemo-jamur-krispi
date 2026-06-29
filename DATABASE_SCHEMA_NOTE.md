# Database Schema Consolidation Notice

## ⚠️ Schema Files Status

This project previously had two schema definition files:

1. **`database/schema.sql`** - Legacy file (DEPRECATED)
2. **`db/supabase_migrations/001_init_schema.sql`** - Current source of truth (ACTIVE)

## 📋 Action Taken

- `database/schema.sql` should **NOT be used** for schema management
- All schema changes should be made through **Supabase migrations** in the `db/supabase_migrations/` directory
- The migration files are the authoritative source for database schema

## ✅ Best Practice

When making database schema changes:

1. Create a new migration file: `db/supabase_migrations/00X_description.sql`
2. Write your SQL changes
3. Apply migrations via Supabase dashboard or `supabase db push`
4. **Do NOT edit `database/schema.sql`** - it's a legacy file left for reference only

## 📂 Migration Files

Current migrations in order of execution:

- `001_init_schema.sql` - Core tables setup
- `002_add_images.sql` - Product images table
- `003_add_postal_code.sql` - Shipping postal code
- `004_backfill_postal_code.sql` - Data migration
- `005_add_shipping_columns.sql` - Biteship preparation

## 🔄 Migration Workflow

```bash
# To add a new migration:
1. Create: db/supabase_migrations/006_description_here.sql
2. Apply: supabase db push
3. Verify in Supabase Dashboard
```

## ⚠️ Note on database/schema.sql

This file is maintained only for reference/backup purposes. It uses:
- BIGSERIAL (vs UUID in migrations)
- May be outdated
- **Should not be used for actual schema management**

Use Supabase migrations exclusively.
