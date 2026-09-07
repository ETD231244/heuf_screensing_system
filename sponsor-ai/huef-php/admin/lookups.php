<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $kind = huef_post('kind');
    if ($kind === 'institution') {
        huef_insert('institutions', [
            'id' => huef_id('inst'),
            'code' => strtoupper(huef_post('code')),
            'name' => huef_post('name'),
            'category' => huef_post('category') ?: 'Other',
            'province' => huef_post('province') ?: null,
            'is_active' => 1,
        ]);
        huef_flash('ok', 'Institution added.');
    }
    if ($kind === 'program') {
        huef_insert('programs', [
            'id' => huef_id('prog'),
            'name' => huef_post('name'),
            'institution_id' => huef_post('institution_id') ?: null,
            'is_active' => 1,
        ]);
        huef_flash('ok', 'Programme added.');
    }
    if ($kind === 'district') {
        huef_insert('districts', [
            'id' => huef_id('dist'),
            'name' => huef_post('name'),
        ]);
        huef_flash('ok', 'District added.');
    }
    if ($kind === 'llg') {
        huef_insert('llgs', [
            'id' => huef_id('llg'),
            'name' => huef_post('name'),
            'district_id' => huef_post('district_id'),
        ]);
        huef_flash('ok', 'LLG added.');
    }
    huef_redirect('admin/lookups.php');
}

$institutions = huef_all('SELECT * FROM institutions ORDER BY code');
$programs = huef_all('SELECT p.*, i.code FROM programs p LEFT JOIN institutions i ON i.id = p.institution_id ORDER BY p.name');
$districts = huef_all('SELECT * FROM districts ORDER BY name');
$llgs = huef_all('SELECT l.*, d.name AS district_name FROM llgs l JOIN districts d ON d.id = l.district_id ORDER BY d.name, l.name');
huef_start();
?>
<h1 style="margin-top:0;color:var(--huef-green-dark)">Institutions &amp; LLGs</h1>
<div class="grid grid-2">
  <form method="post" class="card">
    <?= huef_csrf_field() ?><input type="hidden" name="kind" value="institution">
    <h3>Add institution</h3>
    <label>Code</label><input name="code" required>
    <label>Name</label><input name="name" required>
    <label>Category</label><input name="category">
    <label>Province</label><input name="province">
    <p><button class="btn btn-green" type="submit">Add</button></p>
  </form>
  <form method="post" class="card">
    <?= huef_csrf_field() ?><input type="hidden" name="kind" value="program">
    <h3>Add programme</h3>
    <label>Name</label><input name="name" required>
    <label>Institution</label>
    <select name="institution_id">
      <option value="">Any / unlinked</option>
      <?php foreach ($institutions as $i): ?>
        <option value="<?= huef_h($i['id']) ?>"><?= huef_h($i['code'] . ' ' . $i['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <p><button class="btn btn-green" type="submit">Add</button></p>
  </form>
  <form method="post" class="card">
    <?= huef_csrf_field() ?><input type="hidden" name="kind" value="district">
    <h3>Add district</h3>
    <label>Name</label><input name="name" required>
    <p><button class="btn btn-green" type="submit">Add</button></p>
  </form>
  <form method="post" class="card">
    <?= huef_csrf_field() ?><input type="hidden" name="kind" value="llg">
    <h3>Add LLG</h3>
    <label>District</label>
    <select name="district_id" required>
      <?php foreach ($districts as $d): ?>
        <option value="<?= huef_h($d['id']) ?>"><?= huef_h($d['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <label>Name</label><input name="name" required>
    <p><button class="btn btn-green" type="submit">Add</button></p>
  </form>
</div>
<div class="card" style="margin-top:1rem">
  <h3>Districts &amp; LLGs (<?= count($llgs) ?>)</h3>
  <div class="table-wrap">
    <table class="data-grid">
      <thead><tr><th>District</th><th>LLG</th></tr></thead>
      <tbody>
      <?php foreach ($llgs as $row): ?>
        <tr><td><?= huef_h($row['district_name']) ?></td><td><?= huef_h($row['name']) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<div class="card" style="margin-top:1rem">
  <h3>Institutions (<?= count($institutions) ?>)</h3>
  <div class="table-wrap">
    <table class="data-grid">
      <thead><tr><th>Code</th><th>Name</th><th>Category</th></tr></thead>
      <tbody>
      <?php foreach ($institutions as $row): ?>
        <tr><td><?= huef_h($row['code']) ?></td><td><?= huef_h($row['name']) ?></td><td><?= huef_h($row['category']) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php
huef_render($user, 'Institutions & LLGs', huef_capture());
