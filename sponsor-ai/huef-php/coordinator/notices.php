<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['COORDINATOR', 'ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $title = huef_post('title');
    $message = huef_post('message');
    $audience = huef_post('audience') ?: 'STUDENT';
    if (!$title || !$message) {
        huef_flash('error', 'Title and message are required.');
    } else {
        $targets = [];
        if ($audience === 'ALL') {
            $targets = huef_all('SELECT id FROM users WHERE is_active = 1');
        } else {
            $targets = huef_all('SELECT id FROM users WHERE is_active = 1 AND role = ?', [$audience]);
        }
        foreach ($targets as $t) {
            huef_notify($t['id'], $title, $message, $user['id'], null, 'ANNOUNCEMENT', 'ANNOUNCEMENT');
        }
        huef_insert('announcements', [
            'id' => huef_id('annc'),
            'title' => $title,
            'body' => $message,
            'audience' => $audience,
            'published' => 1,
            'created_by_id' => $user['id'],
        ]);
        huef_audit('notice_send', 'announcement', null, ['audience' => $audience, 'count' => count($targets)]);
        huef_flash('ok', 'Notice sent to ' . count($targets) . ' account(s).');
        huef_redirect('coordinator/notices.php');
    }
}

huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Send notice</h1>
<p class="muted">Group notices appear in each recipient’s Notices inbox.</p>
<form method="post" class="card" style="max-width:40rem">
  <?= huef_csrf_field() ?>
  <label>Audience</label>
  <select name="audience">
    <option value="STUDENT">Applicants</option>
    <option value="COORDINATOR">Coordinators</option>
    <option value="ADMIN">Administrators</option>
    <option value="ALL">Everyone</option>
  </select>
  <label>Title</label>
  <input name="title" required>
  <label>Message</label>
  <textarea name="message" required></textarea>
  <p><button class="btn btn-green" type="submit">Send</button></p>
</form>
<?php
huef_render($user, 'Send notice', huef_capture());
