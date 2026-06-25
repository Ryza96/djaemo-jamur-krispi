-- 002_add_images.sql
-- Adds images column to products to store array of image URLs

alter table if exists products
  add column if not exists images text[];

-- Optionally backfill existing `image` values into `images`
update products set images = array[image] where image is not null and (images is null or array_length(images,1) = 0);
