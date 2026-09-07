<?php

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "HUEF is not configured yet.\n\nCopy config.example.php to config.php and enter your MySQL details.";
    exit;
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
