<?php
require dirname(__DIR__) . '/includes/bootstrap.php';
huef_require_role(['COORDINATOR', 'ADMIN']);
huef_json(huef_coordinator_dashboard());
