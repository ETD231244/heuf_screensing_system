<?php
require dirname(__DIR__) . '/includes/bootstrap.php';

$user = huef_require_role(['COORDINATOR', 'ADMIN']);

$districtId = huef_safe_lookup_id((string) ($_GET['district_id'] ?? '')) ?? '';
$institutionId = huef_safe_lookup_id((string) ($_GET['institution_id'] ?? '')) ?? '';

$districts = huef_all('SELECT id, name FROM districts ORDER BY name');
$institutions = huef_all('SELECT id, code, name FROM institutions WHERE is_active = 1 ORDER BY code, name');
$approved = huef_approved_report_rows($districtId ?: null, $institutionId ?: null);
$data = huef_coordinator_dashboard();

huef_start();
?>
<h1 class="page-h1">Reports</h1>
<p class="lede">Filter approved applicants by their Hela district and institution, then print the report or download it as a CSV file.</p>

<div class="grid grid-3" style="margin:1.1rem 0 1.2rem">
  <div class="kpi">
    <span>Total submitted</span>
    <b><?= (int) $data['totals']['submitted'] ?></b>
    <small>All lodged applications</small>
  </div>
  <div class="kpi">
    <span>Total approved</span>
    <b><?= (int) $data['totals']['approved'] ?></b>
    <small>Available for reporting</small>
  </div>
  <div class="kpi">
    <span>Matching report</span>
    <b><?= count($approved) ?></b>
    <small>Approved applicants matching the current filters</small>
  </div>
</div>

<section class="card report-builder">
  <h2>Build an approved-applicant report</h2>
  <form method="get" class="report-builder-form">
    <select name="district_id" aria-label="District">
      <option value="">All Hela districts</option>
      <?php foreach ($districts as $row): ?>
        <option value="<?= huef_h($row['id']) ?>"<?= huef_selected($row['id'], $districtId) ?>><?= huef_h($row['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <select name="institution_id" aria-label="Institution">
      <option value="">All institutions</option>
      <?php foreach ($institutions as $row): ?>
        <option value="<?= huef_h($row['id']) ?>"<?= huef_selected($row['id'], $institutionId) ?>><?= huef_h($row['code'] . ' · ' . $row['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn btn-green" type="submit">Apply filters</button>
    <button class="btn btn-print" type="submit" formaction="<?= huef_h(huef_url('coordinator/report.php')) ?>" formtarget="_blank" name="format" value="print">Print / Save PDF</button>
    <button class="btn btn-gold" type="submit" formaction="<?= huef_h(huef_url('coordinator/report.php')) ?>" name="format" value="csv">Download CSV</button>
  </form>
</section>

<div class="table-wrap card desk-card" style="margin-top:1rem">
  <table class="data-grid desk-table">
    <thead>
      <tr>
        <th>No.</th>
        <th>Approved applicant</th>
        <th>District / LLG</th>
        <th>Institution</th>
        <th>Programme / Year</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
    <?php foreach ($approved as $index => $row): ?>
      <tr>
        <td><?= (int) $index + 1 ?></td>
        <td>
          <strong><?= huef_h(huef_full_name($row)) ?></strong>
          <span class="sub"><?= huef_h($row['email']) ?></span>
          <span class="sub"><?= huef_h($row['phone']) ?></span>
        </td>
        <td>
          <strong><?= huef_h($row['district_name'] ?? '—') ?></strong>
          <span class="sub"><?= huef_h($row['llg_name'] ?? '—') ?></span>
        </td>
        <td><?= huef_h($row['institution_code'] . ' · ' . $row['institution_name']) ?></td>
        <td>
          <strong><?= huef_h($row['program_name']) ?></strong>
          <span class="sub"><?= huef_h($row['year_of_study']) ?></span>
        </td>
        <td><span class="badge <?= huef_status_class('APPROVED') ?>"><?= huef_h(huef_status_label('APPROVED')) ?></span></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$approved): ?>
      <tr><td colspan="6">No approved applicants match the selected district and institution.</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
</div>
<?php
huef_render($user, 'Reports', huef_capture());
