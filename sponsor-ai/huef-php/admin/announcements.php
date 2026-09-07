<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    if (huef_post('action') === 'create') {
        huef_insert('announcements', [
            'id' => huef_id('annc'),
            'title' => huef_post('title'),
            'body' => huef_post('body'),
            'audience' => huef_post('audience') ?: 'ALL',
            'published' => 1,
            'deadline_at' => huef_post('deadline_at') ?: null,
            'created_by_id' => $user['id'],
        ]);
        huef_flash('ok', 'Announcement saved.');
    }
    huef_redirect('admin/announcements.php');
}

$rows = huef_all('SELECT * FROM announcements ORDER BY created_at DESC');
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Announcements</h1>
<form method="post" class="card">
  <?= huef_csrf_field() ?>
  <input type="hidden" name="action" value="create">
  <label>Title</label><input name="title" required>
  <label>Body</label><textarea name="body" required></textarea>
  <label>Audience</label>
  <select name="audience">
    <option value="ALL">Everyone</option>
    <option value="STUDENT">Applicants</option>
    <option value="COORDINATOR">Coordinators</option>
  </select>
  <label>Deadline (optional)</label><input name="deadline_at" placeholder="2026-02-13 16:00:00">
  <p><button class="btn btn-green" type="submit">Publish</button></p>
</form>
<?php foreach ($rows as $row): ?>
  <article class="card" style="margin-top:1rem">
    <p class="tiny"><?= huef_h($row['audience']) ?> · <?= huef_h(huef_dt($row['created_at'])) ?></p>
    <h3><?= huef_h($row['title']) ?></h3>
    <p><?= nl2br(huef_h($row['body'])) ?></p>
  </article>
<?php endforeach;
huef_render($user, 'Announcements', huef_capture());
