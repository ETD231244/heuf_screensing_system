<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['COORDINATOR', 'ADMIN']);
$id = (string) ($_GET['id'] ?? '');
$app = huef_one(
    'SELECT ap.*, a.given_name, a.surname, a.gender, a.date_of_birth, a.phone, a.clan_name, a.ward_village,
            a.eligibility_path, a.father_full_name, a.father_occupation, a.mother_full_name, a.mother_occupation,
            a.public_servant_who, a.public_servant_department, a.public_servant_years, a.photo_mime, a.user_id,
            a.student_id, a.llg_name,
            u.email,
            i.code AS institution_code, i.name AS institution_name,
            d.name AS district_name, l.name AS llg_lookup
     FROM applications ap
     JOIN applicants a ON a.id = ap.applicant_id
     JOIN users u ON u.id = a.user_id
     JOIN institutions i ON i.id = ap.institution_id
     LEFT JOIN districts d ON d.id = a.district_id
     LEFT JOIN llgs l ON l.id = a.llg_id
     WHERE ap.id = ?',
    [$id]
);
if (!$app || $app['status'] === 'DRAFT') {
    http_response_code(404);
    huef_start();
    echo '<div class="alert alert-bad">Application not found.</div>';
    huef_render($user, 'Application review', huef_capture());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $action = huef_post('action');
    if ($action === 'screen') {
        huef_screen_application($id, $user['email'], huef_post('llm') === '1');
        huef_flash('ok', 'Screening ran again. This is still only a brief for the officer.');
        huef_redirect('coordinator/application.php?id=' . urlencode($id));
    }
    if ($action === 'decide') {
        $status = huef_post('status');
        $note = huef_post('note');
        if (!in_array($status, ['APPROVED', 'REJECTED', 'MORE_INFO', 'PENDING'], true)) {
            huef_flash('error', 'Choose a valid decision.');
            huef_redirect('coordinator/application.php?id=' . urlencode($id));
        }
        $update = [
            'status' => $status,
            'status_note' => $note ?: null,
        ];
        if ($status === 'MORE_INFO') {
            $update['info_requested_at'] = date('Y-m-d H:i:s');
            $update['info_request_note'] = $note ?: null;
        }
        if (in_array($status, ['APPROVED', 'REJECTED'], true)) {
            $update['decided_at'] = date('Y-m-d H:i:s');
            $update['decided_by_email'] = $user['email'];
        }
        huef_update('applications', $update, 'id = :id', ['id' => $id]);
        huef_audit('application_decision', 'application', $id, ['status' => $status], $id);
        $titles = [
            'APPROVED' => 'Your HUEF application was approved',
            'REJECTED' => 'Your HUEF application was not successful',
            'MORE_INFO' => 'More information is needed on your HUEF application',
            'PENDING' => 'Your HUEF application is under review',
        ];
        huef_notify($app['user_id'], $titles[$status], $note ?: huef_status_label($status), $user['id'], $id, 'DECISION', 'APPLICATION');
        huef_flash('ok', 'Decision recorded. The applicant has been notified.');
        huef_redirect('coordinator/application.php?id=' . urlencode($id));
    }
}

$docs = huef_all('SELECT * FROM documents WHERE application_id = ? ORDER BY is_current DESC, uploaded_at DESC', [$id]);
$history = huef_all('SELECT * FROM screening_history WHERE application_id = ? ORDER BY created_at DESC LIMIT 8', [$id]);
$screening = $app['screening_json'] ? json_decode($app['screening_json'], true) : null;
$name = huef_full_name($app);

huef_start();
?>
<p><a href="<?= huef_h(huef_url('coordinator/index.php')) ?>">← All applications</a></p>
<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start">
  <div style="display:flex;gap:1rem">
    <?php if ($app['photo_mime']): ?>
      <img src="<?= huef_h(huef_url('api/photo.php?user=' . urlencode($app['user_id']))) ?>" alt="" width="72" height="72" style="border-radius:999px;object-fit:cover">
    <?php else: ?>
      <span class="emblem" style="width:72px;height:72px"></span>
    <?php endif; ?>
    <div>
      <h1 style="margin:0;color:var(--huef-green-dark)"><?= huef_h($name) ?></h1>
      <p class="muted"><?= huef_h($app['email']) ?> · <?= huef_h($app['phone']) ?> · <?= huef_h($app['institution_code'] . ' ' . $app['institution_name']) ?></p>
      <p class="muted"><?= huef_h($app['district_name'] ?? 'District not recorded') ?><?= $app['llg_lookup'] || $app['llg_name'] ? ' · ' . huef_h($app['llg_lookup'] ?: $app['llg_name']) : '' ?></p>
    </div>
  </div>
  <div>
    <span class="badge <?= huef_status_class($app['status']) ?>"><?= huef_h(huef_status_label($app['status'])) ?></span>
    <?php if ($app['screening_status']): ?>
      <div style="margin-top:0.4rem"><span class="badge badge-info"><?= huef_h(huef_screening_label($app['screening_status'])) ?></span></div>
    <?php endif; ?>
  </div>
</div>
<div class="alert alert-info">Open the applicant profile, uploaded documents, DeepSeek briefing, and screening history together. DeepSeek does not make the award.</div>

