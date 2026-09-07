<?php
require __DIR__ . '/includes/bootstrap.php';
$user = huef_require_login();

if (isset($_GET['read']) && $_GET['read'] === 'all' && isset($_GET['csrf']) && hash_equals($_SESSION['csrf'] ?? '', (string) $_GET['csrf'])) {
    huef_query('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [$user['id']]);
    huef_redirect('notifications.php');
}

$notes = huef_all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 80',
    [$user['id']]
);
huef_query(
    'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
    [$user['id']]
);

huef_start();
?>
<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
  <div>
    <p class="tiny">Inbox</p>
    <h1 style="margin:0;color:var(--huef-green-dark)">Notices</h1>
  </div>
</div>
<?php if (!$notes): ?>
  <div class="card" style="margin-top:1rem"><p class="muted">No notices yet.</p></div>
<?php else: ?>
  <div class="cards" style="margin-top:1rem">
    <?php foreach ($notes as $note): ?>
      <article class="card">
        <p class="tiny"><?= huef_h($note['category']) ?> · <?= huef_h(huef_dt($note['created_at'])) ?></p>
        <h3><?= huef_h($note['title']) ?></h3>
        <p><?= nl2br(huef_h($note['message'])) ?></p>
      </article>
    <?php endforeach; ?>
  </div>
<?php endif;
huef_render($user, 'Notices', huef_capture());
