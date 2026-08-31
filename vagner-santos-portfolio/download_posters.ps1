$assetsDir = "c:\Users\nicol\Downloads\ag-kit-main\ag-kit-main\.agents\skills\vagner-santos-portfolio\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir
}

$videoIds = @(
    "TRne7-iC4zE",
    "MZ-JvgShwoY",
    "79hxy_U3NQB",
    "JfgumWou3PI",
    "8WU4bZsVjGJ",
    "Pgy8IhU3_SY",
    "4zCcQ47864H",
    "AX9jmyTdVxJ",
    "GdKgHB32SVd",
    "G6zUEF9Y28J",
    "-TKJ3NADcEj",
    "Qz8tbBJm9UP",
    "PyZ3ImEJmsZ",
    "MdY9bqFXF7-",
    "WDDho6S4gGW",
    "UK5a88An3C6",
    "8KPsNmmrnbF",
    "3r48muLoEWB",
    "28FjTMCnvZa",
    "PKIfzEf2Xh5",
    "4df72zfaF9G",
    "W-9dRGCQV2Q",
    "AkP6UcXAgAm",
    "898rkZ3rQEX"
)

foreach ($id in $videoIds) {
    try {
        $embedUrl = "https://www-ccv.adobe.io/v1/player/ccv/$id/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View"
        $html = curl.exe -s $embedUrl
        $content = $html -join ""
        if ($content -match '"posterframe":\s*"([^"]+)"') {
            $posterUrl = $matches[1] -replace '\\/', '/'
            $outPath = Join-Path $assetsDir "$id.jpg"
            curl.exe -s $posterUrl -o $outPath
            Write-Host "Downloaded poster for $id ($outPath)"
        } else {
            Write-Host "No poster found for $id"
        }
    } catch {
        Write-Host "Failed for $id"
    }
}
