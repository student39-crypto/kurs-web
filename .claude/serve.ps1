# Простий локальний сервер для перегляду сайту: http://localhost:8080
# Порт: параметр -Port, інакше змінна PORT (її задає панель браузера, коли 8080 зайнятий), інакше 8080.
param([int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8080 }))

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'
  '.svg' = 'image/svg+xml'; '.mp4' = 'video/mp4'; '.ico' = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Error "Port $Port is busy: $($_.Exception.Message)"
  exit 1
}
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  # Як на GitHub Pages: сайт відкривається і за адресою /kurs-web/...
  if ($path -eq 'kurs-web') { $ctx.Response.Redirect('/kurs-web/'); $ctx.Response.Close(); continue }
  if ($path.StartsWith('kurs-web/')) { $path = $path.Substring('kurs-web/'.Length) }
  if ($path -eq '' -or $path.EndsWith('/')) { $path += 'index.html' }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))

  if ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $ctx.Response.StatusCode = 200
  } else {
    # Як на хостингу: на неіснуючу адресу віддаємо 404.html зі статусом 404
    $nf = Join-Path $root '404.html'
    if (Test-Path -LiteralPath $nf -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($nf)
      $ctx.Response.ContentType = 'text/html; charset=utf-8'
    } else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
    }
    $ctx.Response.StatusCode = 404
  }
  # На HEAD-запит тіло не надсилаємо
  if ($ctx.Request.HttpMethod -ne 'HEAD') {
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  $ctx.Response.Close()
}
