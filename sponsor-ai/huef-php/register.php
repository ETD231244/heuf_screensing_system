<?php
require __DIR__ . '/includes/bootstrap.php';
$user = huef_user();
if ($user) {
    huef_redirect(huef_home_for($user));
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $email = strtolower(huef_post('email'));
    $given = strtoupper(huef_post('given_name'));
    $surname = strtoupper(huef_post('surname'));
    $phone = huef_post('phone');
    $gender = huef_post('gender');
    $password = (string) ($_POST['password'] ?? '');
    $confirm = (string) ($_POST['confirm'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$given || !$surname || !$phone || !in_array($gender, ['M', 'F'], true)) {
        $error = 'Please complete name, gender, phone, and a valid email.';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } elseif (huef_one('SELECT id FROM users WHERE email = ?', [$email])) {
        $error = 'That email already has an account. Sign in instead.';
    } else {
        $uid = huef_id('user');
        huef_insert('users', [
            'id' => $uid,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'role' => 'STUDENT',
            'auth_provider' => 'PASSWORD',
            'is_active' => 1,
        ]);
        huef_insert('applicants', [
            'id' => huef_id('appc'),
            'user_id' => $uid,
            'given_name' => $given,
            'surname' => $surname,
            'gender' => $gender,
            'phone' => $phone,
            'province' => 'Hela',
            'eligibility_path' => 'HELA_ORIGIN',
        ]);
        huef_login($email, $password);
        huef_flash('ok', 'Account created. Complete your profile, then lodge the 2026 application.');
        huef_redirect('student/profile.php');
    }
}

huef_public_header(null, 'Create a student account');
?>
<div class="card auth-card" style="max-width:34rem">
  <p class="tiny">2026 TFA</p>
  <h1 style="margin:0.3rem 0 0.6rem;color:var(--huef-green-dark)">Create a student account</h1>
  <?php if ($error): ?><div class="alert alert-bad"><?= huef_h($error) ?></div><?php endif; ?>
  <form method="post">
    <?= huef_csrf_field() ?>
    <div class="form-grid form-2">
      <div>
        <label for="given_name">Given name</label>
        <input id="given_name" name="given_name" required value="<?= huef_h(huef_post('given_name')) ?>">
      </div>
      <div>
        <label for="surname">Surname</label>
        <input id="surname" name="surname" required value="<?= huef_h(huef_post('surname')) ?>">
      </div>
    </div>
    <label for="gender">Gender</label>
    <select id="gender" name="gender" required>
      <option value="">Select</option>
      <option value="F"<?= huef_selected('F', huef_post('gender')) ?>>Female</option>
      <option value="M"<?= huef_selected('M', huef_post('gender')) ?>>Male</option>
    </select>
    <label for="phone">Mobile phone</label>
    <input id="phone" name="phone" required value="<?= huef_h(huef_post('phone')) ?>">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required value="<?= huef_h(huef_post('email')) ?>">
    <label for="password">Password</label>
    <div class="pw-wrap">
      <input id="password" name="password" type="password" required minlength="8">
      <button type="button" class="pw-toggle" data-show-password="password">Show</button>
    </div>
    <label for="confirm">Confirm password</label>
    <input id="confirm" name="confirm" type="password" required minlength="8">
    <p style="margin-top:1rem"><button class="btn btn-green" type="submit">Create account</button></p>
  </form>
  <p class="muted">Already registered? <a href="<?= huef_h(huef_url('login.php')) ?>">Sign in</a></p>
</div>
<?php huef_public_footer(); ?>
