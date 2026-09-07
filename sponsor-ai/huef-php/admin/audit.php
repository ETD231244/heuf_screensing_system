<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);
$rows = huef_all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Audit trail</h1>
<div class="table-wrap card" style="padding:0">
  <table class="data-grid">
    <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $row): ?>
      <tr>
        <td><?= huef_h(huef_dt($row['created_at'])) ?></td>
        <td><?= huef_h($row['actor_email']) ?></td>
        <td><?= huef_h($row['action']) ?></td>
        <td><?= huef_h($row['entity_type'] . ' ' . $row['entity_id']) ?></td>
        <td class="muted"><?= huef_h($row['details']) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php
huef_render($user, 'Audit trail', huef_capture());
