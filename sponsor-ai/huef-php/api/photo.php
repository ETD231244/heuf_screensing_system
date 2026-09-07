<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_login();
$target = (string) ($_GET['user'] ?? $user['id']);
if ($target !== $user['id'] && !in_array($user['role'], ['COORDINATOR', 'ADMIN'], true)) {
    http_response_code(403);
    exit('Not allowed.');
}
$row = huef_one('SELECT photo_mime, photo_bytes FROM applicants WHERE user_id = ?', [$target]);
if (!$row || empty($row['photo_bytes'])) {
    http_response_code(404);
    exit('No photo.');
}
header('Content-Type: ' . ($row['photo_mime'] ?: 'image/jpeg'));
header('Cache-Control: private, max-age=3600');
echo $row['photo_bytes'];
exit;
