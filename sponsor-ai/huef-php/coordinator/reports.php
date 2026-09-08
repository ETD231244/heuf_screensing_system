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
<p class="tiny">Approved sponsorship records</p>
<h1 style="margin:0.2rem 0 0.4rem;color:var(--huef-green-dark)">Reports</h1>
<p class="muted">Filter <strong>approved</strong> applicants by the Hela district and institution they applied from, then print the report or download CSV. Pending, rejected, draft, and more-information files never appear here.</p>

<div class="grid grid-3" style="margin:1rem 0">
  <div class="kpi">Total submitted<b><?= (int) $data['totals']['submitted'] ?></b><span class="muted">All lodged applications</span></div>
  <div class="kpi">Total approved<b><?= (int) $data['totals']['approved'] ?></b><span class="muted">Available for reporting</span></div>
  <div class="kpi">Matching report<b><?= count($approved) ?></b><span class="muted">Approved applicants matching the filters</span></div>
</div>

<form method="get" class="card coord-filter-panel">
  <div>
    <label for="district_id">District applied from</label>
    <select id="district_id" name="district_id">
      <option value="">All Hela districts</option>
      <?php foreach ($districts as $row): ?>
        <option value="<?= huef_h($row['id']) ?>"<?= huef_selected($row['id'], $districtId) ?>><?= huef_h($row['name']) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div>
    <label for="institution_id">Institution applied to</label>
    <select id="institution_id" name="institution_id">
      <option value="">All institutions</option>
      <?php foreach ($institutions as $row): ?>
        <option value="<?= huef_h($row['id']) ?>"<?= huef_selected($row['id'], $institutionId) ?>><?= huef_h($row['code'] . ' · ' . $row['name']) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="btn-row" style="align-self:end">
    <button class="btn btn-green" type="submit">Apply filters</button>
    <a class="btn btn-outline" style="color:var(--huef-green)" href="<?= huef_h(huef_url('coordinator/reports.php')) ?>">Clear filters</a>
    <button class="btn btn-outline-dark" type="submit" formaction="<?= huef_h(huef_url('coordinator/report.php')) ?>" formtarget="_blank" name="format" value="print">Print / Save PDF</button>
    <button class="btn btn-gold" type="submit" formaction="<?= huef_h(huef_url('coordinator/report.php')) ?>" name="format" value="csv">Download CSV</button>
  </div>
</form>

<div class="table-wrap card" style="margin-top:1rem;padding:0">
  <table class="data-grid">
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
          <div class="muted"><?= huef_h($row['email']) ?> · <?= huef_h($row['phone']) ?></div>
        </td>
        <td><?= huef_h($row['district_name'] ?? '—') ?><div class="muted"><?= huef_h($row['llg_name'] ?? '—') ?></div></td>
        <td><?= huef_h($row['institution_code'] . ' · ' . $row['institution_name']) ?></td>
        <td><?= huef_h($row['program_name']) ?><div class="muted"><?= huef_h($row['year_of_study']) ?></div></td>
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
