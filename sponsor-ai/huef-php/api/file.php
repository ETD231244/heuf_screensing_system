<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_login();
$id = (string) ($_GET['id'] ?? '');
$doc = huef_one(
    'SELECT d.*, ap.applicant_id, a.user_id
     FROM documents d
     JOIN applications ap ON ap.id = d.application_id
     JOIN applicants a ON a.id = ap.applicant_id
     WHERE d.id = ?',
    [$id]
);
if (!$doc) {
    http_response_code(404);
    exit('File not found.');
}
$allowed = in_array($user['role'], ['COORDINATOR', 'ADMIN'], true) || $doc['user_id'] === $user['id'];
if (!$allowed) {
    http_response_code(403);
    exit('Not allowed.');
}
$path = rtrim($GLOBALS['HUEF_CONFIG']['app']['upload_dir'], '/') . '/' . ltrim($doc['stored_path'], '/');
if (!is_file($path)) {
    http_response_code(404);
    exit('File missing on disk.');
}
header('Content-Type: ' . $doc['mime_type']);
header('Content-Disposition: inline; filename="' . str_replace('"', '', $doc['original_name']) . '"');
header('Content-Length: ' . filesize($path));
readfile($path);
exit;
