$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Join-Path $scriptDir 'assets'
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$outputPath = Join-Path $assetsDir 'akeed-feature-video.avi'
$width = 1280
$height = 720
$fps = 10
$durationSeconds = 95
$totalFrames = [int]($durationSeconds * $fps)

function New-SolidBrush([string]$hex) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($r, $g, $b))
}

function New-ArgbBrush([int]$alpha, [string]$hex) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
}

function New-Pen([string]$hex, [float]$size) {
  $hex = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($r, $g, $b), $size)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  return $pen
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
  [string]$align = 'Near',
  [string]$line = 'Near'
) {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$align
  $format.LineAlignment = [System.Drawing.StringAlignment]::$line
  $graphics.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x, $y, $w, $h)), $format)
  $format.Dispose()
}

function Write-Ascii([System.IO.BinaryWriter]$writer, [string]$value) {
  $writer.Write([System.Text.Encoding]::ASCII.GetBytes($value))
}

function Write-UInt16([System.IO.BinaryWriter]$writer, [uint16]$value) {
  $writer.Write([BitConverter]::GetBytes($value))
}

function Write-UInt32([System.IO.BinaryWriter]$writer, [uint32]$value) {
  $writer.Write([BitConverter]::GetBytes($value))
}

function Write-Int32([System.IO.BinaryWriter]$writer, [int32]$value) {
  $writer.Write([BitConverter]::GetBytes($value))
}

function New-BinaryData([scriptblock]$block) {
  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($stream)
  & $block $writer
  $writer.Flush()
  $bytes = $stream.ToArray()
  $writer.Dispose()
  $stream.Dispose()
  return $bytes
}

function Write-Chunk([System.IO.BinaryWriter]$writer, [string]$id, [byte[]]$bytes) {
  Write-Ascii $writer $id
  Write-UInt32 $writer ([uint32]$bytes.Length)
  $writer.Write($bytes)
  if (($bytes.Length % 2) -eq 1) {
    $writer.Write([byte]0)
  }
}

function Write-List([System.IO.BinaryWriter]$writer, [string]$type, [byte[]]$bytes) {
  Write-Ascii $writer 'LIST'
  Write-UInt32 $writer ([uint32](4 + $bytes.Length))
  Write-Ascii $writer $type
  $writer.Write($bytes)
  if (((4 + $bytes.Length) % 2) -eq 1) {
    $writer.Write([byte]0)
  }
}

$bg = New-SolidBrush '#f8fafc'
$slate = New-SolidBrush '#0f172a'
$muted = New-SolidBrush '#475569'
$subtle = New-SolidBrush '#64748b'
$white = New-SolidBrush '#ffffff'
$emerald = New-SolidBrush '#059669'
$emeraldSoft = New-SolidBrush '#d1fae5'
$cyanSoft = New-SolidBrush '#cffafe'
$orange = New-SolidBrush '#ea580c'
$orangeSoft = New-SolidBrush '#fed7aa'
$red = New-SolidBrush '#dc2626'
$redSoft = New-SolidBrush '#fee2e2'
$blueSoft = New-SolidBrush '#dbeafe'
$yellowSoft = New-SolidBrush '#fef3c7'
$shadow = New-ArgbBrush 32 '#0f172a'
$linePen = New-Pen '#cbd5e1' 2
$softLinePen = New-Pen '#e2e8f0' 2
$emeraldPen = New-Pen '#10b981' 5
$orangePen = New-Pen '#ea580c' 4