<div class="grid grid-2">
  <div>
    <div class="card">
      <h3>Applicant profile</h3>
      <div class="form-grid form-2">
        <p class="fact"><span>Gender</span><?= huef_h($app['gender'] === 'F' ? 'Female' : ($app['gender'] === 'M' ? 'Male' : $app['gender'])) ?></p>
        <p class="fact"><span>Date of birth</span><?= huef_h($app['date_of_birth'] ?: '—') ?></p>
        <p class="fact"><span>Clan / village</span><?= huef_h(trim($app['clan_name'] . ' · ' . $app['ward_village'], ' ·') ?: '—') ?></p>
        <p class="fact"><span>Eligibility</span><?= huef_h(huef_eligibility_label($app['eligibility_path'])) ?></p>
        <p class="fact"><span>Father</span><?= huef_h(trim($app['father_full_name'] . ' — ' . $app['father_occupation'], ' —') ?: '—') ?></p>
        <p class="fact"><span>Mother</span><?= huef_h(trim($app['mother_full_name'] . ' — ' . $app['mother_occupation'], ' —') ?: '—') ?></p>
      </div>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Study and fees</h3>
      <div class="form-grid form-2">
        <p class="fact"><span>Type</span><?= huef_h($app['applicant_type'] === 'CONTINUING' ? 'Continuing' : 'New intake') ?></p>
        <p class="fact"><span>Programme</span><?= huef_h($app['program_name']) ?></p>
        <p class="fact"><span>Level</span><?= huef_h(huef_study_level_label($app['study_level'])) ?></p>
        <p class="fact"><span>Year</span><?= huef_h($app['year_of_study']) ?></p>
        <p class="fact"><span>Fee category</span><?= huef_h(huef_fee_label($app['fee_category'])) ?></p>
        <p class="fact"><span>Tuition</span><?= huef_h($app['tuition_fees'] ? 'K' . $app['tuition_fees'] : '—') ?></p>
        <p class="fact"><span>Witness</span><?= huef_h($app['witness_name'] ?: '—') ?></p>
        <p class="fact"><span>Bank</span><?= huef_h(trim($app['bank_name'] . ' ' . $app['account_number']) ?: '—') ?></p>
      </div>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Documents</h3>
      <ul class="doc-list">
        <?php foreach ($docs as $doc): ?>
          <li>
            <span><?= huef_h(huef_doc_label($doc['type'])) ?>
              <?= (int) $doc['is_current'] ? '' : ' <em class="muted">(superseded)</em>' ?><br>
              <small class="muted"><?= huef_h($doc['original_name']) ?> · <?= huef_h(huef_file_size((int) $doc['size_bytes'])) ?></small>
            </span>
            <a href="<?= huef_h(huef_url('api/file.php?id=' . urlencode($doc['id']))) ?>">Open</a>
          </li>
        <?php endforeach; ?>
        <?php if (!$docs): ?><li>No files uploaded.</li><?php endif; ?>
      </ul>
    </div>
  </div>
  <div>
    <div class="card">
      <h3>Preliminary screening</h3>
      <?php if ($screening): ?>
        <p><strong><?= huef_h(huef_recommendation_label($screening['recommendation'] ?? '')) ?></strong>
          · score <?= (int) ($screening['score'] ?? 0) ?></p>
        <p><?= huef_h($screening['summary'] ?? '') ?></p>
        <?php if (!empty($screening['deepseek']['brief'])): ?>
          <div class="alert alert-info"><strong>DeepSeek:</strong> <?= huef_h($screening['deepseek']['brief']) ?></div>
        <?php elseif (!empty($screening['deepseek']['error'])): ?>
          <div class="alert alert-warn"><?= huef_h($screening['deepseek']['error']) ?></div>
        <?php endif; ?>
        <ul>
          <?php foreach ($screening['flags'] ?? [] as $flag): ?>
            <li><strong><?= huef_h($flag['title'] ?? $flag['code'] ?? '') ?>.</strong> <?= huef_h($flag['detail'] ?? $flag['message'] ?? '') ?></li>
          <?php endforeach; ?>
        </ul>
        <p class="muted" style="font-size:0.85rem"><?= huef_h($screening['disclaimer'] ?? 'Officials make every award decision.') ?></p>
      <?php else: ?>
        <p class="muted">Not screened yet.</p>
      <?php endif; ?>
      <form method="post" class="btn-row">
        <?= huef_csrf_field() ?>
        <input type="hidden" name="action" value="screen">
        <button class="btn btn-outline" type="submit" style="color:var(--huef-green)">Re-run rules</button>
        <button class="btn btn-green" type="submit" name="llm" value="1">Ask DeepSeek to screen</button>
      </form>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Record a decision</h3>
      <form method="post">
        <?= huef_csrf_field() ?>
        <input type="hidden" name="action" value="decide">
        <label>Outcome</label>
        <select name="status" required>
          <option value="PENDING"<?= huef_selected('PENDING', $app['status']) ?>>Keep pending</option>
          <option value="MORE_INFO"<?= huef_selected('MORE_INFO', $app['status']) ?>>Request more information</option>
          <option value="APPROVED"<?= huef_selected('APPROVED', $app['status']) ?>>Approve</option>
          <option value="REJECTED"<?= huef_selected('REJECTED', $app['status']) ?>>Reject</option>
        </select>
        <label>Note to applicant</label>
        <textarea name="note"><?= huef_h($app['status_note']) ?></textarea>
        <p><button class="btn btn-gold" type="submit">Save decision</button></p>
      </form>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Screening history</h3>
      <?php foreach ($history as $h): ?>
        <p class="muted" style="margin:0.4rem 0"><?= huef_h(huef_dt($h['created_at'])) ?> · <?= huef_h($h['run_by']) ?> · <?= huef_h(huef_screening_label($h['overall_status'])) ?></p>
      <?php endforeach; ?>
      <?php if (!$history): ?><p class="muted">No runs yet.</p><?php endif; ?>
    </div>
  </div>
</div>
<?php
huef_render($user, 'Application review', huef_capture());
