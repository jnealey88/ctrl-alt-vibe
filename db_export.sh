#!/bin/bash

# Export database schema and data
echo "Creating database export..."

# Export schema (table definitions)
echo "-- Database Schema Export" > db_schema.sql
pg_dump --schema-only $DATABASE_URL >> db_schema.sql

# Export data (table contents)
echo "-- Database Data Export" > db_data.sql

# List of tables to export data from
tables=(
  "blog_categories"
  "blog_post_tags"
  "blog_posts"
  "blog_tags"
  "bookmarks"
  "coding_tools"
  "comment_replies"
  "comments"
  "likes"
  "notifications"
  "project_gallery"
  "project_tags"
  "project_views"
  "projects"
  "shares"
  "tags"
  "user_activity"
  "user_skills"
  "users"
)

# Export data for each table
for table in "${tables[@]}"
do
  echo "-- Table: $table" >> db_data.sql
  echo "SELECT * FROM $table;" | psql $DATABASE_URL -A -F"," -t >> db_data.sql
  echo "" >> db_data.sql
done

echo "Database export complete. Schema in db_schema.sql and data in db_data.sql"
