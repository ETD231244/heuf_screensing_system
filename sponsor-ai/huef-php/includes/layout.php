<?php

function huef_public_header(?array $user, string $title = ''): void
{
    $home = $user ? huef_home_for($user) : 'index.php';
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= huef_h($title ? $title . ' · HUEF' : 'HUEF Online Application Screening') ?></title>
  <link rel="stylesheet" href="<?= huef_h(huef_url('assets/css/style.css')) ?>">
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="<?= huef_h(huef_url('index.php')) ?>">
      <span class="emblem" aria-hidden="true"></span>
      <span>
        <strong>HUEF</strong>
        <small>Hela Undialu Education Foundation</small>
      </span>
    </a>
    <nav class="top-nav">
      <?php if ($user): ?>
        <a href="<?= huef_h(huef_url($home)) ?>">Dashboard</a>
        <a href="<?= huef_h(huef_url('logout.php')) ?>">Sign out</a>
      <?php else: ?>
        <a href="<?= huef_h(huef_url('index.php')) ?>#how-it-works">How it works</a>
        <a href="<?= huef_h(huef_url('login.php')) ?>">Sign in</a>
        <a class="btn btn-gold btn-sm" href="<?= huef_h(huef_url('register.php')) ?>">Create account</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
<?php
}

function huef_public_footer(): void
{
    ?>
<footer class="site-footer">
  Hela Provincial Government · Sponsorship records are confidential and used only to assess TFA.
</footer>
<script src="<?= huef_h(huef_url('assets/js/app.js')) ?>"></script>
</body>
</html>
<?php
}

function huef_flash_html(): string
{
    $flash = huef_flash();
    if (!$flash) {
        return '';
    }
    $tone = $flash['type'] === 'error' ? 'alert-bad' : ($flash['type'] === 'ok' ? 'alert-ok' : 'alert-info');
    return '<div class="alert ' . $tone . '" role="status">' . huef_h($flash['message']) . '</div>';
}

function huef_render(array $user, string $title, string $content): void
{
    $unread = huef_unread_count($user['id']);
    $nav = huef_nav_for($user);
    $display = huef_full_name($user) ?: $user['email'];
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= huef_h($title) ?> · HUEF</title>
  <link rel="stylesheet" href="<?= huef_h(huef_url('assets/css/style.css')) ?>">
</head>
<body class="app-body">
<div class="app-shell">
  <aside class="sidebar" id="sidebar">
    <div class="gold-strip"></div>
    <a class="brand brand-side" href="<?= huef_h(huef_url(huef_home_for($user))) ?>">
      <span class="emblem emblem-white" aria-hidden="true"></span>
      <span>
        <strong>HUEF</strong>
        <small><?= huef_h(huef_workspace_label($user['role'])) ?> desk</small>
      </span>
    </a>
    <p class="nav-label">Navigation</p>
    <nav class="side-nav" aria-label="Workspace">
      <?php foreach ($nav as [$label, $href]):
          $active = huef_is_active_nav($href);
          $badge = ($href === 'notifications.php' && $unread > 0) ? min(9, $unread) . ($unread > 9 ? '+' : '') : '';
          ?>
        <a href="<?= huef_h(huef_url($href)) ?>"<?= $active ? ' aria-current="page" class="active"' : '' ?>>
          <span><?= huef_h($label) ?></span>
          <?php if ($badge): ?><em class="nav-badge"><?= huef_h($badge) ?></em><?php endif; ?>
        </a>
      <?php endforeach; ?>
    </nav>
    <div class="side-account">
      <div class="who">
        <span class="avatar-dot" aria-hidden="true"></span>
        <span>
          <strong><?= huef_h($display) ?></strong>
          <small><?= huef_h(huef_role_label($user['role'])) ?></small>
        </span>
      </div>
      <a class="btn btn-ghost" href="<?= huef_h(huef_url('logout.php')) ?>">Sign out</a>
    </div>
  </aside>

  <div class="app-main">
    <header class="app-top">
      <button class="menu-btn" type="button" data-toggle-nav aria-label="Open navigation">☰</button>
      <div>
        <p class="app-title"><?= huef_h($title) ?></p>
        <p class="app-sub">Hela Undialu Education Foundation · 2026 TFA</p>
      </div>
      <div class="app-top-right">
        <a class="icon-link<?= $unread ? ' has-unread' : '' ?>" href="<?= huef_h(huef_url('notifications.php')) ?>" aria-label="Notifications">🔔</a>
        <span class="email-chip"><?= huef_h($user['email']) ?></span>
      </div>
    </header>
    <main class="page">
      <?= huef_flash_html() ?>
      <?= $content ?>
    </main>
    <footer class="site-footer">
      Hela Provincial Government · Sponsorship records are confidential and used only to assess TFA.
    </footer>
  </div>
</div>
<div class="nav-backdrop" data-close-nav hidden></div>
<script src="<?= huef_h(huef_url('assets/js/app.js')) ?>"></script>
</body>
</html>
<?php
}

function huef_start(): array
{
    ob_start();
    return [];
}

function huef_capture(): string
{
    return ob_get_clean() ?: '';
}
