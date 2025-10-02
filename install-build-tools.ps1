# Скрипт для установки Visual Studio Build Tools с C++ компонентами
# Запустите этот скрипт от имени администратора

Write-Host "Установка Visual Studio Build Tools с C++ компонентами..." -ForegroundColor Green

# Скачиваем установщик
$url = "https://aka.ms/vs/17/release/vs_buildtools.exe"
$installer = "$env:TEMP\vs_buildtools.exe"

Write-Host "Скачивание установщика..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $url -OutFile $installer

# Устанавливаем с необходимыми компонентами
Write-Host "Установка Build Tools..." -ForegroundColor Yellow
$arguments = @(
    "--wait",
    "--add", "Microsoft.VisualStudio.Workload.VCTools",
    "--includeRecommended",
    "--quiet"
)

Start-Process -FilePath $installer -ArgumentList $arguments -Wait

Write-Host "Установка завершена! Перезапустите терминал." -ForegroundColor Green
