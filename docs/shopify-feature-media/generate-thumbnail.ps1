$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Join-Path $scriptDir 'assets'
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$outputPath = Join-Path $assetsDir 'akeed-feature-thumbnail.png'
$width = 1600
$height = 900

function New-SolidBrush([string]$hex) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($r, $g, $b))
}

function New-Pen([string]$hex, [float]$size) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($r, $g, $b), $size)
}

function New-ArgbBrush([int]$alpha, [string]$hex) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
}

function Add-RoundedRectangle(
  [System.Drawing.Drawing2D.GraphicsPath]$path,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h,
  [float]$r
) {
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
}

function Fill-RoundedRect(
  [System.Drawing.Graphics]$graphics,
  [System.Drawing.Brush]$brush,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h,
  [float]$r
) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundedRectangle $path $x $y $w $h $r
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Stroke-RoundedRect(
  [System.Drawing.Graphics]$graphics,
  [System.Drawing.Pen]$pen,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h,
  [float]$r
) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundedRectangle $path $x $y $w $h $r
  $graphics.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-Text(
  [System.Drawing.Graphics]$graphics,
  [string]$text,
  [System.Drawing.Font]$font,
  [System.Drawing.Brush]$brush,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h,
  [string]$align = 'Near'
) {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$align
  $format.LineAlignment = [System.Drawing.StringAlignment]::Near
  $graphics.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x, $y, $w, $h)), $format)
  $format.Dispose()
}

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$bg = New-SolidBrush '#f8fafc'
$slate = New-SolidBrush '#0f172a'
$muted = New-SolidBrush '#475569'
$white = New-SolidBrush '#ffffff'
$emerald = New-SolidBrush '#059669'
$emeraldSoft = New-SolidBrush '#d1fae5'
$cyanSoft = New-SolidBrush '#cffafe'
$orange = New-SolidBrush '#ea580c'
$redSoft = New-SolidBrush '#fee2e2'
$blueSoft = New-SolidBrush '#dbeafe'
$linePen = New-Pen '#cbd5e1' 3
$emeraldPen = New-Pen '#10b981' 5
$shadowBrush = New-ArgbBrush 35 '#0f172a'

$graphics.FillRectangle($bg, 0, 0, $width, $height)

Fill-RoundedRect $graphics (New-ArgbBrush 90 '#d1fae5') 1100 70 360 220 60
Fill-RoundedRect $graphics (New-ArgbBrush 90 '#cffafe') 980 650 420 180 60
Fill-RoundedRect $graphics (New-ArgbBrush 90 '#fed7aa') 95 665 360 160 60

$fontFamily = 'Segoe UI'
$brandFont = New-Object System.Drawing.Font($fontFamily, 36, [System.Drawing.FontStyle]::Bold)
$headlineFont = New-Object System.Drawing.Font($fontFamily, 64, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font($fontFamily, 30, [System.Drawing.FontStyle]::Regular)
$labelFont = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font($fontFamily, 23, [System.Drawing.FontStyle]::Regular)
$metricFont = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Regular)

Draw-Text $graphics 'Akeed' $brandFont $emerald 96 72 240 56
Draw-Text $graphics 'Confirm COD' $headlineFont $slate 96 148 760 86
Draw-Text $graphics 'before shipping' $headlineFont $slate 96 228 820 86
Draw-Text $graphics 'WhatsApp order confirmation for MENA commerce' $subtitleFont $muted 102 338 690 104

Fill-RoundedRect $graphics $shadowBrush 104 466 454 238 44
Fill-RoundedRect $graphics $white 96 452 454 238 44
Stroke-RoundedRect $graphics $linePen 96 452 454 238 44
Fill-RoundedRect $graphics $emeraldSoft 128 490 330 56 22
Draw-Text $graphics 'Order #12847' $labelFont $slate 154 503 270 42
Draw-Text $graphics 'Confirm this COD order?' $bodyFont $muted 128 566 370 40
Fill-RoundedRect $graphics $emerald 128 616 162 46 18
Draw-Text $graphics 'Confirm' $smallFont $white 160 626 112 28 Center
Fill-RoundedRect $graphics $redSoft 306 616 150 46 18
Draw-Text $graphics 'Cancel' $smallFont $slate 330 626 108 28 Center

$arrowPen = New-Pen '#10b981' 8
$arrowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
$graphics.DrawBezier($arrowPen, 610, 562, 735, 490, 810, 495, 930, 520)

Fill-RoundedRect $graphics $shadowBrush 955 206 520 470 48
Fill-RoundedRect $graphics $white 940 190 520 470 48
Stroke-RoundedRect $graphics $linePen 940 190 520 470 48
Draw-Text $graphics 'Verification dashboard' $labelFont $slate 990 236 400 44

Fill-RoundedRect $graphics $emeraldSoft 990 314 190 126 28
Draw-Text $graphics 'Confirmed' $smallFont $muted 1022 334 130 28
Draw-Text $graphics '84' $metricFont $emerald 1024 360 120 58

Fill-RoundedRect $graphics $redSoft 1218 314 190 126 28
Draw-Text $graphics 'Canceled' $smallFont $muted 1250 334 130 28
Draw-Text $graphics '16' $metricFont $slate 1252 360 120 58

Fill-RoundedRect $graphics $blueSoft 990 472 418 96 28
Draw-Text $graphics 'Response rate' $smallFont $muted 1024 494 190 28
Draw-Text $graphics '89%' $metricFont $emerald 1206 482 150 60

Fill-RoundedRect $graphics $cyanSoft 990 594 418 34 17
Fill-RoundedRect $graphics $emerald 990 594 322 34 17

Draw-Text $graphics 'Official WhatsApp COD confirmation workflow' $smallFont $muted 96 820 620 32

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Generated $outputPath ($width x $height)"
