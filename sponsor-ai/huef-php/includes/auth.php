<?php

function huef_user(): ?array
{
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) {
        return null;
    }
    static $cached = null;
    if ($cached && (string) $cached['id'] === (string) $id) {
        return $cached;
    }
    $cached = huef_one(
        'SELECT u.*, a.id AS applicant_id, a.given_name, a.surname, a.photo_mime
         FROM users u
         LEFT JOIN applicants a ON a.user_id = u.id
         WHERE u.id = ?',
        [$id]
    );
    return $cached;
}

function huef_require_login(): array
{
    $user = huef_user();
    if (!$user || !(int) $user['is_active']) {
        huef_redirect('login.php');
    }
    return $user;
}

function huef_require_role(array $roles): array
{
    $user = huef_require_login();
    if (!in_array($user['role'], $roles, true)) {
        huef_redirect(huef_home_for($user));
    }
    return $user;
}

function huef_login(string $email, string $password): bool
{
    $user = huef_one('SELECT * FROM users WHERE email = ? LIMIT 1', [strtolower(trim($email))]);
    if (!$user || !(int) $user['is_active'] || empty($user['password_hash'])) {
        return false;
    }
    $hash = $user['password_hash'];
    if (str_starts_with($hash, '$2b$')) {
        $hash = '$2y$' . substr($hash, 4);
    }
    if (!password_verify($password, $hash)) {
        return false;
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    huef_update('users', ['last_login_at' => date('Y-m-d H:i:s')], 'id = :id', ['id' => $user['id']]);
    huef_audit('login', 'user', $user['id']);
    return true;
}

function huef_logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], (bool) $p['secure'], (bool) $p['httponly']);
    }
    session_destroy();
}

function huef_home_for(array $user): string
{
    if ($user['role'] === 'ADMIN') {
        return 'admin/index.php';
    }
    if ($user['role'] === 'COORDINATOR') {
        return 'coordinator/index.php';
    }
    return 'student/index.php';
}