$fontFamily = 'Segoe UI'
$brandFont = New-Object System.Drawing.Font($fontFamily, 32, [System.Drawing.FontStyle]::Bold)
$heroFont = New-Object System.Drawing.Font($fontFamily, 54, [System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font($fontFamily, 42, [System.Drawing.FontStyle]::Bold)
$sectionFont = New-Object System.Drawing.Font($fontFamily, 34, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Regular)
$smallBoldFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Bold)
$metricFont = New-Object System.Drawing.Font($fontFamily, 42, [System.Drawing.FontStyle]::Bold)
$captionFont = New-Object System.Drawing.Font($fontFamily, 23, [System.Drawing.FontStyle]::Bold)

$scenes = @(
  @{ Start = 0; End = 8; Key = 'problem'; Caption = 'Cash-on-delivery orders move fast.' },
  @{ Start = 8; End = 18; Key = 'manual'; Caption = 'Manual COD confirmation creates delays, missed replies, and wasted shipping.' },
  @{ Start = 18; End = 30; Key = 'intro'; Caption = 'Akeed sends branded WhatsApp confirmation flows automatically.' },
  @{ Start = 30; End = 45; Key = 'chat'; Caption = 'Customers confirm the order and check the delivery address in a clear flow.' },
  @{ Start = 45; End = 60; Key = 'dashboard'; Caption = 'The dashboard updates with confirmed, canceled, pending, and response metrics.' },
  @{ Start = 60; End = 72; Key = 'clarity'; Caption = 'Your team can see what to ship, hold, or review.' },
  @{ Start = 72; End = 85; Key = 'setup'; Caption = 'Most stores can start without WhatsApp number or API setup.' },
  @{ Start = 85; End = 95; Key = 'closing'; Caption = 'Akeed: reliable WhatsApp COD confirmation for MENA commerce.' }
)

function Get-Scene([double]$time) {
  foreach ($scene in $scenes) {
    if ($time -ge $scene.Start -and $time -lt $scene.End) {
      return $scene
    }
  }
  return $scenes[$scenes.Count - 1]
}

function Draw-Background([System.Drawing.Graphics]$graphics) {
  $graphics.FillRectangle($bg, 0, 0, $width, $height)
  Fill-RoundedRect $graphics (New-ArgbBrush 80 '#d1fae5') 890 58 300 170 42
  Fill-RoundedRect $graphics (New-ArgbBrush 80 '#cffafe') 820 530 350 150 42
  Fill-RoundedRect $graphics (New-ArgbBrush 70 '#fed7aa') 80 555 280 120 38
  Draw-Text $graphics 'Akeed' $brandFont $emerald 70 48 220 48
}

function Draw-Caption([System.Drawing.Graphics]$graphics, [string]$caption) {
  Fill-RoundedRect $graphics (New-ArgbBrush 225 '#0f172a') 120 632 1040 58 18
  Draw-Text $graphics $caption $captionFont $white 150 643 980 38 Center Center
}

function Draw-OrderCard([System.Drawing.Graphics]$graphics, [float]$x, [float]$y, [string]$order, [string]$status, [System.Drawing.Brush]$statusBrush) {
  Fill-RoundedRect $graphics $shadow ($x + 8) ($y + 10) 260 116 24
  Fill-RoundedRect $graphics $white $x $y 260 116 24
  Stroke-RoundedRect $graphics $softLinePen $x $y 260 116 24
  Draw-Text $graphics $order $smallBoldFont $slate ($x + 22) ($y + 18) 150 28
  Fill-RoundedRect $graphics $statusBrush ($x + 22) ($y + 62) 156 34 15
  Draw-Text $graphics $status $smallBoldFont $slate ($x + 34) ($y + 68) 130 22 Center
}

function Draw-ProblemScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'COD orders move fast.' $heroFont $slate 70 135 620 140
  Draw-Text $graphics 'But confirmation still slows teams down before fulfillment.' $bodyFont $muted 74 290 570 80

  $offset = [float](20 * [Math]::Sin($progress * [Math]::PI * 2))
  Draw-OrderCard $graphics 760 (150 + $offset) '#12847' 'Unconfirmed' $yellowSoft
  Draw-OrderCard $graphics 830 (292 - $offset) '#12848' 'No reply' $redSoft
  Draw-OrderCard $graphics 705 430 '#12849' 'Waiting' $blueSoft

  Fill-RoundedRect $graphics $redSoft 110 420 180 70 22
  Draw-Text $graphics 'Failed delivery' $smallBoldFont $slate 134 444 132 28 Center
  Fill-RoundedRect $graphics $orangeSoft 320 420 190 70 22
  Draw-Text $graphics 'Reverse shipping' $smallBoldFont $slate 344 444 142 28 Center
}

