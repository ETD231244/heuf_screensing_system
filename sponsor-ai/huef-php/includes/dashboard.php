<?php

function huef_safe_lookup_id(string $id): ?string
{
    $id = trim($id);
    if ($id === '' || !preg_match('/^[A-Za-z0-9_-]{1,36}$/', $id)) {
        return null;
    }
    return $id;
}

function huef_approved_report_rows(?string $districtId = null, ?string $institutionId = null): array
{
    $sql = 'SELECT ap.id, ap.program_name, ap.year_of_study, ap.status, ap.screening_status, ap.submitted_at,
                   a.given_name, a.surname, a.phone, u.email,
                   i.code AS institution_code, i.name AS institution_name,
                   d.name AS district_name, l.name AS llg_name
            FROM applications ap
            JOIN applicants a ON a.id = ap.applicant_id
            JOIN users u ON u.id = a.user_id
            JOIN institutions i ON i.id = ap.institution_id
            LEFT JOIN districts d ON d.id = ap.district_id
            LEFT JOIN llgs l ON l.id = a.llg_id
            WHERE ap.status = "APPROVED"';
    $params = [];
    $districtId = $districtId ? huef_safe_lookup_id($districtId) : null;
    $institutionId = $institutionId ? huef_safe_lookup_id($institutionId) : null;
    if ($districtId) {
        $sql .= ' AND ap.district_id = ?';
        $params[] = $districtId;
    }
    if ($institutionId) {
        $sql .= ' AND ap.institution_id = ?';
        $params[] = $institutionId;
    }
    $sql .= ' ORDER BY i.name, a.surname, a.given_name';
    return huef_all($sql, $params);
}

function huef_coordinator_dashboard(): array
{
    $year = huef_current_period()['academic_year'] ?? '2026';
    $apps = huef_all(
        'SELECT ap.id, ap.status, ap.screening_status, ap.submitted_at, ap.program_name,
                a.given_name, a.surname,
                i.code AS institution_code, i.name AS institution_name,
                d.name AS district_name, l.name AS llg_name
         FROM applications ap
         JOIN applicants a ON a.id = ap.applicant_id
         JOIN institutions i ON i.id = ap.institution_id
         LEFT JOIN districts d ON d.id = ap.district_id
         LEFT JOIN llgs l ON l.id = a.llg_id
         WHERE ap.academic_year = ? AND ap.status <> "DRAFT"',
        [$year]
    );

    $totals = [
        'submitted' => count($apps),
        'awaiting' => 0,
        'flagged' => 0,
        'review' => 0,
        'incomplete' => 0,
        'approved' => 0,
        'rejected' => 0,
        'last7Days' => 0,
    ];
    $byStatus = [];
    $byScreening = [];
    $byDistrict = [];
    $byInstitution = [];
    $days = [];
    for ($i = 13; $i >= 0; $i--) {
        $key = date('Y-m-d', strtotime('-' . $i . ' days'));
        $days[$key] = ['date' => $key, 'label' => date('j M', strtotime($key)), 'count' => 0];
    }
    $cutoff = strtotime('-7 days');
    $queue = [];

    foreach ($apps as $app) {
        $byStatus[$app['status']] = ($byStatus[$app['status']] ?? 0) + 1;
        if ($app['status'] === 'PENDING' || $app['status'] === 'MORE_INFO') {
            $totals['awaiting']++;
        }
        if ($app['status'] === 'APPROVED') {
            $totals['approved']++;
        }
        if ($app['status'] === 'REJECTED') {
            $totals['rejected']++;
        }
        $screen = $app['screening_status'] ?: 'UNABLE_TO_DETERMINE';
        $byScreening[$screen] = ($byScreening[$screen] ?? 0) + 1;
        if ($screen && $screen !== 'PASSED_INITIAL') {
            $totals['flagged']++;
        }
        if ($screen === 'NEEDS_REVIEW') {
            $totals['review']++;
        }
        if ($screen === 'MISSING_REQUIRED') {
            $totals['incomplete']++;
        }
        $dist = $app['district_name'] ?: 'Not recorded';
        $byDistrict[$dist] = ($byDistrict[$dist] ?? 0) + 1;
        $code = $app['institution_code'];
        if (!isset($byInstitution[$code])) {
            $byInstitution[$code] = [
                'code' => $code,
                'name' => $app['institution_name'],
                'total' => 0,
                'pending' => 0,
                'approved' => 0,
                'rejected' => 0,
                'moreInfo' => 0,
                'flagged' => 0,
            ];
        }
        $byInstitution[$code]['total']++;
        if ($app['status'] === 'PENDING') {
            $byInstitution[$code]['pending']++;
        }
        if ($app['status'] === 'APPROVED') {
            $byInstitution[$code]['approved']++;
        }
        if ($app['status'] === 'REJECTED') {
            $byInstitution[$code]['rejected']++;
        }
        if ($app['status'] === 'MORE_INFO') {
            $byInstitution[$code]['moreInfo']++;
        }
        if ($screen && $screen !== 'PASSED_INITIAL') {
            $byInstitution[$code]['flagged']++;
        }
        if ($app['submitted_at']) {
            $day = substr($app['submitted_at'], 0, 10);
            if (isset($days[$day])) {
                $days[$day]['count']++;
            }
            if (strtotime($app['submitted_at']) >= $cutoff) {
                $totals['last7Days']++;
            }
        }
        if (in_array($app['status'], ['PENDING', 'MORE_INFO'], true)) {
            $queue[] = [
                'id' => $app['id'],
                'name' => huef_full_name($app),
                'district' => $dist,
                'llg' => $app['llg_name'] ?: '—',
                'institution' => $app['institution_code'] . ' ' . $app['institution_name'],
                'program' => $app['program_name'],
                'status' => $app['status'],
                'statusLabel' => huef_status_label($app['status']),
                'screening' => $screen,
                'screeningLabel' => huef_screening_label($app['screening_status']),
                'submittedAt' => $app['submitted_at'],
                'submittedLabel' => huef_dt($app['submitted_at']),
                'href' => huef_url('coordinator/application.php?id=' . urlencode($app['id'])),
            ];
        }
    }

    usort($queue, fn ($a, $b) => strcmp($a['submittedAt'] ?? '', $b['submittedAt'] ?? ''));
    $queue = array_slice($queue, 0, 12);

    $named = function (array $counts, callable $labelFn) {
        $out = [];
        foreach ($counts as $k => $c) {
            $out[] = ['key' => $k, 'label' => $labelFn($k), 'count' => $c];
        }
        usort($out, fn ($a, $b) => $b['count'] <=> $a['count']);
        return $out;
    };

    $instRows = array_values($byInstitution);
    usort($instRows, fn ($a, $b) => $b['total'] <=> $a['total']);

    return [
        'generatedAt' => date('d M Y, H:i:s'),
        'totals' => $totals,
        'byStatus' => $named($byStatus, 'huef_status_label'),
        'byScreening' => $named($byScreening, 'huef_screening_label'),
        'byDistrict' => $named($byDistrict, fn ($k) => $k),
        'byInstitution' => array_slice($instRows, 0, 12),
        'submissionsByDay' => array_values($days),
        'attentionQueue' => $queue,
    ];
}
