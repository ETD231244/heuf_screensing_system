<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);
$counts = [
    'users' => huef_one('SELECT COUNT(*) c FROM users')['c'],
    'applicants' => huef_one('SELECT COUNT(*) c FROM applicants')['c'],
    'apps' => huef_one('SELECT COUNT(*) c FROM applications WHERE status <> "DRAFT"')['c'],
    'pending' => huef_one('SELECT COUNT(*) c FROM applications WHERE status IN ("PENDING","MORE_INFO")')['c'],
];
$recent = huef_all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8');
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Administrator overview</h1>
<p class="muted">Accounts, lookups, announcements, and the DeepSeek key. Application decisions stay with coordinators.</p>
<div class="grid grid-3">
  <div class="kpi">Users<b><?= (int) $counts['users'] ?></b></div>
  <div class="kpi">Applicants<b><?= (int) $counts['applicants'] ?></b></div>
  <div class="kpi">Lodged files / awaiting<b><?= (int) $counts['apps'] ?> / <?= (int) $counts['pending'] ?></b></div>
</div>
<div class="cards cards-3" style="margin-top:1rem">
  <a class="card" href="<?= huef_h(huef_url('admin/users.php')) ?>"><h3>User accounts</h3><p class="muted">Create coordinators and deactivate users.</p></a>
  <a class="card" href="<?= huef_h(huef_url('admin/lookups.php')) ?>"><h3>Institutions &amp; LLGs</h3><p class="muted">Keep district and college lists current.</p></a>
  <a class="card" href="<?= huef_h(huef_url('admin/settings.php')) ?>"><h3>Settings</h3><p class="muted">Support contacts and DeepSeek API key.</p></a>
</div>
<div class="card" style="margin-top:1rem">
  <h3>Recent audit</h3>
  <?php foreach ($recent as $row): ?>
    <p class="muted"><?= huef_h(huef_dt($row['created_at'])) ?> · <?= huef_h($row['actor_email']) ?> · <?= huef_h($row['action']) ?></p>
  <?php endforeach; ?>
</div>
<?php
huef_render($user, 'Overview', huef_capture());