function Draw-ManualScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Manual COD confirmation does not scale.' $titleFont $slate 80 118 720 120
  Draw-Text $graphics 'Calls, spreadsheets, missed replies, and held shipments drain time every week.' $bodyFont $muted 82 250 660 90

  Fill-RoundedRect $graphics $white 760 130 360 390 36
  Stroke-RoundedRect $graphics $linePen 760 130 360 390 36
  Draw-Text $graphics 'Manual queue' $sectionFont $slate 804 168 260 48
  $items = @('Call customer', 'Check address', 'Hold shipment', 'Follow up again')
  for ($i = 0; $i -lt $items.Count; $i++) {
    $y = 240 + ($i * 62)
    $itemBrush = if ($i -lt 2) { $redSoft } else { $yellowSoft }
    Fill-RoundedRect $graphics $itemBrush 804 $y 270 44 16
    Draw-Text $graphics $items[$i] $smallBoldFont $slate 826 ($y + 10) 220 24
  }

  $x2 = [float](160 + 14 * [Math]::Sin($progress * [Math]::PI * 4))
  Fill-RoundedRect $graphics $orange $x2 415 150 56 18
  Draw-Text $graphics 'Time lost' $smallBoldFont $white ($x2 + 28) 433 94 22 Center
}

function Draw-IntroScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Akeed confirms COD orders on WhatsApp.' $titleFont $slate 70 120 720 126
  Draw-Text $graphics 'Branded, rule-based flows sent through official Meta WhatsApp Cloud APIs.' $bodyFont $muted 72 270 660 82

  Fill-RoundedRect $graphics $white 790 152 335 320 42
  Stroke-RoundedRect $graphics $linePen 790 152 335 320 42
  Fill-RoundedRect $graphics $emeraldSoft 824 200 235 52 22
  Draw-Text $graphics 'New COD order' $smallBoldFont $slate 852 214 176 24 Center
  Fill-RoundedRect $graphics $blueSoft 824 282 235 52 22
  Draw-Text $graphics 'Official API send' $smallBoldFont $slate 850 296 180 24 Center
  Fill-RoundedRect $graphics $cyanSoft 824 364 235 52 22
  Draw-Text $graphics 'Customer response' $smallBoldFont $slate 846 378 190 24 Center

  $arrowPen = New-Pen '#10b981' 5
  $arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
  $graphics.DrawLine($arrowPen, 940, 260, 940, 278)
  $graphics.DrawLine($arrowPen, 940, 342, 940, 360)
  $arrowPen.Dispose()
}

function Draw-ChatScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Confirm order details and address before shipping.' $titleFont $slate 66 98 640 130
  Draw-Text $graphics 'No open-ended chat. Just a clear confirmation path for COD operations.' $bodyFont $muted 70 236 600 78

  Fill-RoundedRect $graphics $shadow 754 74 360 550 48
  Fill-RoundedRect $graphics $white 740 60 360 550 48
  Stroke-RoundedRect $graphics $linePen 740 60 360 550 48
  Fill-RoundedRect $graphics $emerald 740 60 360 72 40
  Draw-Text $graphics 'Akeed Bot' $smallBoldFont $white 790 82 180 28

  $steps = [Math]::Min(5, [int][Math]::Ceiling($progress * 5.2))
  if ($steps -ge 1) {
    Fill-RoundedRect $graphics $emeraldSoft 774 160 276 92 22
    Draw-Text $graphics "Order #12847`nConfirm this COD order?" $smallFont $slate 794 174 236 64
  }
  if ($steps -ge 2) {
    Fill-RoundedRect $graphics $emerald 915 270 128 42 18
    Draw-Text $graphics 'Confirm Order' $smallBoldFont $white 927 280 104 24 Center
  }
  if ($steps -ge 3) {
    Fill-RoundedRect $graphics $blueSoft 774 332 276 92 22
    Draw-Text $graphics "Delivery address:`n12 King Fahd Road" $smallFont $slate 794 346 236 64
  }
  if ($steps -ge 4) {
    Fill-RoundedRect $graphics $emerald 840 442 206 42 18
    Draw-Text $graphics 'Yes, address is correct' $smallBoldFont $white 854 452 178 24 Center
  }
  if ($steps -ge 5) {
    Fill-RoundedRect $graphics $emeraldSoft 774 508 276 54 22
    Draw-Text $graphics 'Confirmed and ready for shipping' $smallFont $slate 794 523 236 28 Center
  }
}

