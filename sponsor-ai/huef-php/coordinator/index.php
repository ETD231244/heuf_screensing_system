<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['COORDINATOR', 'ADMIN']);

$list = huef_all(
    'SELECT ap.*, a.given_name, a.surname, a.phone, i.code AS institution_code, i.name AS institution_name, d.name AS district_name
     FROM applications ap
     JOIN applicants a ON a.id = ap.applicant_id
     JOIN institutions i ON i.id = ap.institution_id
     LEFT JOIN districts d ON d.id = ap.district_id
     WHERE ap.status <> "DRAFT"
     ORDER BY ap.submitted_at DESC'
);
$data = huef_coordinator_dashboard();

huef_start();
?>
<div data-live-dashboard="<?= huef_h(huef_url('api/dashboard.php')) ?>">
  <p class="tiny">Coordinator desk · live every 8 seconds</p>
  <h1 style="margin:0.2rem 0 0.2rem;color:var(--huef-green-dark)">Applications</h1>
  <p class="muted">Updated <span data-generated><?= huef_h($data['generatedAt']) ?></span>. Screen every lodged file here. Print or download approved lists from <a href="<?= huef_h(huef_url('coordinator/reports.php')) ?>">Reports</a>.</p>
  <div class="grid grid-3" style="margin:1rem 0">
    <div class="kpi">Awaiting decision<b data-kpi="awaiting"><?= (int) $data['totals']['awaiting'] ?></b></div>
    <div class="kpi">Flagged by screening<b data-kpi="flagged"><?= (int) $data['totals']['flagged'] ?></b></div>
    <div class="kpi">Approved / rejected<b><?= (int) $data['totals']['approved'] ?> / <?= (int) $data['totals']['rejected'] ?></b></div>
  </div>
  <div class="card">
    <h3>Lodgements (14 days)</h3>
    <div class="chart-row" data-chart style="margin:0 0 1.4rem">
      <?php
      $max = max(1, ...array_column($data['submissionsByDay'], 'count'));
      foreach ($data['submissionsByDay'] as $day):
          $h = (int) round(($day['count'] / $max) * 100);
          ?>
        <div class="chart-bar" style="height:<?= $h ?>%" title="<?= huef_h($day['label'] . ': ' . $day['count']) ?>"><span><?= huef_h($day['label']) ?></span></div>
      <?php endforeach; ?>
    </div>
  </div>
  <div class="card" style="margin-top:1rem">
    <h3>Attention queue</h3>
    <div class="table-wrap">
      <table class="data-grid">
        <thead><tr><th>Applicant</th><th>District</th><th>Institution</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody data-queue>
        <?php foreach ($data['attentionQueue'] as $row): ?>
          <tr>
            <td><a href="<?= huef_h($row['href']) ?>"><?= huef_h($row['name']) ?></a><div class="muted"><?= huef_h($row['program']) ?></div></td>
            <td><?= huef_h($row['district']) ?></td>
            <td><?= huef_h($row['institution']) ?></td>
            <td><?= huef_h($row['statusLabel']) ?></td>
            <td><?= huef_h($row['submittedLabel']) ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$data['attentionQueue']): ?><tr><td colspan="5">No applications waiting.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="table-wrap card" style="margin-top:1rem;padding:0">
  <table class="data-grid">
    <thead><tr><th>Applicant</th><th>Institution</th><th>Status</th><th>Screening</th><th>Submitted</th></tr></thead>
    <tbody>
    <?php foreach ($list as $row): ?>
      <tr>
        <td><a href="<?= huef_h(huef_url('coordinator/application.php?id=' . urlencode($row['id']))) ?>"><?= huef_h(huef_full_name($row)) ?></a><div class="muted"><?= huef_h($row['phone']) ?> · <?= huef_h($row['district_name'] ?? '—') ?></div></td>
        <td><?= huef_h($row['institution_code'] . ' ' . $row['institution_name']) ?><div class="muted"><?= huef_h($row['program_name']) ?></div></td>
        <td><span class="badge <?= huef_status_class($row['status']) ?>"><?= huef_h(huef_status_label($row['status'])) ?></span></td>
        <td><?= huef_h(huef_screening_label($row['screening_status'])) ?></td>
        <td><?= huef_h(huef_dt($row['submitted_at'])) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$list): ?>
      <tr><td colspan="5">No lodged applications yet.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
</div>
<?php
huef_render($user, 'Applications', huef_capture());
