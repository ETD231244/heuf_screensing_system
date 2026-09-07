<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    foreach (['support_phone', 'support_email', 'deadline_label', 'office_hours', 'deepseek_model'] as $key) {
        huef_set_setting($key, huef_post($key));
    }
    $key = huef_post('deepseek_api_key');
    if ($key !== '') {
        huef_set_setting('deepseek_api_key', $key);
    }
    if (huef_post('clear_deepseek') === '1') {
        huef_set_setting('deepseek_api_key', '');
    }
    huef_audit('settings_update', 'system_settings');
    huef_flash('ok', 'Settings saved. AI remains assistive only.');
    huef_redirect('admin/settings.php');
}

$hasKey = huef_deepseek_key() !== '';
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Settings</h1>
<div class="alert alert-info">DeepSeek writes a briefing for coordinators. It does not approve or reject applications.</div>
<form method="post" class="card" style="max-width:40rem">
  <?= huef_csrf_field() ?>
  <label>Support phone</label>
  <input name="support_phone" value="<?= huef_h(huef_setting('support_phone', '')) ?>">
  <label>Support email</label>
  <input name="support_email" value="<?= huef_h(huef_setting('support_email', '')) ?>">
  <label>Deadline label</label>
  <input name="deadline_label" value="<?= huef_h(huef_setting('deadline_label', '')) ?>">
  <label>Office hours</label>
  <input name="office_hours" value="<?= huef_h(huef_setting('office_hours', '')) ?>">
  <label>DeepSeek model</label>
  <input name="deepseek_model" value="<?= huef_h(huef_setting('deepseek_model', 'deepseek-v4-flash')) ?>">
  <label>DeepSeek API key <?= $hasKey ? '(currently stored — leave blank to keep)' : '' ?></label>
  <input name="deepseek_api_key" type="password" autocomplete="off" placeholder="<?= $hasKey ? '••••••••' : 'sk-…' ?>">
  <label><input type="checkbox" name="clear_deepseek" value="1" style="width:auto"> Remove stored key</label>
  <p><button class="btn btn-green" type="submit">Save settings</button></p>
</form>
<?php
huef_render($user, 'Settings', huef_capture());