function Draw-DashboardScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'See every verification result.' $titleFont $slate 70 98 600 90
  Draw-Text $graphics 'Confirmed, canceled, awaiting response, and response rate are visible at a glance.' $bodyFont $muted 72 205 640 82

  Fill-RoundedRect $graphics $white 720 96 438 438 40
  Stroke-RoundedRect $graphics $linePen 720 96 438 438 40
  Draw-Text $graphics 'Verification dashboard' $sectionFont $slate 760 138 340 42

  Fill-RoundedRect $graphics $emeraldSoft 760 212 166 108 24
  Draw-Text $graphics 'Confirmed' $smallFont $muted 790 232 104 24 Center
  Draw-Text $graphics '84' $metricFont $emerald 810 254 80 52 Center

  Fill-RoundedRect $graphics $redSoft 952 212 166 108 24
  Draw-Text $graphics 'Canceled' $smallFont $muted 982 232 104 24 Center
  Draw-Text $graphics '16' $metricFont $slate 1002 254 80 52 Center

  Fill-RoundedRect $graphics $yellowSoft 760 344 166 108 24
  Draw-Text $graphics 'Awaiting' $smallFont $muted 790 364 104 24 Center
  Draw-Text $graphics '21' $metricFont $orange 810 386 80 52 Center

  Fill-RoundedRect $graphics $blueSoft 952 344 166 108 24
  Draw-Text $graphics 'Response' $smallFont $muted 982 364 104 24 Center
  Draw-Text $graphics '89%' $metricFont $emerald 984 386 110 52 Center
}

function Draw-ClarityScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Know what to ship, hold, or review.' $titleFont $slate 70 100 620 120
  Draw-Text $graphics 'Akeed turns customer responses into operational clarity for the fulfillment team.' $bodyFont $muted 72 246 620 84

  $labels = @('Sent', 'Delivered', 'Read', 'Responded')
  $values = @('120', '113', '98', '100')
  for ($i = 0; $i -lt 4; $i++) {
    $x = 650 + ($i * 135)
    Fill-RoundedRect $graphics $white $x 145 112 104 20
    Stroke-RoundedRect $graphics $softLinePen $x 145 112 104 20
    Draw-Text $graphics $labels[$i] $smallFont $muted ($x + 8) 162 96 24 Center
    Draw-Text $graphics $values[$i] $metricFont $slate ($x + 16) 186 80 48 Center
    if ($i -lt 3) {
      $arrow = New-Pen '#10b981' 3
      $arrow.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
      $graphics.DrawLine($arrow, ($x + 116), 197, ($x + 132), 197)
      $arrow.Dispose()
    }
  }

  Fill-RoundedRect $graphics $white 705 340 362 126 28
  Stroke-RoundedRect $graphics $linePen 705 340 362 126 28
  Draw-Text $graphics 'Money saved' $smallBoldFont $muted 734 366 140 24
  Draw-Text $graphics 'Avoided wasted shipping from canceled COD orders' $smallFont $slate 734 404 286 42
}

