<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
$user = huef_require_role(['STUDENT']);
$applicant = huef_one('SELECT * FROM applicants WHERE user_id = ?', [$user['id']]);
if (!$applicant) {
    huef_flash('error', 'Applicant profile is missing. Register again or contact HUEF.');
    huef_redirect('register.php');
}
$districts = huef_all('SELECT * FROM districts ORDER BY name');
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    huef_csrf_check();
    $data = [
        'given_name' => strtoupper(huef_post('given_name')),
        'surname' => strtoupper(huef_post('surname')),
        'gender' => huef_post('gender'),
        'date_of_birth' => huef_post('date_of_birth') ?: null,
        'age' => huef_post('age') !== '' ? (int) huef_post('age') : null,
        'phone' => huef_post('phone'),
        'student_id' => huef_post('student_id') ?: null,
        'clan_name' => strtoupper(huef_post('clan_name')) ?: null,
        'ward_village' => strtoupper(huef_post('ward_village')) ?: null,
        'llg_name' => huef_post('llg_name') ?: null,
        'llg_id' => huef_post('llg_id') ?: null,
        'district_id' => huef_post('district_id') ?: null,
        'province' => huef_post('province') ?: 'Hela',
        'father_full_name' => strtoupper(huef_post('father_full_name')) ?: null,
        'father_occupation' => strtoupper(huef_post('father_occupation')) ?: null,
        'father_clan' => strtoupper(huef_post('father_clan')) ?: null,
        'father_ward' => strtoupper(huef_post('father_ward')) ?: null,
        'father_district' => strtoupper(huef_post('father_district')) ?: null,
        'father_province' => huef_post('father_province') ?: null,
        'father_phone' => huef_post('father_phone') ?: null,
        'mother_full_name' => strtoupper(huef_post('mother_full_name')) ?: null,
        'mother_occupation' => strtoupper(huef_post('mother_occupation')) ?: null,
        'mother_clan' => strtoupper(huef_post('mother_clan')) ?: null,
        'mother_ward' => strtoupper(huef_post('mother_ward')) ?: null,
        'mother_district' => strtoupper(huef_post('mother_district')) ?: null,
        'mother_province' => huef_post('mother_province') ?: null,
        'mother_phone' => huef_post('mother_phone') ?: null,
        'eligibility_path' => huef_post('eligibility_path') ?: 'HELA_ORIGIN',
        'public_servant_who' => huef_post('public_servant_who') ?: null,
        'public_servant_department' => huef_post('public_servant_department') ?: null,
        'public_servant_occupation' => huef_post('public_servant_occupation') ?: null,
        'public_servant_years' => huef_post('public_servant_years') !== '' ? (int) huef_post('public_servant_years') : null,
        'public_servant_supervisor' => huef_post('public_servant_supervisor') ?: null,
        'public_servant_supervisor_phone' => huef_post('public_servant_supervisor_phone') ?: null,
    ];
    if ($data['llg_id']) {
        $llg = huef_one('SELECT name FROM llgs WHERE id = ?', [$data['llg_id']]);
        $data['llg_name'] = $llg['name'] ?? $data['llg_name'];
    }
    try {
        if (!empty($_FILES['photo']['name'])) {
            $saved = huef_save_upload($_FILES['photo'], 'photos/' . $user['id'], 2 * 1024 * 1024);
            if ($saved && !in_array($saved['kind'], ['jpg', 'png', 'webp'], true)) {
                throw new RuntimeException('Profile photo must be a JPG, PNG, or WEBP.');
            }
            if ($saved) {
                $bytes = file_get_contents($GLOBALS['HUEF_CONFIG']['app']['upload_dir'] . '/' . $saved['path']);
                $data['photo_mime'] = $saved['mime'];
                $data['photo_bytes'] = $bytes;
            }
        }
        huef_update('applicants', $data, 'id = :id', ['id' => $applicant['id']]);
        huef_audit('profile_update', 'applicant', $applicant['id']);
        huef_flash('ok', 'Profile saved.');
        huef_redirect('student/profile.php');
    } catch (Throwable $e) {
        $error = $e->getMessage();
        $applicant = array_merge($applicant, $data);
    }
}

$llgs = $applicant['district_id']
    ? huef_all('SELECT * FROM llgs WHERE district_id = ? ORDER BY name', [$applicant['district_id']])
    : [];

