<?php
/**
 * XAMPP: these defaults work (root, empty password) once you create
 * the huef_screening database and import sql/schema.sql then sql/seed.sql.
 *
 * InfinityFree / other hosts: copy this file to config.php and paste
 * the host, database, user, and password from the control panel.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'huef_screening',
        'user' => 'root',
        'pass' => '',
        'charset' => 'utf8mb4',
        // 'unix_socket' => '/var/run/mysqld/mysqld.sock', // only if TCP localhost fails
    ],
    'app' => [
        'name' => 'HUEF Online Application Screening',
        'base_url' => '', // leave empty for auto-detect, or e.g. https://yoursite.infinityfreeapp.com
        'timezone' => 'Pacific/Port_Moresby',
        'upload_dir' => __DIR__ . '/storage/uploads',
        'max_upload_bytes' => 8 * 1024 * 1024,
    ],
    'deepseek' => [
        'api_key' => '', // or store in Admin → Settings
        'model' => 'deepseek-v4-flash',
        'base_url' => 'https://api.deepseek.com',
    ],
];