function Draw-SetupScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Start without WhatsApp API setup for most stores.' $titleFont $slate 70 100 700 122
  Draw-Text $graphics 'Choose language, enable auto-verification, and let the workflow run for new COD orders.' $bodyFont $muted 72 246 630 86

  Fill-RoundedRect $graphics $white 760 92 360 430 36
  Stroke-RoundedRect $graphics $linePen 760 92 360 430 36
  Draw-Text $graphics 'Store configuration' $sectionFont $slate 802 132 280 42
  Draw-Text $graphics 'Store name' $smallBoldFont $muted 806 204 160 24
  Fill-RoundedRect $graphics $blueSoft 806 234 260 42 14
  Draw-Text $graphics 'MENA Demo Store' $smallFont $slate 824 244 210 24
  Draw-Text $graphics 'Message language' $smallBoldFont $muted 806 304 180 24
  Fill-RoundedRect $graphics $emeraldSoft 806 334 260 42 14
  Draw-Text $graphics 'Arabic and English' $smallFont $slate 824 344 210 24
  Fill-RoundedRect $graphics $emerald 806 414 42 42 18
  Draw-Text $graphics '✓' $bodyFont $white 815 420 24 28 Center
  Draw-Text $graphics 'Enable auto-verification' $smallBoldFont $slate 866 422 220 28
}

function Draw-ClosingScene([System.Drawing.Graphics]$graphics, [double]$progress) {
  Draw-Text $graphics 'Akeed' $brandFont $emerald 90 95 240 48
  Draw-Text $graphics 'Reliable WhatsApp COD confirmation' $heroFont $slate 88 172 760 140
  Draw-Text $graphics 'for MENA commerce' $heroFont $slate 88 292 680 80

  Fill-RoundedRect $graphics $white 830 168 328 250 38
  Stroke-RoundedRect $graphics $linePen 830 168 328 250 38
  Draw-Text $graphics 'Confirm COD before shipping' $sectionFont $slate 866 212 258 92 Center
  Fill-RoundedRect $graphics $emeraldSoft 878 330 232 50 20
  Draw-Text $graphics 'Ship with confidence' $smallBoldFont $slate 906 344 176 24 Center

  Draw-Text $graphics 'Official Meta WhatsApp Cloud APIs. Rule-based flows. Clear dashboard.' $bodyFont $muted 92 430 620 80
}

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]82)

function New-FrameBytes([double]$time) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-Background $graphics
  $scene = Get-Scene $time
  $progress = ($time - $scene.Start) / [Math]::Max(0.1, ($scene.End - $scene.Start))
  if ($progress -lt 0) { $progress = 0 }
  if ($progress -gt 1) { $progress = 1 }

  switch ($scene.Key) {
    'problem' { Draw-ProblemScene $graphics $progress }
    'manual' { Draw-ManualScene $graphics $progress }
    'intro' { Draw-IntroScene $graphics $progress }
    'chat' { Draw-ChatScene $graphics $progress }
    'dashboard' { Draw-DashboardScene $graphics $progress }
    'clarity' { Draw-ClarityScene $graphics $progress }
    'setup' { Draw-SetupScene $graphics $progress }
    default { Draw-ClosingScene $graphics $progress }
  }

  Draw-Caption $graphics $scene.Caption

  $stream = New-Object System.IO.MemoryStream
  $bitmap.Save($stream, $jpegEncoder, $encoderParams)
  $bytes = $stream.ToArray()
  $stream.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  return $bytes
}

Write-Host "Rendering $totalFrames frames..."
$frames = New-Object 'System.Collections.Generic.List[byte[]]'
$maxFrameSize = 0
for ($i = 0; $i -lt $totalFrames; $i++) {
  $time = $i / $fps
  $bytes = New-FrameBytes $time
  $frames.Add($bytes)
  if ($bytes.Length -gt $maxFrameSize) {
    $maxFrameSize = $bytes.Length
  }
  if (($i % 50) -eq 0) {
    Write-Host "Rendered frame $i / $totalFrames"
  }
}

