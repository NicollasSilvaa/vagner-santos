# ==============================================================================
# Servidor Local Seguro para Portfolio Vagner Santos
# Com protecao contra Path Traversal e Headers de Seguranca integrados
# ==============================================================================

$port = 8080
$prefix = "http://localhost:$port/"
$baseDir = (Get-Item -Path $PSScriptRoot).FullName

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "  Servidor Local Seguro Ativo em $prefix" -ForegroundColor Green
    Write-Host "  Diretorio Raiz: $baseDir" -ForegroundColor DarkGray
    Write-Host "  Pressione Ctrl + C para encerrar o servidor." -ForegroundColor Yellow
    Write-Host "===================================================" -ForegroundColor Cyan

    $mimeTypes = @{
        ".html" = "text/html; charset=utf-8"
        ".htm"  = "text/html; charset=utf-8"
        ".css"  = "text/css; charset=utf-8"
        ".js"   = "application/javascript; charset=utf-8"
        ".json" = "application/json; charset=utf-8"
        ".png"  = "image/png"
        ".jpg"  = "image/jpeg"
        ".jpeg" = "image/jpeg"
        ".gif"  = "image/gif"
        ".svg"  = "image/svg+xml"
        ".ico"  = "image/x-icon"
        ".mp4"  = "video/mp4"
        ".webm" = "video/webm"
        ".txt"  = "text/plain; charset=utf-8"
        ".xml"  = "application/xml; charset=utf-8"
    }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Security Headers
        $response.Headers.Add("X-Content-Type-Options", "nosniff")
        $response.Headers.Add("X-Frame-Options", "DENY")
        $response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin")
        $response.Headers.Add("Content-Security-Policy", "default-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; media-src 'self' https: blob: data:; frame-src 'self' https:;")

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "/index.html"
        }

        # Normalize relative path and prevent Path Traversal attacks
        $relPath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($baseDir, $relPath))

        if (-not $fullPath.StartsWith($baseDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            # Forbidden / Path Traversal attempt
            $response.StatusCode = 403
            $msg = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden: Acesso negado.")
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
            $response.Close()
            continue
        }

        if ([System.IO.File]::Exists($fullPath)) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $contentType = $mimeTypes[$ext]
            }

            $response.ContentType = $contentType
            $response.StatusCode = 200

            try {
                $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $fileBytes.Length
                $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.Close()
    }
} catch {
    Write-Host "Erro ou servidor encerrado: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
