<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['STUDENT']);
$applicant = huef_one('SELECT a.*, d.name AS district_name, l.name AS llg_name FROM applicants a LEFT JOIN districts d ON d.id = a.district_id LEFT JOIN llgs l ON l.id = a.llg_id WHERE a.user_id = ?', [$user['id']]);
$year = huef_current_period()['academic_year'] ?? '2026';
$application = $applicant
    ? huef_one(
        'SELECT ap.*, i.name AS institution_name, i.code AS institution_code
         FROM applications ap JOIN institutions i ON i.id = ap.institution_id
         WHERE ap.applicant_id = ? AND ap.academic_year = ? ORDER BY ap.created_at DESC',
        [$applicant['id'], $year]
    )
    : null;
$docs = $application
    ? huef_all('SELECT * FROM documents WHERE application_id = ? AND is_current = 1', [$application['id']])
    : [];
$announcements = huef_all(
    "SELECT * FROM announcements WHERE published = 1 AND audience IN ('ALL','STUDENT') ORDER BY created_at DESC LIMIT 4"
);
$deadline = huef_setting('deadline_label', 'Friday 13 February 2026');

huef_start();
?>
<p class="tiny">Applicant workspace</p>
<h1 style="margin:0.2rem 0 0.4rem;color:var(--huef-green-dark)">Welcome, <?= huef_h($applicant['given_name'] ?? $user['email']) ?></h1>
<p class="muted">Lodge one 2026 Tuition Fee Assistance file, attach the required papers, and watch the status here. Closing date: <?= huef_h($deadline) ?>.</p>

<div class="grid grid-2" style="margin-top:1.2rem">
  <div class="card">
    <h3>2026 application</h3>
    <?php if (!$application): ?>
      <p class="muted">You have not started a 2026 form yet.</p>
      <p><a class="btn btn-green" href="<?= huef_h(huef_url('student/apply.php')) ?>">Start application</a></p>
    <?php else: ?>
      <p><span class="badge <?= huef_status_class($application['status']) ?>"><?= huef_h(huef_status_label($application['status'])) ?></span>
        <?php if ($application['screening_status']): ?>
          <span class="badge badge-info"><?= huef_h(huef_screening_label($application['screening_status'])) ?></span>
        <?php endif; ?></p>
      <p><strong><?= huef_h($application['institution_code'] . ' ' . $application['institution_name']) ?></strong><br>
        <?= huef_h($application['program_name']) ?> · <?= huef_h($application['year_of_study']) ?></p>
      <?php if ($application['status_note']): ?>
        <div class="alert alert-info"><?= nl2br(huef_h($application['status_note'])) ?></div>
      <?php endif; ?>
      <?php if (in_array($application['status'], ['DRAFT', 'MORE_INFO'], true)): ?>
        <p><a class="btn btn-gold" href="<?= huef_h(huef_url('student/apply.php')) ?>">Continue application</a></p>
      <?php endif; ?>
      <?php if ($docs): ?>
        <p class="tiny">Current documents</p>
        <ul class="doc-list">
          <?php foreach ($docs as $doc): ?>
            <li><span><?= huef_h(huef_doc_label($doc['type'])) ?></span><span class="muted"><?= huef_h($doc['original_name']) ?></span></li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    <?php endif; ?>
  </div>
  <div>
    <div class="card">
      <h3>Profile</h3>
      <p><?= huef_h(huef_full_name($applicant ?: $user)) ?><br>
        <?= huef_h($applicant['phone'] ?? '') ?><br>
        <?= huef_h(($applicant['district_name'] ?? 'District not set') . ' · ' . ($applicant['llg_name'] ?? $applicant['llg_name'] ?? 'LLG not set')) ?></p>
      <p><a href="<?= huef_h(huef_url('student/profile.php')) ?>">Update profile and photo</a></p>
    </div>
    <?php foreach ($announcements as $ann): ?>
      <div class="card" style="margin-top:1rem">
        <p class="tiny">Announcement</p>
        <h3><?= huef_h($ann['title']) ?></h3>
        <p class="muted"><?= nl2br(huef_h($ann['body'])) ?></p>
      </div>
    <?php endforeach; ?>
  </div>
</div>
<?php
huef_render($user, 'Dashboard', huef_capture());
