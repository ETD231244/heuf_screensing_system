<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['COORDINATOR', 'ADMIN']);
$data = huef_coordinator_dashboard();
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Reports</h1>
<p class="muted">2026 TFA snapshot. Figures refresh with new lodgements.</p>
<div class="grid grid-3">
  <div class="kpi">Lodged<b><?= (int) $data['totals']['submitted'] ?></b></div>
  <div class="kpi">Last 7 days<b><?= (int) $data['totals']['last7Days'] ?></b></div>
  <div class="kpi">Awaiting<b><?= (int) $data['totals']['awaiting'] ?></b></div>
</div>
<div class="grid grid-2" style="margin-top:1rem">
  <div class="card">
    <h3>By status</h3>
    <?php foreach ($data['byStatus'] as $row): ?>
      <p><?= huef_h($row['label']) ?> <strong><?= (int) $row['count'] ?></strong></p>
    <?php endforeach; ?>
  </div>
  <div class="card">
    <h3>By district</h3>
    <?php foreach ($data['byDistrict'] as $row): ?>
      <p><?= huef_h($row['label']) ?> <strong><?= (int) $row['count'] ?></strong></p>
    <?php endforeach; ?>
  </div>
</div>
<div class="card" style="margin-top:1rem">
  <h3>Institutions</h3>
  <div class="table-wrap">
    <table class="data-grid">
      <thead><tr><th>Code</th><th>Name</th><th>Total</th><th>Pending</th><th>Approved</th><th>Rejected</th></tr></thead>
      <tbody>
      <?php foreach ($data['byInstitution'] as $row): ?>
        <tr>
          <td><?= huef_h($row['code']) ?></td>
          <td><?= huef_h($row['name']) ?></td>
          <td><?= (int) $row['total'] ?></td>
          <td><?= (int) $row['pending'] ?></td>
          <td><?= (int) $row['approved'] ?></td>
          <td><?= (int) $row['rejected'] ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php
huef_render($user, 'Reports', huef_capture());