$avih = New-BinaryData {
  param($writer)
  Write-UInt32 $writer ([uint32](1000000 / $fps))
  Write-UInt32 $writer 0
  Write-UInt32 $writer 0
  Write-UInt32 $writer 16
  Write-UInt32 $writer ([uint32]$totalFrames)
  Write-UInt32 $writer 0
  Write-UInt32 $writer 1
  Write-UInt32 $writer ([uint32]$maxFrameSize)
  Write-UInt32 $writer ([uint32]$width)
  Write-UInt32 $writer ([uint32]$height)
  Write-UInt32 $writer 0
  Write-UInt32 $writer 0
  Write-UInt32 $writer 0
  Write-UInt32 $writer 0
}

$strh = New-BinaryData {
  param($writer)
  Write-Ascii $writer 'vids'
  Write-Ascii $writer 'MJPG'
  Write-UInt32 $writer 0
  Write-UInt16 $writer 0
  Write-UInt16 $writer 0
  Write-UInt32 $writer 0
  Write-UInt32 $writer 1
  Write-UInt32 $writer ([uint32]$fps)
  Write-UInt32 $writer 0
  Write-UInt32 $writer ([uint32]$totalFrames)
  Write-UInt32 $writer ([uint32]$maxFrameSize)
  Write-Int32 $writer -1
  Write-UInt32 $writer 0
  Write-Int32 $writer 0
  Write-Int32 $writer 0
  Write-Int32 $writer ([int32]$width)
  Write-Int32 $writer ([int32]$height)
}

$strf = New-BinaryData {
  param($writer)
  Write-UInt32 $writer 40
  Write-Int32 $writer ([int32]$width)
  Write-Int32 $writer ([int32]$height)
  Write-UInt16 $writer 1
  Write-UInt16 $writer 24
  Write-Ascii $writer 'MJPG'
  Write-UInt32 $writer ([uint32]$maxFrameSize)
  Write-Int32 $writer 0
  Write-Int32 $writer 0
  Write-UInt32 $writer 0
  Write-UInt32 $writer 0
}

$strl = New-BinaryData {
  param($writer)
  Write-Chunk $writer 'strh' $strh
  Write-Chunk $writer 'strf' $strf
}

$hdrl = New-BinaryData {
  param($writer)
  Write-Chunk $writer 'avih' $avih
  Write-List $writer 'strl' $strl
}

$moviPayloadSize = 0
foreach ($frame in $frames) {
  $moviPayloadSize += 8 + $frame.Length
  if (($frame.Length % 2) -eq 1) {
    $moviPayloadSize += 1
  }
}
$moviListSize = 4 + $moviPayloadSize

$idx1 = New-BinaryData {
  param($writer)
  $offset = 0
  foreach ($frame in $frames) {
    Write-Ascii $writer '00dc'
    Write-UInt32 $writer 16
    Write-UInt32 $writer ([uint32]$offset)
    Write-UInt32 $writer ([uint32]$frame.Length)
    $offset += 8 + $frame.Length
    if (($frame.Length % 2) -eq 1) {
      $offset += 1
    }
  }
}

if (Test-Path $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

$fileStream = [System.IO.File]::Create($outputPath)
$writer = New-Object System.IO.BinaryWriter($fileStream)

Write-Ascii $writer 'RIFF'
Write-UInt32 $writer 0
Write-Ascii $writer 'AVI '
Write-List $writer 'hdrl' $hdrl

Write-Ascii $writer 'LIST'
Write-UInt32 $writer ([uint32]$moviListSize)
Write-Ascii $writer 'movi'
foreach ($frame in $frames) {
  Write-Chunk $writer '00dc' $frame
}

Write-Chunk $writer 'idx1' $idx1

$fileSize = $fileStream.Position
$fileStream.Seek(4, [System.IO.SeekOrigin]::Begin) | Out-Null
Write-UInt32 $writer ([uint32]($fileSize - 8))

$writer.Flush()
$writer.Dispose()
$fileStream.Dispose()

Write-Host "Generated $outputPath ($width x $height, $fps fps, $durationSeconds seconds)"
