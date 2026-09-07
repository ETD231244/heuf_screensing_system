<?php

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function huef_setup_error(string $title, string $html): void
{
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . htmlspecialchars($title) . '</title>';
    echo '<style>body{font-family:Segoe UI,sans-serif;background:#f7f3e8;color:#1c1914;margin:0;padding:2rem}';
    echo '.box{max-width:44rem;margin:0 auto;background:#fff;border:1px solid #e0d8c8;border-radius:12px;padding:1.5rem 1.7rem}';
    echo 'h1{color:#07351f;margin-top:0}code,pre{background:#f3efe4;padding:.15rem .4rem;border-radius:4px}pre{padding:1rem;overflow:auto}';
    echo 'a{color:#0b4d2c}</style></head><body><div class="box">';
    echo '<p style="color:#0b4d2c;font-weight:800;letter-spacing:.16em;text-transform:uppercase;font-size:.75rem">HUEF setup</p>';
    echo '<h1>' . htmlspecialchars($title) . '</h1>';
    echo $html;
    echo '</div></body></html>';
    exit;
}

$configFile = dirname(__DIR__) . '/config.php';
$exampleFile = dirname(__DIR__) . '/config.example.php';
if (!is_file($configFile)) {
    if (!is_file($exampleFile)) {
        huef_setup_error(
            'Configuration file missing',
            '<p>Copy <code>config.example.php</code> to <code>config.php</code> in the <code>huef-php</code> folder and enter your MySQL details.</p>'
        );
    }
    $configFile = $exampleFile;
}

$GLOBALS['HUEF_CONFIG'] = require $configFile;
date_default_timezone_set($GLOBALS['HUEF_CONFIG']['app']['timezone'] ?? 'Pacific/Port_Moresby');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/deepseek.php';
require_once __DIR__ . '/screening.php';
require_once __DIR__ . '/dashboard.php';
require_once __DIR__ . '/layout.php';

try {
    huef_pdo();
} catch (PDOException $e) {
    $db = $GLOBALS['HUEF_CONFIG']['db']['name'] ?? 'huef_screening';
    huef_setup_error(
        'MySQL is not ready',
        '<p>Apache/PHP is working. Create the database in phpMyAdmin, then import the SQL files.</p>'
        . '<ol>'
        . '<li>In XAMPP Control Panel, start <strong>Apache</strong> and <strong>MySQL</strong>.</li>'
        . '<li>Open <a href="http://localhost/phpmyadmin" target="_blank" rel="noreferrer">http://localhost/phpmyadmin</a>.</li>'
        . '<li>Click <strong>New</strong>, database name <code>' . htmlspecialchars($db) . '</code>, collation <code>utf8mb4_unicode_ci</code>, then Create.</li>'
        . '<li>Open that database → <strong>Import</strong> → choose <code>sql/schema.sql</code> → Go.</li>'
        . '<li>Import <code>sql/seed.sql</code> next (demo logins).</li>'
        . '</ol>'
        . '<p>XAMPP defaults (already in <code>config.example.php</code>): host <code>localhost</code>, user <code>root</code>, password empty, database <code>' . htmlspecialchars($db) . '</code>.</p>'
        . '<p>If you use InfinityFree, copy <code>config.example.php</code> to <code>config.php</code> and paste the host/user/password from their control panel.</p>'
        . '<p style="color:#7a7266;font-size:.9rem">MySQL said: ' . htmlspecialchars($e->getMessage()) . '</p>'
    );
}
