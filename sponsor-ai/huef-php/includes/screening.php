<?php

function huef_document_types(): array
{
    return huef_all('SELECT * FROM document_types WHERE is_active = 1 ORDER BY code');
}

function huef_required_docs(string $applicantType, string $eligibilityPath, ?array $types = null): array
{
    $types = $types ?? huef_document_types();
    if ($types) {
        $codes = [];
        foreach ($types as $type) {
            $forThis = $applicantType === 'CONTINUING'
                ? (int) $type['required_for_continuing']
                : (int) $type['required_for_new'];
            if ($forThis) {
                $codes[] = $type['code'];
            } elseif ($eligibilityPath !== 'HELA_ORIGIN' && (int) $type['required_for_non_hela']) {
                $codes[] = $type['code'];
            }
        }
        return $codes;
    }
    $docs = $applicantType === 'CONTINUING'
        ? ['PASSPORT_PHOTO', 'CONFIRMATION_LETTER', 'FEE_STRUCTURE', 'TRANSCRIPT', 'STUDENT_ID']
        : ['PASSPORT_PHOTO', 'ACCEPTANCE_LETTER', 'GRADE_10', 'GRADE_12', 'FEE_STRUCTURE'];
    if ($eligibilityPath !== 'HELA_ORIGIN') {
        $docs[] = 'SUPPORT_LETTER';
    }
    return $docs;
}

function huef_scan_document(array $doc): array
{
    $name = strtolower($doc['original_name'] ?? '');
    $type = $doc['type'];
    $size = (int) ($doc['size_bytes'] ?? 0);
    $hints = [
        'PASSPORT_PHOTO' => '/photo|passport|portrait|headshot|jpg|jpeg|png/',
        'ACCEPTANCE_LETTER' => '/offer|admission|acceptance|enrol/',
        'GRADE_10' => '/grade.?10|gr.?10|certificate|result/',
        'GRADE_12' => '/grade.?12|gr.?12|certificate|result/',
        'FEE_STRUCTURE' => '/fee|invoice|structure|tuition/',
        'CONFIRMATION_LETTER' => '/confirm|enrol|year/',
        'TRANSCRIPT' => '/transcript|result|grade|academic/',
        'STUDENT_ID' => '/id|student|card/',
        'SUPPORT_LETTER' => '/support|letter|sponsor/',
    ];
    if ($size < 8000) {
        return [
            'type' => $type,
            'status' => 'UNREADABLE_DOCUMENT',
            'title' => 'File looks too small',
            'reason' => huef_doc_label($type) . ' is unusually small. Confirm it is a real scan, not an empty page.',
        ];
    }
    $pattern = $hints[$type] ?? null;
    if ($pattern && !preg_match($pattern, $name)) {
        return [
            'type' => $type,
            'status' => 'NEEDS_REVIEW',
            'title' => 'Filename does not match the document type',
            'reason' => 'The file name "' . $doc['original_name'] . '" does not clearly describe ' . huef_doc_label($type) . '. An officer should open it.',
        ];
    }
    return [
        'type' => $type,
        'status' => 'PASSED_INITIAL',
        'title' => 'Attached',
        'reason' => $doc['original_name'] . ' (' . huef_file_size($size) . ').',
    ];
}

function huef_worst_doc_status(array $statuses): ?string
{
    $order = [
        'MISSING_REQUIRED' => 70,
        'UNREADABLE_DOCUMENT' => 60,
        'INCORRECT_DOCUMENT' => 55,
        'INFORMATION_MISMATCH' => 50,
        'POTENTIAL_DUPLICATE' => 40,
        'NEEDS_REVIEW' => 30,
        'UNABLE_TO_DETERMINE' => 20,
        'PASSED_INITIAL' => 10,
    ];
    $worst = null;
    $score = 0;
    foreach ($statuses as $status) {
        $n = $order[$status] ?? 0;
        if ($n > $score) {
            $score = $n;
            $worst = $status;
        }
    }
    return $worst;
}

