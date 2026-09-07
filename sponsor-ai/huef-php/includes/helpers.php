<?php

function huef_base_url(): string
{
    $cfg = $GLOBALS['HUEF_CONFIG']['app']['base_url'] ?? '';
    if ($cfg) {
        return rtrim($cfg, '/');
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $dir = dirname($script);
    $leaf = basename($dir);
    if (in_array($leaf, ['student', 'coordinator', 'admin', 'api'], true)) {
        $dir = dirname($dir);
    }
    if ($dir === '/' || $dir === '.' || $dir === '\\') {
        $dir = '';
    }
    return rtrim($scheme . '://' . $host . $dir, '/');
}

function huef_url(string $path = ''): string
{
    $path = ltrim($path, '/');
    $base = huef_base_url();
    return $path === '' ? $base . '/' : $base . '/' . $path;
}

function huef_redirect(string $path): void
{
    header('Location: ' . (str_starts_with($path, 'http') ? $path : huef_url($path)));
    exit;
}

function huef_h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function huef_flash(?string $type = null, ?string $message = null): ?array
{
    if ($message !== null && $type !== null) {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];
        return null;
    }
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

function huef_csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function huef_csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . huef_h(huef_csrf_token()) . '">';
}

function huef_csrf_check(): void
{
    $token = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf'] ?? '', (string) $token)) {
        http_response_code(400);
        exit('Invalid security token. Please go back and try again.');
    }
}

