<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);
$data = huef_coordinator_dashboard();
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Reports</h1>
<p class="muted">Same 2026 snapshot the coordinator desk uses.</p>
<div class="grid grid-3">
  <div class="kpi">Lodged<b><?= (int) $data['totals']['submitted'] ?></b></div>
  <div class="kpi">Approved<b><?= (int) $data['totals']['approved'] ?></b></div>
  <div class="kpi">Rejected<b><?= (int) $data['totals']['rejected'] ?></b></div>
</div>
<div class="card" style="margin-top:1rem">
  <h3>Screening outcomes</h3>
  <?php foreach ($data['byScreening'] as $row): ?>
    <p><?= huef_h($row['label']) ?> <strong><?= (int) $row['count'] ?></strong></p>
  <?php endforeach; ?>
</div>
<p style="margin-top:1rem"><a href="<?= huef_h(huef_url('coordinator/reports.php')) ?>">Open the coordinator report tables</a></p>
<?php
huef_render($user, 'Reports', huef_capture());
