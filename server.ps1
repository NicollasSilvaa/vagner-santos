$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "🚀 Servidor local iniciado com sucesso em http://localhost:$port/"
Write-Host "Pressione Ctrl+C para encerrar."

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".mp4"  = "video/mp4"
    ".webm" = "video/webm"
}

try {
    while ($listener.IsListening) {
        $context = $null
        try {
            $context = $listener.GetContext()
        } catch {
            break
        }

        if ($null -eq $context) { continue }

        try {
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }

            $localPath = Join-Path $PSScriptRoot ($path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar))

            if (Test-Path $localPath -PathType Leaf) {
                $ext = [IO.Path]::GetExtension($localPath).ToLower()
                $contentType = "application/octet-stream"
                if ($mimeTypes.ContainsKey($ext)) {
                    $contentType = $mimeTypes[$ext]
                }

                $response.ContentType = $contentType
                $response.AddHeader("Accept-Ranges", "bytes")

                $fileInfo = New-Object System.IO.FileInfo($localPath)
                $totalLength = $fileInfo.Length

                $rangeHeader = $request.Headers["Range"]
                if ($rangeHeader -and $rangeHeader -match "bytes=(\d*)-(\d*)") {
                    $start = 0
                    $end = $totalLength - 1
                    if ($matches[1] -ne "") { $start = [int64]$matches[1] }
                    if ($matches[2] -ne "") { $end = [int64]$matches[2] }

                    if ($end -ge $totalLength) { $end = $totalLength - 1 }
                    $length = $end - $start + 1

                    $response.StatusCode = 206
                    $response.AddHeader("Content-Range", "bytes $start-$end/$totalLength")
                    $response.ContentLength64 = $length

                    $stream = [System.IO.File]::OpenRead($localPath)
                    try {
                        $stream.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                        $buffer = New-Object byte[] 65536
                        $bytesRemaining = $length
                        while ($bytesRemaining -gt 0) {
                            $toRead = [Math]::Min($buffer.Length, $bytesRemaining)
                            $read = $stream.Read($buffer, 0, $toRead)
                            if ($read -le 0) { break }
                            $response.OutputStream.Write($buffer, 0, $read)
                            $bytesRemaining -= $read
                        }
                    } finally {
                        $stream.Close()
                    }
                } else {
                    $response.StatusCode = 200
                    $response.ContentLength64 = $totalLength
                    $stream = [System.IO.File]::OpenRead($localPath)
                    try {
                        $stream.CopyTo($response.OutputStream)
                    } finally {
                        $stream.Close()
                    }
                }
            } else {
                $response.StatusCode = 404
                $notFound = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $notFound.Length
                $response.OutputStream.Write($notFound, 0, $notFound.Length)
            }
        } catch {
            # Client disconnected / stream aborted - safe to ignore
        } finally {
            try {
                if ($null -ne $context -and $null -ne $context.Response) {
                    $context.Response.OutputStream.Close()
                    $context.Response.Close()
                }
            } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
}