function huef_json($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function huef_dt(?string $iso): string
{
    if (!$iso) {
        return '—';
    }
    $t = strtotime($iso);
    return $t ? date('d M Y, H:i', $t) : $iso;
}

function huef_full_name(array $row): string
{
    return trim(($row['given_name'] ?? '') . ' ' . ($row['surname'] ?? $row['family_name'] ?? ''));
}

function huef_status_label(string $status): string
{
    $map = [
        'DRAFT' => 'Draft',
        'PENDING' => 'Pending review',
        'MORE_INFO' => 'More information requested',
        'APPROVED' => 'Approved',
        'REJECTED' => 'Not successful',
    ];
    return $map[$status] ?? $status;
}

function huef_status_class(string $status): string
{
    $map = [
        'DRAFT' => 'badge-muted',
        'PENDING' => 'badge-gold',
        'MORE_INFO' => 'badge-warn',
        'APPROVED' => 'badge-ok',
        'REJECTED' => 'badge-bad',
    ];
    return $map[$status] ?? 'badge-muted';
}

function huef_role_label(string $role): string
{
    $map = [
        'STUDENT' => 'Applicant',
        'COORDINATOR' => 'Coordinator',
        'ADMIN' => 'Administrator',
    ];
    return $map[$role] ?? $role;
}

function huef_workspace_label(string $role): string
{
    $map = [
        'ADMIN' => 'Administrator',
        'COORDINATOR' => 'Coordinator',
        'STUDENT' => 'Applicant',
    ];
    return $map[$role] ?? 'HUEF';
}

function huef_eligibility_label(string $path): string
{
    $map = [
        'HELA_ORIGIN' => 'Hela origin by blood and custom',
        'PUBLIC_SERVANT_CHILD' => 'Child of a public servant serving in Hela (3+ years)',
        'PUBLIC_SERVANT_SELF' => 'Public servant serving in Hela (3+ years)',
    ];
    return $map[$path] ?? $path;
}

function huef_fee_label(string $cat): string
{
    $map = [
        'HUEF_TFA' => 'HUEF Tuition Fee Assistance',
        'SELF_SPONSOR' => 'Self sponsor',
        'CORPORATE' => 'Corporate sponsor',
        'HECAS_TESA' => 'HECAS / TESA',
        'OTHER' => 'Other',
    ];
    return $map[$cat] ?? $cat;
}

function huef_study_level_label(string $level): string
{
    $map = [
        'UNDERGRADUATE' => 'Undergraduate',
        'POSTGRADUATE' => 'Postgraduate',
        'NATIONAL_HIGH_SCHOOL' => 'National High School',
        'OVERSEAS' => 'Overseas studies',
    ];
    return $map[$level] ?? $level;
}

function huef_screening_label(?string $status): string
{
    if (!$status) {
        return 'Not screened';
    }
    $map = [
        'PASSED_INITIAL' => 'Passed Initial Screening',
        'NEEDS_REVIEW' => 'Needs Review',
        'INFORMATION_MISMATCH' => 'Information Mismatch',
        'INCORRECT_DOCUMENT' => 'Incorrect Document',
        'UNREADABLE_DOCUMENT' => 'Unreadable Document',
        'MISSING_REQUIRED' => 'Missing Required Document',
        'POTENTIAL_DUPLICATE' => 'Potential Duplicate',
        'UNABLE_TO_DETERMINE' => 'AI Unable to Determine',
    ];
    return $map[$status] ?? $status;
}

function huef_doc_label(string $code, array $types = []): string
{
    foreach ($types as $type) {
        if (($type['code'] ?? '') === $code) {
            return $type['label'];
        }
    }
    $map = [
        'PASSPORT_PHOTO' => 'Passport-size photo',
        'ACCEPTANCE_LETTER' => 'Acceptance / offer letter',
        'GRADE_10' => 'Grade 10 certificate',
        'GRADE_12' => 'Grade 12 certificate',
        'FEE_STRUCTURE' => '2026 school fee structure / invoice',
        'CONFIRMATION_LETTER' => 'Confirmation letter (year level)',
        'TRANSCRIPT' => 'Latest academic transcript',
        'STUDENT_ID' => 'Valid student ID',
        'SUPPORT_LETTER' => 'Support letter (non-Hela origin)',
    ];
    return $map[$code] ?? $code;
}

function huef_file_size(int $bytes): string
{
    if ($bytes < 1024) {
        return $bytes . ' B';
    }
    if ($bytes < 1048576) {
        return round($bytes / 1024, 1) . ' KB';
    }
    return round($bytes / 1048576, 1) . ' MB';
}

function huef_audit(string $action, string $entityType, $entityId = null, $details = null, $applicationId = null): void
{
    $user = huef_user();
    huef_insert('audit_logs', [
        'id' => huef_id('audt'),
        'actor_id' => $user['id'] ?? null,
        'actor_email' => $user['email'] ?? 'system',
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId !== null ? (string) $entityId : null,
        'application_id' => $applicationId,
        'details' => is_string($details) || $details === null ? $details : json_encode($details),
    ]);
}

function huef_notify(string $userId, string $title, string $message, ?string $senderId = null, ?string $applicationId = null, string $type = 'INFO', string $category = 'APPLICATION'): void
{
    huef_insert('notifications', [
        'id' => huef_id('note'),
        'user_id' => $userId,
        'sender_id' => $senderId,
        'application_id' => $applicationId,
        'title' => $title,
        'message' => $message,
        'type' => $type,
        'category' => $category,
    ]);
}

function huef_unread_count(string $userId): int
{
    $row = huef_one('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL', [$userId]);
    return (int) ($row['c'] ?? 0);
}

function huef_allowed_ext(string $name): bool
{
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return in_array($ext, ['pdf', 'jpg', 'jpeg', 'png', 'webp'], true);
}

function huef_detect_kind(string $tmp): ?string
{
    $fh = fopen($tmp, 'rb');
    if (!$fh) {
        return null;
    }
    $head = fread($fh, 12) ?: '';
    fclose($fh);
    if (str_starts_with($head, '%PDF')) {
        return 'pdf';
    }
    if (str_starts_with($head, "\x89PNG")) {
        return 'png';
    }
    if (str_starts_with($head, "\xFF\xD8\xFF")) {
        return 'jpg';
    }
    if (str_starts_with($head, 'RIFF') && strpos($head, 'WEBP') !== false) {
        return 'webp';
    }
    return null;
}

function huef_save_upload(array $file, string $subdir, int $maxBytes = 5242880): ?array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? 0) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('File upload failed.');
    }
    if (($file['size'] ?? 0) > $maxBytes) {
        throw new RuntimeException('File is larger than the allowed size.');
    }
    if (!huef_allowed_ext($file['name'])) {
        throw new RuntimeException('Only PDF, JPG, PNG, and WEBP files are accepted.');
    }
    $kind = huef_detect_kind($file['tmp_name']);
    if (!$kind) {
        throw new RuntimeException('The file contents do not match a PDF, JPG, PNG, or WEBP.');
    }
    $root = $GLOBALS['HUEF_CONFIG']['app']['upload_dir'];
    $dir = rtrim($root, '/') . '/' . trim($subdir, '/');
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Could not create upload folder.');
    }
    $safe = preg_replace('/[^a-zA-Z0-9._-]+/', '_', basename($file['name']));
    $stored = bin2hex(random_bytes(8)) . '_' . $safe;
    $dest = $dir . '/' . $stored;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('Could not store the uploaded file.');
    }
    $mime = [
        'pdf' => 'application/pdf',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'webp' => 'image/webp',
    ][$kind];
    return [
        'original_name' => $file['name'],
        'stored_name' => $stored,
        'mime' => $mime,
        'size' => (int) $file['size'],
        'path' => trim($subdir, '/') . '/' . $stored,
        'kind' => $kind,
    ];
}

