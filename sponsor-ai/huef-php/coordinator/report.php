<?php
require dirname(__DIR__) . '/includes/bootstrap.php';

$user = huef_require_role(['COORDINATOR', 'ADMIN']);

$districtId = huef_safe_lookup_id((string) ($_GET['district_id'] ?? '')) ?? '';
$institutionId = huef_safe_lookup_id((string) ($_GET['institution_id'] ?? '')) ?? '';
$format = strtolower(trim((string) ($_GET['format'] ?? 'print')));

$rows = huef_approved_report_rows($districtId ?: null, $institutionId ?: null);

$institutionName = 'All institutions';
if ($institutionId !== '') {
    $institution = huef_one('SELECT code, name FROM institutions WHERE id = ?', [$institutionId]);
    if ($institution) {
        $institutionName = $institution['code'] . ' · ' . $institution['name'];
    }
}

$districtName = 'All districts';
if ($districtId !== '') {
    $district = huef_one('SELECT name FROM districts WHERE id = ?', [$districtId]);
    if ($district) {
        $districtName = $district['name'];
    }
}

function huef_report_csv_safe($value): string
{
    $value = (string) $value;
    if ($value !== '' && preg_match('/^[=+\-@]/', $value)) {
        return "'" . $value;
    }
    return $value;
}

if ($format === 'csv') {
    $filename = 'HUEF-approved-applicants-' . date('Y-m-d-His') . '.csv';
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('X-Content-Type-Options: nosniff');
    $output = fopen('php://output', 'wb');
    fwrite($output, "\xEF\xBB\xBF");
    fputcsv($output, [
        'No.',
        'Applicant',
        'Email',
        'Phone',
        'District',
        'LLG',
        'Institution',
        'Programme',
        'Year level',
        'Status',
        'AI screening',
        'Submitted',
    ]);
    foreach ($rows as $index => $row) {
        fputcsv($output, array_map('huef_report_csv_safe', [
            $index + 1,
            huef_full_name($row),
            $row['email'],
            $row['phone'],
            $row['district_name'] ?? '',
            $row['llg_name'] ?? '',
            $row['institution_code'] . ' · ' . $row['institution_name'],
            $row['program_name'],
            $row['year_of_study'],
            huef_status_label('APPROVED'),
            huef_screening_label($row['screening_status']),
            huef_dt($row['submitted_at']),
        ]));
    }
    fclose($output);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HUEF Approved Applicant Report</title>
  <style>
    :root {
      --green: #0b4d2c;
      --green-dark: #07351f;
      --gold: #f0c000;
      --cream: #f7f3e8;
      --ink: #172019;
      --line: #d9d3c5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--cream);
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.45;
    }
    .report {
      width: min(1200px, calc(100% - 32px));
      margin: 24px auto;
      padding: 28px;
      background: #fff;
      box-shadow: 0 10px 35px rgba(0,0,0,.08);
    }
    .report-header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 18px;
      border-bottom: 4px solid var(--gold);
    }
    .emblem {
      width: 76px; height: 76px; border-radius: 999px; flex-shrink: 0;
      background:
        radial-gradient(circle at 50% 42%, #fff 0 18%, transparent 19%),
        conic-gradient(from 210deg, #c41e3a, #f0c000, #0b4d2c, #c41e3a);
      border: 3px solid var(--green);
    }
    .report-header h1 { margin: 0; color: var(--green); font-size: 26px; }
    .report-header p { margin: 3px 0; }
    .report-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .report-actions button {
      padding: 11px 17px; border: 0; border-radius: 6px; cursor: pointer; font: inherit; font-weight: 700;
    }
    .print-button { color: #fff; background: var(--green); }
    .close-button { color: #222; background: #eee; }
    .report-filters {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
      margin: 16px 0; padding: 14px; background: #f8f5ec; border: 1px solid var(--line);
    }
    .report-filters strong { display: block; margin-bottom: 3px; color: var(--green); }
    .report-summary { margin: 14px 0; font-weight: 700; }
    .table-wrap { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 9px 7px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: #fff; background: var(--green); }
    tbody tr:nth-child(even) { background: #faf8f2; }
    .empty-report { padding: 30px; text-align: center; }
    .report-signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 55px; }
    .report-signatures div { width: 280px; padding-top: 7px; border-top: 1px solid #333; }
    @media (max-width: 760px) {
      .report { width: 100%; margin: 0; padding: 14px; }
      .report-filters { grid-template-columns: 1fr; }
    }
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { background: #fff; }
      .report { width: 100%; margin: 0; padding: 0; box-shadow: none; }
      .report-actions { display: none; }
      .report-header h1 { font-size: 20px; }
      table { font-size: 9px; }
      th, td { padding: 5px; }
      .report-signatures { break-inside: avoid; }
    }
  </style>
</head>
<body>
<main class="report">
  <header class="report-header">
    <span class="emblem" aria-hidden="true"></span>
    <div>
      <h1>HUEF 2026 Approved Applicant Report</h1>
      <p>Hela Undialu Education Foundation · Tuition Fee Assistance</p>
      <p>Generated: <?= huef_h(date('d M Y, g:i a')) ?> · Prepared by <?= huef_h($user['email']) ?></p>
    </div>
  </header>

  <div class="report-actions">
    <button class="print-button" type="button" onclick="window.print()">Print / Save as PDF</button>
    <button class="close-button" type="button" onclick="window.close()">Close report</button>
  </div>

  <section class="report-filters">
    <div><strong>Institution</strong><?= huef_h($institutionName) ?></div>
    <div><strong>District</strong><?= huef_h($districtName) ?></div>
    <div><strong>Included records</strong>Coordinator-approved applicants only</div>
  </section>

  <p class="report-summary">Total matching approved applicants: <?= count($rows) ?></p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>Applicant</th>
          <th>Contact</th>
          <th>District / LLG</th>
          <th>Institution</th>
          <th>Programme / Year</th>
          <th>Status</th>
          <th>AI screening</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($rows as $index => $row): ?>
          <tr>
            <td><?= (int) $index + 1 ?></td>
            <td><?= huef_h(huef_full_name($row)) ?></td>
            <td><?= huef_h($row['email']) ?><br><?= huef_h($row['phone']) ?></td>
            <td><?= huef_h($row['district_name'] ?? '—') ?><br><?= huef_h($row['llg_name'] ?? '—') ?></td>
            <td><?= huef_h($row['institution_code'] . ' · ' . $row['institution_name']) ?></td>
            <td><?= huef_h($row['program_name']) ?><br><?= huef_h($row['year_of_study']) ?></td>
            <td><?= huef_h(huef_status_label('APPROVED')) ?></td>
            <td><?= huef_h(huef_screening_label($row['screening_status'])) ?></td>
            <td><?= huef_h(huef_dt($row['submitted_at'])) ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?>
          <tr><td class="empty-report" colspan="9">No approved applicants match the selected district and institution.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <section class="report-signatures">
    <div>Prepared by / Date</div>
    <div>Coordinator approval / Date</div>
  </section>
</main>
</body>
</html>
