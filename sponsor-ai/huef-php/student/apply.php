<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['STUDENT']);
$applicant = huef_one('SELECT * FROM applicants WHERE user_id = ?', [$user['id']]);
if (!$applicant) {
    huef_redirect('student/profile.php');
}
$year = huef_current_period()['academic_year'] ?? '2026';
$application = huef_one(
    'SELECT * FROM applications WHERE applicant_id = ? AND academic_year = ? ORDER BY created_at DESC',
    [$applicant['id'], $year]
);
if ($application && !in_array($application['status'], ['DRAFT', 'MORE_INFO'], true)) {
    huef_flash('ok', 'This application has already been lodged. Track it from your dashboard.');
    huef_redirect('student/index.php');
}

$institutions = huef_all('SELECT * FROM institutions WHERE is_active = 1 ORDER BY code');
$programs = huef_all('SELECT * FROM programs WHERE is_active = 1 ORDER BY name');
$docTypes = huef_document_types();
$error = '';

function huef_student_save_application(array $applicant, ?array $application, string $year): string
{
    $fields = [
        'institution_id' => huef_post('institution_id'),
        'district_id' => $applicant['district_id'],
        'academic_year' => $year,
        'program_name' => huef_post('program_name') ?: 'To be confirmed',
        'study_type' => huef_post('study_type') ?: null,
        'study_level' => huef_post('study_level') ?: 'UNDERGRADUATE',
        'year_of_study' => huef_post('year_of_study') ?: 'Not stated',
        'expected_completion' => huef_post('expected_completion') ?: null,
        'institution_province' => huef_post('institution_province') ?: null,
        'registrar_phone' => huef_post('registrar_phone') ?: null,
        'registrar_email' => huef_post('registrar_email') ?: null,
        'applicant_type' => huef_post('applicant_type') ?: 'NEW_INTAKE',
        'last_secondary_school' => huef_post('last_secondary_school') ?: null,
        'year_completed' => huef_post('year_completed') ?: null,
        'fee_category' => huef_post('fee_category') ?: 'HUEF_TFA',
        'other_fee_type' => huef_post('other_fee_type') ?: null,
        'tuition_fees' => huef_post('tuition_fees') ?: null,
        'account_name' => huef_post('account_name') ?: null,
        'account_number' => huef_post('account_number') ?: null,
        'bank_name' => huef_post('bank_name') ?: null,
        'bank_branch' => huef_post('bank_branch') ?: null,
        'witness_name' => huef_post('witness_name') ?: null,
        'witness_title' => huef_post('witness_title') ?: null,
        'witness_village' => huef_post('witness_village') ?: null,
        'witness_district' => huef_post('witness_district') ?: null,
        'witness_phone' => huef_post('witness_phone') ?: null,
    ];
    if (!$fields['institution_id']) {
        throw new RuntimeException('Choose an institution.');
    }
    if ($application) {
        huef_update('applications', $fields, 'id = :id', ['id' => $application['id']]);
        return $application['id'];
    }
    $fields['id'] = huef_id('appl');
    $fields['applicant_id'] = $applicant['id'];
    $fields['status'] = 'DRAFT';
    return huef_insert('applications', $fields);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $action = huef_post('action');
    try {
        $id = huef_student_save_application($applicant, $application, $year);
        $application = huef_one('SELECT * FROM applications WHERE id = ?', [$id]);

        if ($action === 'upload' && !empty($_FILES['document']['name'])) {
            $type = huef_post('doc_type');
            $allowed = array_column($docTypes, 'code');
            if (!in_array($type, $allowed, true)) {
                throw new RuntimeException('Unknown document type.');
            }
            $saved = huef_save_upload($_FILES['document'], 'applications/' . $id);
            if (!$saved) {
                throw new RuntimeException('Choose a file to upload.');
            }
            huef_query(
                'UPDATE documents SET is_current = 0, superseded_at = NOW() WHERE application_id = ? AND type = ? AND is_current = 1',
                [$id, $type]
            );
            huef_insert('documents', [
                'id' => huef_id('docu'),
                'application_id' => $id,
                'type' => $type,
                'original_name' => $saved['original_name'],
                'stored_path' => $saved['path'],
                'mime_type' => $saved['mime'],
                'size_bytes' => $saved['size'],
            ]);
            huef_flash('ok', huef_doc_label($type) . ' uploaded.');
            huef_redirect('student/apply.php');
        }

        if ($action === 'submit') {
            if (huef_post('declare') !== '1') {
                throw new RuntimeException('Tick the declaration before lodging.');
            }
            $required = huef_required_docs($application['applicant_type'], $applicant['eligibility_path'], $docTypes);
            $have = array_column(
                huef_all('SELECT type FROM documents WHERE application_id = ? AND is_current = 1', [$id]),
                'type'
            );
            $missing = array_diff($required, $have);
            if ($missing) {
                throw new RuntimeException('Attach every required document before lodging: ' . implode(', ', array_map('huef_doc_label', $missing)));
            }
            huef_update('applications', [
                'status' => 'PENDING',
                'submitted_at' => date('Y-m-d H:i:s'),
                'declared_at' => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $id]);
            huef_screen_application($id, $user['email'], true);
            huef_audit('application_submit', 'application', $id, null, $id);
            $coords = huef_all("SELECT id FROM users WHERE role IN ('COORDINATOR','ADMIN') AND is_active = 1");
            foreach ($coords as $c) {
                huef_notify($c['id'], 'New 2026 application', huef_full_name($applicant) . ' lodged a file for review.', $user['id'], $id, 'INFO', 'APPLICATION');
            }
            huef_notify($user['id'], 'Application lodged', 'Your 2026 TFA application was received. You will be notified when an officer records a decision.', null, $id);
            huef_flash('ok', 'Application lodged. Preliminary screening has run. A HUEF officer will decide.');
            huef_redirect('student/index.php');
        }

        huef_flash('ok', 'Draft saved.');
        huef_redirect('student/apply.php');
    } catch (Throwable $e) {
        $error = $e->getMessage();
        if (!$application) {
            $application = $_POST;
        } else {
            $application = array_merge($application, $_POST);
        }
    }
}