function huef_screen_application(string $applicationId, string $runBy, bool $llm = false): array
{
    $app = huef_one(
        'SELECT ap.*, a.given_name, a.surname, a.date_of_birth, a.gender, a.phone,
                a.ward_village, a.clan_name, a.photo_mime, a.district_id, a.llg_id,
                a.eligibility_path, a.public_servant_years, a.user_id,
                u.email,
                i.name AS institution_name, i.code AS institution_code,
                d.name AS district_name, l.name AS llg_name
         FROM applications ap
         JOIN applicants a ON a.id = ap.applicant_id
         JOIN users u ON u.id = a.user_id
         JOIN institutions i ON i.id = ap.institution_id
         LEFT JOIN districts d ON d.id = a.district_id
         LEFT JOIN llgs l ON l.id = a.llg_id
         WHERE ap.id = ?',
        [$applicationId]
    );
    if (!$app) {
        throw new RuntimeException('Application not found.');
    }

    $docs = huef_all(
        'SELECT * FROM documents WHERE application_id = ? AND is_current = 1',
        [$applicationId]
    );
    $present = array_column($docs, 'type');
    $types = huef_document_types();
    $required = huef_required_docs($app['applicant_type'], $app['eligibility_path'], $types);
    $missing = array_values(array_diff($required, $present));
    $findings = array_map('huef_scan_document', $docs);

    $helaDistricts = ['Tari-Pori', 'Komo-Hulia', 'Koroba-Lake Kopiago', 'Magarima'];
    $flags = [];
    $score = 100;
    $add = function (string $severity, string $code, string $title, string $detail) use (&$flags) {
        $flags[] = compact('severity', 'code', 'title', 'detail');
    };

    if (!$missing) {
        $add('pass', 'DOCS_COMPLETE', 'Supporting documents complete', 'All ' . count($required) . ' required files are attached.');
    } else {
        $score -= count($missing) * 12;
        $add('fail', 'DOCS_MISSING', 'Missing required documents', implode('; ', array_map(fn ($c) => huef_doc_label($c, $types), $missing)));
    }

    $helaOrigin = $app['eligibility_path'] === 'HELA_ORIGIN';
    $districtOk = in_array($app['district_name'], $helaDistricts, true);
    if ($helaOrigin && $districtOk) {
        $add('pass', 'HELA_DISTRICT', 'Hela district recorded', 'Applicant origin district is ' . $app['district_name'] . '.');
    } elseif ($helaOrigin && !$districtOk) {
        $score -= 20;
        $add('fail', 'DISTRICT_MISSING', 'Hela district not confirmed', 'Hela-origin applicants must name one of Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, or Magarima.');
    }

    if (!$helaOrigin) {
        $years = (int) ($app['public_servant_years'] ?? 0);
        if ($years >= 3) {
            $add('pass', 'PS_YEARS', 'Public servant service period meets the rule', $years . ' years of service in Hela recorded (minimum is 3).');
        } else {
            $score -= 25;
            $add('fail', 'PS_YEARS_SHORT', 'Public servant service under 3 years', 'Recorded service is ' . $years . ' year(s). HUEF requires more than three years in Hela.');
        }
        if (!in_array('SUPPORT_LETTER', $present, true)) {
            $add('warning', 'PS_SUPPORT', 'Support letter not attached', 'Applicants who are not of Hela origin should attach a parent or supervisor support letter.');
        }
    }

    if ($app['fee_category'] === 'CORPORATE') {
        $score -= 40;
        $add('fail', 'DOUBLE_DIP', 'Corporate sponsor declared', 'HUEF does not assist students who are already on a corporate sponsor. This is treated as double-dipping.');
    } else {
        $add('pass', 'FEE_CATEGORY', 'Fee category is eligible', huef_fee_label($app['fee_category']));
    }

    if (trim((string) $app['program_name']) === '' || trim((string) $app['year_of_study']) === '') {
        $score -= 10;
        $add('fail', 'STUDY_DETAILS', 'Programme details incomplete', 'Programme name and year of study are required.');
    }

    if (!trim((string) $app['witness_name'])) {
        $score -= 8;
        $add('warning', 'WITNESS', 'Community verification missing', 'A ward councillor, pastor, or community leader should be named on the declaration.');
    } else {
        $add('pass', 'WITNESS_OK', 'Community witness named', $app['witness_name']);
    }

    if (!trim((string) $app['tuition_fees'])) {
        $score -= 5;
        $add('warning', 'FEES', 'Tuition amount not stated', 'The 2026 invoice / fee structure amount helps the Coordinator assess the request.');
    }

    $others = huef_all(
        'SELECT ap.id, a.given_name, a.surname, a.phone, a.date_of_birth, u.email
         FROM applications ap
         JOIN applicants a ON a.id = ap.applicant_id
         JOIN users u ON u.id = a.user_id
         WHERE ap.academic_year = ? AND ap.id <> ? AND ap.status <> "DRAFT"',
        [$app['academic_year'], $applicationId]
    );
    $duplicates = [];
    $selfName = strtolower(preg_replace('/\s+/', ' ', huef_full_name($app)));
    $selfPhone = preg_replace('/\s+/', '', (string) $app['phone']);
    foreach ($others as $other) {
        $otherName = strtolower(preg_replace('/\s+/', ' ', huef_full_name($other)));
        if (strcasecmp($other['email'], $app['email']) === 0) {
            $duplicates[] = ['applicationId' => $other['id'], 'applicantName' => huef_full_name($other), 'reason' => 'Same email address'];
        } elseif ($otherName === $selfName && $app['date_of_birth'] && $app['date_of_birth'] === $other['date_of_birth']) {
            $duplicates[] = ['applicationId' => $other['id'], 'applicantName' => huef_full_name($other), 'reason' => 'Same full name and date of birth'];
        } elseif ($otherName === $selfName) {
            $duplicates[] = ['applicationId' => $other['id'], 'applicantName' => huef_full_name($other), 'reason' => 'Same full name'];
        } elseif ($selfPhone && $selfPhone === preg_replace('/\s+/', '', (string) $other['phone'])) {
            $duplicates[] = ['applicationId' => $other['id'], 'applicantName' => huef_full_name($other), 'reason' => 'Same contact number'];
        }
    }
    if ($duplicates) {
        $score -= min(25, count($duplicates) * 12);
        $add('warning', 'DUPLICATE', 'Possible duplicate application', implode('; ', array_map(fn ($d) => $d['applicantName'] . ' (' . $d['reason'] . ')', $duplicates)));
    } else {
        $add('pass', 'NO_DUPLICATE', 'No obvious duplicate', 'Name, phone, and email do not match another 2026 application.');
    }

    foreach ($findings as $finding) {
        $label = huef_doc_label($finding['type'], $types);
        if ($finding['status'] === 'PASSED_INITIAL') {
            $add('pass', 'DOC_' . $finding['type'], $label . ': ' . $finding['title'], $finding['reason']);
        } elseif (in_array($finding['status'], ['UNREADABLE_DOCUMENT', 'INCORRECT_DOCUMENT'], true)) {
            $score -= 14;
            $add('fail', 'DOC_' . $finding['type'], $label . ': ' . $finding['title'], $finding['reason']);
        } else {
            $score -= 8;
            $add('warning', 'DOC_' . $finding['type'], $label . ': ' . $finding['title'], $finding['reason']);
        }
    }

    $score = max(0, min(100, $score));
    $hasFail = (bool) array_filter($flags, fn ($f) => $f['severity'] === 'fail');
    if ($hasFail) {
        $recommendation = $score < 50 ? 'RECOMMEND_REJECT' : 'NEEDS_REVIEW';
    } elseif ($duplicates) {
        $recommendation = 'NEEDS_REVIEW';
    } else {
        $recommendation = $score >= 80 ? 'RECOMMEND_APPROVE' : 'NEEDS_REVIEW';
    }

    $docStatuses = $missing ? ['MISSING_REQUIRED'] : [];
    foreach ($findings as $finding) {
        $docStatuses[] = $finding['status'];
    }
    $overall = huef_worst_doc_status($docStatuses) ?? 'PASSED_INITIAL';
    if ($duplicates && in_array($overall, ['PASSED_INITIAL', 'UNABLE_TO_DETERMINE'], true)) {
        $overall = 'POTENTIAL_DUPLICATE';
    }
    if ($hasFail && $overall === 'PASSED_INITIAL') {
        $overall = 'NEEDS_REVIEW';
    }
    if ($recommendation === 'NEEDS_REVIEW' && $overall === 'PASSED_INITIAL') {
        $overall = 'NEEDS_REVIEW';
    }

    $summary = $recommendation === 'RECOMMEND_APPROVE'
        ? 'Preliminary result: ' . huef_screening_label($overall) . '. The file looks complete and eligible. A human officer must still read the documents before approving.'
        : ($recommendation === 'RECOMMEND_REJECT'
            ? 'Preliminary result: ' . huef_screening_label($overall) . '. The screening rules found a serious eligibility or completeness problem. The Coordinator should confirm before rejecting. AI does not make the award.'
            : 'Preliminary result: ' . huef_screening_label($overall) . '. The file needs a person to look at it. Flags are explained below; the final decision stays with the Coordinator.');

    $deepseek = null;
    if ($llm) {
        try {
            $brief = huef_deepseek_brief($app, $docs, $flags, $missing, $types);
            $deepseek = [
                'used' => true,
                'configured' => true,
                'model' => huef_setting('deepseek_model') ?: 'deepseek-v4-flash',
                'ranAt' => gmdate('c'),
                'brief' => $brief['summary'] ?? '',
                'remainingChecks' => $brief['remainingChecks'] ?? [],
                'draftApplicantNote' => $brief['draftApplicantNote'] ?? '',
                'suggestedDecision' => $brief['suggestedDecision'] ?? null,
            ];
            if (!empty($brief['summary'])) {
                $summary = $brief['summary'];
            }
            foreach ($brief['flags'] ?? [] as $f) {
                $add($f['severity'] ?? 'info', $f['code'] ?? 'LLM_FLAG', $f['title'] ?? 'DeepSeek note', $f['message'] ?? ($f['detail'] ?? ''));
            }
        } catch (Throwable $e) {
            $deepseek = [
                'used' => false,
                'configured' => huef_deepseek_key() !== '',
                'error' => $e->getMessage(),
            ];
        }
    }

    $result = [
        'score' => $score,
        'recommendation' => $recommendation,
        'overallStatus' => $overall,
        'summary' => $summary,
        'flags' => $flags,
        'missingDocuments' => $missing,
        'duplicates' => $duplicates,
        'documents' => $findings,
        'runAt' => gmdate('c'),
        'version' => 'HUEF PHP Screening Engine v1',
        'disclaimer' => 'This is a preliminary screening aid. HUEF officials make every award decision.',
        'deepseek' => $deepseek,
    ];

    huef_insert('screening_history', [
        'id' => huef_id('scrn'),
        'application_id' => $applicationId,
        'result_json' => json_encode($result),
        'overall_status' => $overall,
        'run_by' => $runBy,
    ]);

    huef_update('applications', [
        'screening_json' => json_encode($result),
        'screening_status' => $overall,
    ], 'id = :id', ['id' => $applicationId]);

    foreach ($docs as $doc) {
        $finding = null;
        foreach ($findings as $item) {
            if ($item['type'] === $doc['type']) {
                $finding = $item;
                break;
            }
        }
        if ($finding) {
            huef_update('documents', [
                'screening_status' => $finding['status'],
                'screening_json' => json_encode($finding),
            ], 'id = :id', ['id' => $doc['id']]);
        }
    }

    return $result;
}

function huef_recommendation_label(string $value): string
{
    if ($value === 'RECOMMEND_APPROVE') {
        return 'Recommend approve';
    }
    if ($value === 'RECOMMEND_REJECT') {
        return 'Recommend reject';
    }
    return 'Needs officer review';
}