huef_start();
?>
<p class="tiny">Applicant</p>
<h1 style="margin:0.2rem 0 0.8rem;color:var(--huef-green-dark)">My profile</h1>
<?php if ($error): ?><div class="alert alert-bad"><?= huef_h($error) ?></div><?php endif; ?>
<form method="post" enctype="multipart/form-data" class="card">
  <?= huef_csrf_field() ?>
  <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem">
    <?php if ($applicant['photo_mime']): ?>
      <img src="<?= huef_h(huef_url('api/photo.php?user=' . urlencode($user['id']))) ?>" alt="Profile photo" width="88" height="88" style="border-radius:999px;object-fit:cover;background:#fff;border:2px solid var(--huef-gold)">
    <?php else: ?>
      <span class="emblem" style="width:88px;height:88px"></span>
    <?php endif; ?>
    <div>
      <label for="photo">Passport-style photo</label>
      <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp">
    </div>
  </div>
  <div class="form-grid form-2">
    <div><label>Given name</label><input name="given_name" required value="<?= huef_h($applicant['given_name']) ?>"></div>
    <div><label>Surname</label><input name="surname" required value="<?= huef_h($applicant['surname']) ?>"></div>
    <div>
      <label>Gender</label>
      <select name="gender" required>
        <option value="F"<?= huef_selected('F', $applicant['gender']) ?>>Female</option>
        <option value="M"<?= huef_selected('M', $applicant['gender']) ?>>Male</option>
      </select>
    </div>
    <div><label>Date of birth</label><input name="date_of_birth" placeholder="YYYY-MM-DD" value="<?= huef_h($applicant['date_of_birth']) ?>"></div>
    <div><label>Age</label><input name="age" type="number" min="10" max="80" value="<?= huef_h((string) $applicant['age']) ?>"></div>
    <div><label>Phone</label><input name="phone" required value="<?= huef_h($applicant['phone']) ?>"></div>
    <div><label>Student ID</label><input name="student_id" value="<?= huef_h($applicant['student_id']) ?>"></div>
    <div><label>Clan</label><input name="clan_name" value="<?= huef_h($applicant['clan_name']) ?>"></div>
    <div><label>Ward / village</label><input name="ward_village" value="<?= huef_h($applicant['ward_village']) ?>"></div>
    <div>
      <label>District</label>
      <select name="district_id" id="district_id" data-llg-url="<?= huef_h(huef_url('api/llgs.php')) ?>">
        <option value="">Select</option>
        <?php foreach ($districts as $d): ?>
          <option value="<?= huef_h($d['id']) ?>"<?= huef_selected($d['id'], $applicant['district_id']) ?>><?= huef_h($d['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div>
      <label>LLG</label>
      <select name="llg_id" id="llg_id" data-selected="<?= huef_h((string) $applicant['llg_id']) ?>">
        <option value="">Select</option>
        <?php foreach ($llgs as $l): ?>
          <option value="<?= huef_h($l['id']) ?>"<?= huef_selected($l['id'], $applicant['llg_id']) ?>><?= huef_h($l['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>Province</label><input name="province" value="<?= huef_h($applicant['province'] ?: 'Hela') ?>"></div>
  </div>
  <h3>Parents</h3>
  <div class="form-grid form-2">
    <div><label>Father's full name</label><input name="father_full_name" value="<?= huef_h($applicant['father_full_name']) ?>"></div>
    <div><label>Father's occupation</label><input name="father_occupation" value="<?= huef_h($applicant['father_occupation']) ?>"></div>
    <div><label>Father clan</label><input name="father_clan" value="<?= huef_h($applicant['father_clan']) ?>"></div>
    <div><label>Father ward</label><input name="father_ward" value="<?= huef_h($applicant['father_ward']) ?>"></div>
    <div><label>Mother's full name</label><input name="mother_full_name" value="<?= huef_h($applicant['mother_full_name']) ?>"></div>
    <div><label>Mother's occupation</label><input name="mother_occupation" value="<?= huef_h($applicant['mother_occupation']) ?>"></div>
    <div><label>Mother clan</label><input name="mother_clan" value="<?= huef_h($applicant['mother_clan']) ?>"></div>
    <div><label>Mother ward</label><input name="mother_ward" value="<?= huef_h($applicant['mother_ward']) ?>"></div>
  </div>
  <h3>Eligibility</h3>
  <label>Pathway</label>
  <select name="eligibility_path">
    <option value="HELA_ORIGIN"<?= huef_selected('HELA_ORIGIN', $applicant['eligibility_path']) ?>>Hela origin by blood and custom</option>
    <option value="PUBLIC_SERVANT_CHILD"<?= huef_selected('PUBLIC_SERVANT_CHILD', $applicant['eligibility_path']) ?>>Child of a public servant serving in Hela (3+ years)</option>
    <option value="PUBLIC_SERVANT_SELF"<?= huef_selected('PUBLIC_SERVANT_SELF', $applicant['eligibility_path']) ?>>Public servant serving in Hela (3+ years)</option>
  </select>
  <div class="form-grid form-2">
    <div><label>Public servant (who)</label><input name="public_servant_who" value="<?= huef_h($applicant['public_servant_who']) ?>"></div>
    <div><label>Department</label><input name="public_servant_department" value="<?= huef_h($applicant['public_servant_department']) ?>"></div>
    <div><label>Occupation</label><input name="public_servant_occupation" value="<?= huef_h($applicant['public_servant_occupation']) ?>"></div>
    <div><label>Years in Hela</label><input name="public_servant_years" type="number" min="0" max="50" value="<?= huef_h((string) $applicant['public_servant_years']) ?>"></div>
    <div><label>Supervisor</label><input name="public_servant_supervisor" value="<?= huef_h($applicant['public_servant_supervisor']) ?>"></div>
    <div><label>Supervisor phone</label><input name="public_servant_supervisor_phone" value="<?= huef_h($applicant['public_servant_supervisor_phone']) ?>"></div>
  </div>
  <p style="margin-top:1rem"><button class="btn btn-green" type="submit">Save profile</button></p>
</form>
<?php
huef_render($user, 'My profile', huef_capture());
