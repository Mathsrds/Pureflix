<?php
// calendario-proxy.php
// Coloque este arquivo na mesma pasta do seu site.
// O JavaScript chama: fetch('calendario-proxy.php')

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$apis = [
    'https://warezcdn.lat/calendario.php',
    'https://superflixapi.best/calendario.php',
    'https://superflixapi.help/calendario.php',
    'https://superflixapi.asia/calendario.php',
    'https://superflixapi.my/calendario.php',
];

foreach ($apis as $url) {
    $ctx = stream_context_create([
        'http' => [
            'timeout'       => 8,
            'ignore_errors' => true,
            'header'        => "User-Agent: Mozilla/5.0\r\n",
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ]
    ]);

    $body = @file_get_contents($url, false, $ctx);
    if (!$body) continue;

    $data = json_decode($body, true);
    if (!$data) continue;

    // Pode ser array direto ou objeto com chave array
    if (is_array($data) && count($data) > 0) {
        echo json_encode($data);
        exit;
    }

    if (is_array($data)) {
        foreach ($data as $v) {
            if (is_array($v) && count($v) > 0) {
                echo json_encode($v);
                exit;
            }
        }
    }
}

// Nenhuma API funcionou
http_response_code(503);
echo json_encode(['error' => 'API indisponível']);
