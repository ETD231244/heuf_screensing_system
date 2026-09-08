<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['COORDINATOR', 'ADMIN']);

$screening = trim((string) ($_GET['screening'] ?? ''));
$allowedScreening = [
    'PASSED_INITIAL',
    'NEEDS_REVIEW',
    'MISSING_REQUIRED',
    'UNREADABLE_DOCUMENT',
    'INCORRECT_DOCUMENT',
    'INFORMATION_MISMATCH',
    'POTENTIAL_DUPLICATE',
    'UNABLE_TO_DETERMINE',
];

$sql = 'SELECT ap.*, a.given_name, a.surname, a.phone, u.email,
               i.code AS institution_code, i.name AS institution_name,
               d.name AS district_name, l.name AS llg_name
        FROM applications ap
        JOIN applicants a ON a.id = ap.applicant_id
        JOIN users u ON u.id = a.user_id
        JOIN institutions i ON i.id = ap.institution_id
        LEFT JOIN districts d ON d.id = ap.district_id
        LEFT JOIN llgs l ON l.id = a.llg_id
        WHERE ap.status <> "DRAFT"';
$params = [];
if (in_array($screening, $allowedScreening, true)) {
    $sql .= ' AND COALESCE(ap.screening_status, "UNABLE_TO_DETERMINE") = ?';
    $params[] = $screening;
}
$sql .= ' ORDER BY ap.submitted_at DESC';
$list = huef_all($sql, $params);

huef_start();
?>
<form method="get" class="desk-toolbar">
  <select name="screening" onchange="this.form.submit()">
    <option value="">All screening results</option>
    <?php foreach ($allowedScreening as $code): ?>
      <option value="<?= huef_h($code) ?>"<?= huef_selected($code, $screening) ?>><?= huef_h(huef_screening_label($code)) ?></option>
    <?php endforeach; ?>
  </select>
</form>

<div class="table-wrap card desk-card">
  <table class="data-grid desk-table">
    <thead>
      <tr>
        <th>Applicant</th>
        <th>District / LLG</th>
        <th>Institution</th>
        <th>Status</th>
        <th>AI screening</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
    <?php foreach ($list as $row): ?>
      <tr>
        <td>
          <strong><?= huef_h(huef_full_name($row)) ?></strong>
          <span class="sub"><?= huef_h($row['email']) ?></span>
          <span class="sub"><?= huef_h(huef_dt($row['submitted_at'])) ?></span>
        </td>
        <td>
          <strong><?= huef_h($row['district_name'] ?? '—') ?></strong>
          <span class="sub"><?= huef_h($row['llg_name'] ?? '—') ?></span>
        </td>
        <td>
          <strong><?= huef_h($row['institution_code'] . ' · ' . ($row['program_name'] ?: $row['institution_name'])) ?></strong>
          <span class="sub"><?= huef_h($row['year_of_study']) ?></span>
        </td>
        <td><span class="badge <?= huef_status_class($row['status']) ?>"><?= huef_h(huef_status_label($row['status'])) ?></span></td>
        <td><?= huef_h(huef_screening_label($row['screening_status'])) ?></td>
        <td><a class="review-link" href="<?= huef_h(huef_url('coordinator/application.php?id=' . urlencode($row['id']))) ?>">Review</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$list): ?>
      <tr><td colspan="6">No lodged applications match this screening filter.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
</div>
<?php
$csvBtn = '<a class="btn btn-sm btn-muted" href="' . huef_h(huef_url('coordinator/reports.php')) . '" title="Download approved lists from Reports">Download CSV</a>';
huef_render($user, 'Applications', huef_capture(), ['header_action' => $csvBtn]);