function huef_current_period(): ?array
{
    return huef_one(
        'SELECT * FROM application_periods WHERE is_active = 1 ORDER BY academic_year DESC LIMIT 1'
    ) ?? huef_one('SELECT * FROM application_periods ORDER BY academic_year DESC LIMIT 1');
}

function huef_nav_for(array $user): array
{
    $role = $user['role'];
    if ($role === 'STUDENT') {
        return [
            ['Dashboard', 'student/index.php'],
            ['Application', 'student/apply.php'],
            ['My profile', 'student/profile.php'],
            ['Notices', 'notifications.php'],
        ];
    }
    if ($role === 'COORDINATOR') {
        return [
            ['Applications', 'coordinator/index.php'],
            ['Send notice', 'coordinator/notices.php'],
            ['Reports', 'coordinator/reports.php'],
            ['Notices', 'notifications.php'],
        ];
    }
    return [
        ['Overview', 'admin/index.php'],
        ['Applications', 'coordinator/index.php'],
        ['User accounts', 'admin/users.php'],
        ['Institutions & LLGs', 'admin/lookups.php'],
        ['Announcements', 'admin/announcements.php'],
        ['Audit trail', 'admin/audit.php'],
        ['Reports', 'admin/reports.php'],
        ['Settings', 'admin/settings.php'],
        ['Notices', 'notifications.php'],
    ];
}

function huef_is_active_nav(string $href): bool
{
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if (str_ends_with($script, '/' . $href) || str_ends_with($script, $href)) {
        return true;
    }
    if ($href === 'coordinator/index.php' && str_contains($uri, '/coordinator/application')) {
        return true;
    }
    return false;
}

function huef_post(string $key, string $default = ''): string
{
    return trim((string) ($_POST[$key] ?? $default));
}

function huef_selected($value, $current): string
{
    return (string) $value === (string) $current ? ' selected' : '';
}

function huef_checked($value, $current): string
{
    return (string) $value === (string) $current ? ' checked' : '';
}

function huef_page_title(array $user): string
{
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    $map = [
        'student/index.php' => 'Dashboard',
        'student/apply.php' => 'Application',
        'student/profile.php' => 'My profile',
        'coordinator/index.php' => 'Applications',
        'coordinator/application.php' => 'Application review',
        'coordinator/notices.php' => 'Send notice',
        'coordinator/reports.php' => 'Reports',
        'admin/index.php' => 'Overview',
        'admin/users.php' => 'User accounts',
        'admin/lookups.php' => 'Institutions & LLGs',
        'admin/announcements.php' => 'Announcements',
        'admin/audit.php' => 'Audit trail',
        'admin/reports.php' => 'Reports',
        'admin/settings.php' => 'Settings',
        'notifications.php' => 'Notices',
    ];
    foreach ($map as $file => $title) {
        if (str_ends_with($script, $file)) {
            return $title;
        }
    }
    return 'HUEF';
}
