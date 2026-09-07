<?php
require __DIR__ . '/includes/bootstrap.php';
$user = huef_user();
huef_public_header($user, 'Apply for 2026 Tuition Fee Assistance');
?>
<section class="hero">
  <div class="hero-inner hero-grid">
    <div>
      <p class="kicker">Hela Provincial Government · 2026 TFA</p>
      <h1>Apply for HUEF sponsorship in one place. Track it until a decision is made.</h1>
      <p>Students from Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, and Magarima — and children of public servants who have served in Hela for more than three years — can lodge a 2026 Tuition Fee Assistance application without travelling to Tari or emailing a pile of PDFs.</p>
      <div class="btn-row" style="margin-top:1.4rem">
        <?php if ($user): ?>
          <a class="btn btn-gold" href="<?= huef_h(huef_url(huef_home_for($user))) ?>">Go to dashboard</a>
        <?php else: ?>
          <a class="btn btn-gold" href="<?= huef_h(huef_url('register.php')) ?>">Create a student account</a>
          <a class="btn btn-outline" href="<?= huef_h(huef_url('login.php')) ?>">Sign in</a>
        <?php endif; ?>
      </div>
    </div>
    <div class="hero-logo"><span class="emblem" aria-hidden="true"></span></div>
  </div>
</section>
<section class="stats wrap">
  <div class="stat"><b>4</b><span>Districts covered — Tari-Pori, Komo-Hulia, Koroba-Lake Kopiago, Magarima</span></div>
  <div class="stat"><b>100+</b><span>Nominated institutions — universities, colleges, national high schools, and overseas study</span></div>
  <div class="stat"><b>2018</b><span>Programme since Governor Philip Undialu’s Hela student sponsorship</span></div>
</section>
<section id="how-it-works" class="section">
  <h2>How the process works</h2>
  <p class="muted">Every application sits in one database, with its documents attached, and shows the student the status. AI only briefs the officer. A HUEF official still records Approved, Rejected, or more information.</p>
  <div class="cards cards-4">
    <article class="card"><h3>1. Register</h3><p class="muted">Create an account with your name, phone, and email, then complete HUEF-specific details.</p></article>
    <article class="card"><h3>2. Fill the 2026 form</h3><p class="muted">Personal details, origin, institution, programme, and fee information — on a phone or a computer.</p></article>
    <article class="card"><h3>3. Upload documents</h3><p class="muted">The system checks that every required file is attached and runs a preliminary screening before you can finish.</p></article>
    <article class="card"><h3>4. Coordinator decides</h3><p class="muted">DeepSeek briefs the officer on gaps, mismatches, and duplicates. Officials still make the award.</p></article>
  </div>
</section>
<?php huef_public_footer(); ?>
