<?php
require __DIR__ . '/includes/bootstrap.php';
$user = huef_user();
if ($user) {
    huef_redirect(huef_home_for($user));
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    if (huef_login(huef_post('email'), (string) ($_POST['password'] ?? ''))) {
        $u = huef_user();
        huef_redirect(huef_home_for($u));
    }
    $error = 'Email or password is not correct, or the account is inactive.';
}

huef_public_header(null, 'Sign in');
?>
<div class="card auth-card">
  <p class="tiny">HUEF portal</p>
  <h1 style="margin:0.3rem 0 0.6rem;color:var(--huef-green-dark)">Sign in</h1>
  <?php if ($error): ?><div class="alert alert-bad"><?= huef_h($error) ?></div><?php endif; ?>
  <?= huef_flash_html() ?>
  <form method="post">
    <?= huef_csrf_field() ?>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required autocomplete="username" value="<?= huef_h(huef_post('email')) ?>">
    <label for="password">Password</label>
    <div class="pw-wrap">
      <input id="password" name="password" type="password" required autocomplete="current-password">
      <button type="button" class="pw-toggle" data-show-password="password">Show</button>
    </div>
    <p style="margin-top:1rem"><button class="btn btn-green" type="submit">Sign in</button></p>
  </form>
  <p class="muted" style="margin-top:1rem">No account yet? <a href="<?= huef_h(huef_url('register.php')) ?>">Create a student account</a></p>
  <p class="muted" style="font-size:0.85rem">Demo: admin@huef.pg / coordinator@huef.pg — password <code>HUEF2026!</code>. Student: student@huef.pg / <code>student123</code>.</p>
</div>
<?php huef_public_footer(); ?>