$docs = $application
    ? huef_all('SELECT * FROM documents WHERE application_id = ? AND is_current = 1 ORDER BY uploaded_at', [$application['id'] ?? ''])
    : [];
$haveTypes = array_column($docs, 'type');
$applicantType = $application['applicant_type'] ?? 'NEW_INTAKE';
$required = huef_required_docs($applicantType, $applicant['eligibility_path'], $docTypes);
$a = $application ?: [];

huef_start();
?>
<p class="tiny">2026 HUEF application form</p>
<h1 style="margin:0.2rem 0 0.4rem;color:var(--huef-green-dark)">Tuition Fee Assistance</h1>
<p class="muted">Fill the sections in order. Use BLOCK LETTERS. You can save a draft and come back. The form will not submit until every required document is attached.</p>
<?php if ($error): ?><div class="alert alert-bad"><?= huef_h($error) ?></div><?php endif; ?>

<form method="post" enctype="multipart/form-data" class="card" data-wizard>
  <?= huef_csrf_field() ?>
  <div class="steps">
    <button type="button">1. Study</button>
    <button type="button">2. Fees &amp; bank</button>
    <button type="button">3. Witness</button>
    <button type="button">4. Documents</button>
  </div>

  <div class="wizard-panel">
    <div class="form-grid form-2">
      <div>
        <label>Applicant type</label>
        <select name="applicant_type">
          <option value="NEW_INTAKE"<?= huef_selected('NEW_INTAKE', $a['applicant_type'] ?? '') ?>>New intake</option>
          <option value="CONTINUING"<?= huef_selected('CONTINUING', $a['applicant_type'] ?? '') ?>>Continuing student</option>
        </select>
      </div>
      <div>
        <label>Institution</label>
        <select name="institution_id" id="institution_id" required>
          <option value="">Select</option>
          <?php foreach ($institutions as $inst): ?>
            <option value="<?= huef_h($inst['id']) ?>"<?= huef_selected($inst['id'], $a['institution_id'] ?? '') ?>>
              <?= huef_h($inst['code'] . ' — ' . $inst['name']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label>Programme</label>
        <input name="program_name" id="program_name" list="program-list" value="<?= huef_h($a['program_name'] ?? '') ?>">
        <datalist id="program-list">
          <?php foreach ($programs as $p): ?>
            <option value="<?= huef_h($p['name']) ?>">
          <?php endforeach; ?>
        </datalist>
      </div>
      <div>
        <label>Study type</label>
        <input name="study_type" value="<?= huef_h($a['study_type'] ?? 'Full time') ?>">
      </div>
      <div>
        <label>Study level</label>
        <select name="study_level">
          <?php foreach (['UNDERGRADUATE','POSTGRADUATE','NATIONAL_HIGH_SCHOOL','OVERSEAS'] as $lv): ?>
            <option value="<?= $lv ?>"<?= huef_selected($lv, $a['study_level'] ?? 'UNDERGRADUATE') ?>><?= huef_h(huef_study_level_label($lv)) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label>Year of study</label>
        <select name="year_of_study">
          <?php foreach (['1st year','2nd year','3rd year','4th year','5th year / final','Grade 11','Grade 12','Postgraduate'] as $y): ?>
            <option<?= huef_selected($y, $a['year_of_study'] ?? '') ?>><?= huef_h($y) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div><label>Expected completion</label><input name="expected_completion" value="<?= huef_h($a['expected_completion'] ?? '') ?>"></div>
      <div><label>Institution province</label><input name="institution_province" value="<?= huef_h($a['institution_province'] ?? '') ?>"></div>
      <div><label>Registrar phone</label><input name="registrar_phone" value="<?= huef_h($a['registrar_phone'] ?? '') ?>"></div>
      <div><label>Registrar email</label><input name="registrar_email" value="<?= huef_h($a['registrar_email'] ?? '') ?>"></div>
      <div><label>Last secondary school</label><input name="last_secondary_school" value="<?= huef_h($a['last_secondary_school'] ?? '') ?>"></div>
      <div><label>Year completed</label><input name="year_completed" value="<?= huef_h($a['year_completed'] ?? '') ?>"></div>
    </div>
    <p class="btn-row" style="margin-top:1rem">
      <button class="btn btn-outline" type="submit" name="action" value="save" style="color:var(--huef-green)">Save draft</button>
      <button class="btn btn-green" type="button" data-next="1">Next</button>
    </p>
  </div>

  <div class="wizard-panel">
    <div class="form-grid form-2">
      <div>
        <label>Fee category</label>
        <select name="fee_category">
          <?php foreach (['HUEF_TFA','SELF_SPONSOR','CORPORATE','HECAS_TESA','OTHER'] as $fc): ?>
            <option value="<?= $fc ?>"<?= huef_selected($fc, $a['fee_category'] ?? 'HUEF_TFA') ?>><?= huef_h(huef_fee_label($fc)) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div><label>Other fee type</label><input name="other_fee_type" value="<?= huef_h($a['other_fee_type'] ?? '') ?>"></div>
      <div><label>2026 tuition fees (Kina)</label><input name="tuition_fees" value="<?= huef_h($a['tuition_fees'] ?? '') ?>"></div>
      <div><label>Account name</label><input name="account_name" value="<?= huef_h($a['account_name'] ?? '') ?>"></div>
      <div><label>Account number</label><input name="account_number" value="<?= huef_h($a['account_number'] ?? '') ?>"></div>
      <div><label>Bank</label><input name="bank_name" value="<?= huef_h($a['bank_name'] ?? '') ?>"></div>
      <div><label>Branch</label><input name="bank_branch" value="<?= huef_h($a['bank_branch'] ?? '') ?>"></div>
    </div>
    <p class="btn-row" style="margin-top:1rem">
      <button class="btn btn-outline" type="button" data-next="0" style="color:var(--huef-green)">Back</button>
      <button class="btn btn-green" type="button" data-next="2">Next</button>
    </p>
  </div>

  <div class="wizard-panel">
    <p class="muted">A ward councillor, pastor, or community leader should verify the applicant.</p>
    <div class="form-grid form-2">
      <div><label>Witness name</label><input name="witness_name" value="<?= huef_h($a['witness_name'] ?? '') ?>"></div>
      <div><label>Title</label><input name="witness_title" value="<?= huef_h($a['witness_title'] ?? '') ?>"></div>
      <div><label>Village</label><input name="witness_village" value="<?= huef_h($a['witness_village'] ?? '') ?>"></div>
      <div><label>District</label><input name="witness_district" value="<?= huef_h($a['witness_district'] ?? '') ?>"></div>
      <div><label>Phone</label><input name="witness_phone" value="<?= huef_h($a['witness_phone'] ?? '') ?>"></div>
    </div>
    <p class="btn-row" style="margin-top:1rem">
      <button class="btn btn-outline" type="button" data-next="1" style="color:var(--huef-green)">Back</button>
      <button class="btn btn-green" type="button" data-next="3">Next</button>
    </p>
  </div>

  <div class="wizard-panel">
    <p>Required for this applicant:
      <?php foreach ($required as $code): ?>
        <span class="badge <?= in_array($code, $haveTypes, true) ? 'badge-ok' : 'badge-warn' ?>"><?= huef_h(huef_doc_label($code)) ?></span>
      <?php endforeach; ?>
    </p>
    <div class="form-grid form-2">
      <div>
        <label>Document type</label>
        <select name="doc_type">
          <?php foreach ($docTypes as $dt): ?>
            <option value="<?= huef_h($dt['code']) ?>"><?= huef_h($dt['label']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label>File (PDF, JPG, PNG — max 5 MB)</label>
        <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png,.webp">
      </div>
    </div>
    <p><button class="btn btn-outline" type="submit" name="action" value="upload" style="color:var(--huef-green)">Upload file</button></p>
    <?php if ($docs): ?>
      <ul class="doc-list">
        <?php foreach ($docs as $doc): ?>
          <li>
            <span><?= huef_h(huef_doc_label($doc['type'])) ?><br><small class="muted"><?= huef_h($doc['original_name']) ?> · <?= huef_h(huef_file_size((int) $doc['size_bytes'])) ?></small></span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
    <label style="margin-top:1rem;font-weight:500">
      <input type="checkbox" name="declare" value="1" style="width:auto">
      I declare that the information and documents are true. I understand that a false statement can stop this application.
    </label>
    <p class="btn-row" style="margin-top:1rem">
      <button class="btn btn-outline" type="submit" name="action" value="save" style="color:var(--huef-green)">Save draft</button>
      <button class="btn btn-gold" type="submit" name="action" value="submit">Lodge application</button>
    </p>
  </div>
</form>
<script>window.HUEF_PROGRAMS = <?= json_encode($programs) ?>;</script>
<?php
huef_render($user, 'Application', huef_capture());
