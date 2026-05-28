$query = @"
\echo '=== TABLES ==='
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c2
     WHERE c2.table_name = t.table_name AND c2.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '=== COLUMNS PER TABLE ==='
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

\echo ''
\echo '=== ENUMS ==='
SELECT
    t.typname AS enum_name,
    e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;

\echo ''
\echo '=== FOREIGN KEYS ==='
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
"@

$query | docker exec -i edl_postgres psql -U edl_user -d employee_digital_library | Out-File -FilePath "schema_export.txt" -Encoding utf8

Write-Host "Done! Output saved to schema_export.txt"