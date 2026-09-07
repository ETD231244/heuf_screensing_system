<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
$district = (string) ($_GET['district_id'] ?? '');
if ($district === '') {
    echo '[]';
    exit;
}
$rows = huef_all('SELECT id, name FROM llgs WHERE district_id = ? ORDER BY name', [$district]);
echo json_encode($rows);
