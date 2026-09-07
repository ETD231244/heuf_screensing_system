<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $action = huef_post('action');
    if ($action === 'create') {
        $email = strtolower(huef_post('email'));
        $role = huef_post('role');
        $password = (string) ($_POST['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, ['STUDENT', 'COORDINATOR', 'ADMIN'], true) || strlen($password) < 8) {
            huef_flash('error', 'Need a valid email, role, and password of 8+ characters.');
        } elseif (huef_one('SELECT id FROM users WHERE email = ?', [$email])) {
            huef_flash('error', 'That email already exists.');
        } else {
            $uid = huef_insert('users', [
                'id' => huef_id('user'),
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_BCRYPT),
                'role' => $role,
                'auth_provider' => 'PASSWORD',
                'is_active' => 1,
            ]);
            if ($role === 'STUDENT') {
                huef_insert('applicants', [
                    'id' => huef_id('appc'),
                    'user_id' => $uid,
                    'given_name' => strtoupper(huef_post('given_name') ?: 'NEW'),
                    'surname' => strtoupper(huef_post('surname') ?: 'APPLICANT'),
                    'gender' => 'U',
                    'phone' => huef_post('phone') ?: '00000000',
                ]);
            }
            huef_audit('user_create', 'user', $uid, ['role' => $role]);
            huef_flash('ok', 'Account created.');
        }
        huef_redirect('admin/users.php');
    }
    if ($action === 'toggle') {
        $id = huef_post('id');
        $row = huef_one('SELECT * FROM users WHERE id = ?', [$id]);
        if ($row && $row['id'] !== $user['id']) {
            huef_update('users', ['is_active' => (int) $row['is_active'] ? 0 : 1], 'id = :id', ['id' => $id]);
            huef_audit('user_toggle', 'user', $id);
        }
        huef_redirect('admin/users.php');
    }
}

$users = huef_all('SELECT u.*, a.given_name, a.surname FROM users u LEFT JOIN applicants a ON a.user_id = u.id ORDER BY u.created_at DESC');
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">User accounts</h1>
<form method="post" class="card">
  <?= huef_csrf_field() ?>
  <input type="hidden" name="action" value="create">
  <div class="form-grid form-2">
    <div><label>Email</label><input name="email" type="email" required></div>
    <div>
      <label>Role</label>
      <select name="role">
        <option value="STUDENT">Applicant</option>
        <option value="COORDINATOR">Coordinator</option>
        <option value="ADMIN">Administrator</option>
      </select>
    </div>
    <div><label>Password</label><input name="password" type="text" required minlength="8"></div>
    <div><label>Given name (students)</label><input name="given_name"></div>
    <div><label>Surname (students)</label><input name="surname"></div>
    <div><label>Phone (students)</label><input name="phone"></div>
  </div>
  <p><button class="btn btn-green" type="submit">Create account</button></p>
</form>
<div class="table-wrap card" style="margin-top:1rem;padding:0">
  <table class="data-grid">
    <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($users as $row): ?>
      <tr>
        <td><?= huef_h($row['email']) ?></td>
        <td><?= huef_h(huef_full_name($row) ?: '—') ?></td>
        <td><?= huef_h(huef_role_label($row['role'])) ?></td>
        <td><?= (int) $row['is_active'] ? 'Yes' : 'No' ?></td>
        <td>
          <?php if ($row['id'] !== $user['id']): ?>
            <form method="post">
              <?= huef_csrf_field() ?>
              <input type="hidden" name="action" value="toggle">
              <input type="hidden" name="id" value="<?= huef_h($row['id']) ?>">
              <button class="btn btn-sm btn-outline" style="color:var(--huef-green)" type="submit"><?= (int) $row['is_active'] ? 'Deactivate' : 'Activate' ?></button>
            </form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php
huef_render($user, 'User accounts', huef_capture());
