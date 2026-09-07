<?php

function huef_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $cfg = $GLOBALS['HUEF_CONFIG']['db'];
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $cfg['host'],
        $cfg['name'],
        $cfg['charset'] ?? 'utf8mb4'
    );
    if (!empty($cfg['unix_socket'])) {
        $dsn = sprintf(
            'mysql:unix_socket=%s;dbname=%s;charset=%s',
            $cfg['unix_socket'],
            $cfg['name'],
            $cfg['charset'] ?? 'utf8mb4'
        );
    } elseif (!empty($cfg['socket'])) {
        $dsn = sprintf(
            'mysql:unix_socket=%s;dbname=%s;charset=%s',
            $cfg['socket'],
            $cfg['name'],
            $cfg['charset'] ?? 'utf8mb4'
        );
    }
    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function huef_id(string $prefix = 'id'): string
{
    return $prefix . '_' . bin2hex(random_bytes(8));
}

function huef_query(string $sql, array $params = []): PDOStatement
{
    $stmt = huef_pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function huef_one(string $sql, array $params = []): ?array
{
    $row = huef_query($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function huef_all(string $sql, array $params = []): array
{
    return huef_query($sql, $params)->fetchAll();
}

function huef_insert(string $table, array $data): string
{
    if (!isset($data['id'])) {
        $data['id'] = huef_id(substr($table, 0, 4));
    }
    $cols = array_keys($data);
    $fields = implode(', ', array_map(fn ($c) => '`' . $c . '`', $cols));
    $placeholders = implode(', ', array_map(fn ($c) => ':' . $c, $cols));
    huef_query("INSERT INTO `$table` ($fields) VALUES ($placeholders)", $data);
    return (string) $data['id'];
}

function huef_update(string $table, array $data, string $whereSql, array $whereParams = []): void
{
    $sets = [];
    $params = [];
    foreach ($data as $col => $val) {
        $sets[] = "`$col` = :set_$col";
        $params['set_' . $col] = $val;
    }
    huef_query(
        'UPDATE `' . $table . '` SET ' . implode(', ', $sets) . ' WHERE ' . $whereSql,
        array_merge($params, $whereParams)
    );
}

function huef_setting(string $key, ?string $default = null): ?string
{
    $row = huef_one('SELECT setting_value FROM system_settings WHERE setting_key = ?', [$key]);
    if (!$row) {
        return $default;
    }
    return $row['setting_value'];
}

function huef_set_setting(string $key, string $value): void
{
    huef_query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [$key, $value]
    );
}
