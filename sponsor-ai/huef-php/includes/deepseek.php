<?php

function huef_deepseek_key(): string
{
    $fromDb = huef_setting('deepseek_api_key');
    if ($fromDb) {
        return $fromDb;
    }
    return (string) ($GLOBALS['HUEF_CONFIG']['deepseek']['api_key'] ?? '');
}

function huef_deepseek_configured(): bool
{
    return huef_deepseek_key() !== '';
}

function huef_deepseek_brief(array $app, array $docs, array $flags, array $missing, array $types): array
{
    $key = huef_deepseek_key();
    if ($key === '') {
        throw new RuntimeException('DeepSeek API key is not configured. Add it under Admin → Settings.');
    }

    $model = huef_setting('deepseek_model') ?: ($GLOBALS['HUEF_CONFIG']['deepseek']['model'] ?? 'deepseek-v4-flash');
    $base = rtrim($GLOBALS['HUEF_CONFIG']['deepseek']['base_url'] ?? 'https://api.deepseek.com', '/');

    $payload = [
        'applicant' => [
            'name' => huef_full_name($app),
            'email' => $app['email'] ?? '',
            'district' => $app['district_name'],
            'llg' => $app['llg_name'],
            'eligibility' => $app['eligibility_path'],
            'institution' => $app['institution_name'] ?? '',
            'program' => $app['program_name'],
            'level' => $app['study_level'],
            'year_of_study' => $app['year_of_study'],
            'applicant_type' => $app['applicant_type'],
            'fee_category' => $app['fee_category'],
            'tuition_fees' => $app['tuition_fees'],
            'witness' => $app['witness_name'],
        ],
        'documents' => array_map(fn ($d) => [
            'type' => $d['type'],
            'label' => huef_doc_label($d['type'], $types),
            'filename' => $d['original_name'],
            'size' => (int) $d['size_bytes'],
        ], $docs),
        'ruleFlags' => $flags,
        'missingDocuments' => $missing,
    ];

    $system = <<<TXT
You are a preliminary screening assistant for the Hela Undialu Education Foundation (HUEF) tuition fee assistance in Papua New Guinea.
You do not decide awards. Officials decide. Return JSON only with this shape:
{"summary":"string","suggestedDecision":"PENDING"|"MORE_INFO"|"APPROVED"|"REJECTED","remainingChecks":["string"],"draftApplicantNote":"string","flags":[{"code":"string","severity":"info"|"warning"|"fail","title":"string","message":"string"}]}
Be concise. Do not invent documents that were not listed. Flag only issues a coordinator should check.
TXT;

    $body = json_encode([
        'model' => $model,
        'temperature' => 0.2,
        'messages' => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => json_encode($payload)],
        ],
        'response_format' => ['type' => 'json_object'],
    ]);

    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL is required to call DeepSeek.');
    }

    $ch = curl_init($base . '/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 45,
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException('DeepSeek request failed: ' . $err);
    }
    $decoded = json_decode($raw, true);
    if ($code >= 400) {
        $msg = $decoded['error']['message'] ?? ('HTTP ' . $code);
        throw new RuntimeException($msg);
    }
    $text = $decoded['choices'][0]['message']['content'] ?? '';
    $brief = json_decode($text, true);
    if (!is_array($brief)) {
        throw new RuntimeException('DeepSeek returned a non-JSON brief.');
    }
    return $brief;
}
