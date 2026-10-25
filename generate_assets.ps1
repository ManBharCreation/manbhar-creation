Add-Type -AssemblyName System.Drawing

$assetsDir = "C:\Users\bbhar\.gemini\antigravity\scratch\kurta-shop\assets"
$srcImgPath = "$assetsDir\inpainted.png"
$src = New-Object System.Drawing.Bitmap $srcImgPath

$cx = 155.0
$cy = 155.0
$radius = 151.0

# 1. Generate master high-res transparent logo (302x302)
$masterSize = 302
$master = New-Object System.Drawing.Bitmap($masterSize, $masterSize)

for ($y = 0; $y -lt $masterSize; $y++) {
    for ($x = 0; $x -lt $masterSize; $x++) {
        $dx = $x - ($masterSize / 2.0)
        $dy = $y - ($masterSize / 2.0)
        $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)

        # Source coordinate in inpainted.png
        $sx = [int]($cx + $dx)
        $sy = [int]($cy + $dy)

        if ($sx -ge 0 -and $sx -lt $src.Width -and $sy -ge 0 -and $sy -lt $src.Height) {
            $c = $src.GetPixel($sx, $sy)

            if ($dist -le ($radius - 1.0)) {
                # Completely inside circle
                $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
            } elseif ($dist -le ($radius + 1.0)) {
                # Smooth antialiasing edge
                $alpha = [int](255 * (1.0 - ($dist - ($radius - 1.0)) / 2.0))
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
            } else {
                # Outside circle - fully transparent
                $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        } else {
            $master.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

# Function to resize with high quality
function Resize-Image($srcBmp, $newW, $newH) {
    $dest = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($srcBmp, 0, 0, $newW, $newH)
    $g.Dispose()
    return $dest
}

# Save standard logo.png (300x300)
$logo300 = Resize-Image $master 300 300
$logo300.Save("$assetsDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logo300.Dispose()

# Save logo@2x.png (600x600)
$logo600 = Resize-Image $master 600 600
$logo600.Save("$assetsDir\logo@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logo600.Dispose()

# Favicon 16x16
$fav16 = Resize-Image $master 16 16
$fav16.Save("$assetsDir\favicon-16x16.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fav16.Dispose()

# Favicon 32x32
$fav32 = Resize-Image $master 32 32
$fav32.Save("$assetsDir\favicon-32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fav32.Dispose()

# Apple Touch Icon 180x180
$apple180 = Resize-Image $master 180 180
$apple180.Save("$assetsDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$apple180.Dispose()

# Android Chrome 192x192
$chrome192 = Resize-Image $master 192 192
$chrome192.Save("$assetsDir\android-chrome-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$chrome192.Dispose()

# Android Chrome 512x512
$chrome512 = Resize-Image $master 512 512
$chrome512.Save("$assetsDir\android-chrome-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$chrome512.Dispose()

Write-Host "Logo and icons generated successfully."

# 6. Generate Open Graph Image (1200x630 canvas)
$ogW = 1200
$ogH = 630
$ogBmp = New-Object System.Drawing.Bitmap $ogW, $ogH
$gOg = [System.Drawing.Graphics]::FromImage($ogBmp)
$gOg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gOg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gOg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Dark luxury gradient background (#0B0F1A to #05080E)
$rect = New-Object System.Drawing.Rectangle 0, 0, $ogW, $ogH
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 11, 15, 26),
    [System.Drawing.Color]::FromArgb(255, 5, 8, 14),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)
$gOg.FillRectangle($bgBrush, $rect)
$bgBrush.Dispose()

# Subtle gold border inside
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 201, 162, 75), 3)
$gOg.DrawRectangle($goldPen, 20, 20, $ogW - 40, $ogH - 40)
$goldPenThin = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 201, 162, 75), 1)
$gOg.DrawRectangle($goldPenThin, 26, 26, $ogW - 52, $ogH - 52)
$goldPen.Dispose()
$goldPenThin.Dispose()

# Subtle radial gold glow behind logo
$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 201, 162, 75))
$gOg.FillEllipse($glowBrush, 470, 70, 260, 260)
$glowBrush.Dispose()

# Draw centered logo (240x240)
$logoSize = 240
$logoX = [int](($ogW - $logoSize) / 2) # 480
$logoY = 80
$gOg.DrawImage($master, $logoX, $logoY, $logoSize, $logoSize)

# Gold Title Font: MANBHAR CREATION
$titleFont = New-Object System.Drawing.Font("Georgia", 34, [System.Drawing.FontStyle]::Bold)
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 230, 198, 117))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center

$gOg.DrawString("MANBHAR CREATION", $titleFont, $goldBrush, ($ogW / 2), 350, $sf)

# Subtitle Font: MEN'S KURTA & ETHNIC WEAR
$subFont = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$creamBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 235, 220))
$gOg.DrawString("MEN'S KURTA & ETHNIC WEAR STUDIO", $subFont, $creamBrush, ($ogW / 2), 415, $sf)

# Tagline
$tagFont = New-Object System.Drawing.Font("Georgia", 15, [System.Drawing.FontStyle]::Italic)
$mutedGoldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 201, 162, 75))
$gOg.DrawString("Festive • Wedding • Casual • Everyday Ethnic Styles", $tagFont, $mutedGoldBrush, ($ogW / 2), 465, $sf)

# Badge: Order on WhatsApp
$waFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
$waBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 211, 102))
$waRect = New-Object System.Drawing.Rectangle 470, 520, 260, 42
$gOg.FillRectangle($waBgBrush, $waRect)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$gOg.DrawString("Direct WhatsApp Ordering", $waFont, $whiteBrush, (New-Object System.Drawing.RectangleF 470, 520, 260, 42), $sfCenter)

# Save OG Image
$ogBmp.Save("$assetsDir\og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ogBmp.Save("$assetsDir\og-image.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

$gOg.Dispose()
$ogBmp.Dispose()
$master.Dispose()
$src.Dispose()

Write-Host "OG Images saved successfully."
