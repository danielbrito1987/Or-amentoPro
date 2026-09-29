const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- Starting image processing for OrçaFácil Pro ---');

// 1. Process Icon (Square)
console.log('1. Processing icon...');
execSync(`convert src/assets/images/orcafacil_exact_icon_1790685443638.jpg -fuzz 12% -trim +repage /tmp/raw_icon.png`);

// Clean transparent background from outside squircle
execSync(`convert /tmp/raw_icon.png -bordercolor white -border 2 -fill none -draw "matte 0,0 floodfill" -shave 2x2 -resize 512x512 public/favicon.png`);
execSync(`convert public/favicon.png -resize 192x192 public/favicon-192.png`);
execSync(`convert public/favicon.png -resize 32x32 public/favicon-32.png`);
execSync(`cp public/favicon.png public/logo_orca_facil_icon.png`);
execSync(`convert public/favicon-32.png public/favicon.ico`);
console.log('Favicons and square icon created successfully!');

// 2. Process Horizontal Logo
console.log('2. Processing horizontal logo...');
execSync(`convert src/assets/images/orcafacil_exact_logo_1790685431520.jpg -fuzz 12% -trim +repage /tmp/raw_logo.png`);
execSync(`convert /tmp/raw_logo.png -bordercolor white -border 2 -fill none -draw "matte 0,0 floodfill" -shave 2x2 /tmp/floodfilled_logo.png`);

// Convert to PAM temp file to avoid buffer limits
execSync(`convert /tmp/floodfilled_logo.png -depth 8 pam:/tmp/temp_logo.pam`);

const pamFF = fs.readFileSync('/tmp/temp_logo.pam');
const idxFF = pamFF.indexOf('ENDHDR\n') + 7;
const ffHeader = pamFF.slice(0, idxFF).toString();
const mFF = ffHeader.match(/WIDTH (\d+)\nHEIGHT (\d+)/);
const wFF = parseInt(mFF[1]), hFF = parseInt(mFF[2]);
console.log(`Logo dimensions: ${wFF}x${hFF}`);

const dataFF = Buffer.from(pamFF.slice(idxFF));

// In this horizontal image:
// Icon is left 0% to ~17%
// Text "OrçaFácil" is ~17% to ~85%
// PRO badge is ~85% to 100%
const textStartX = Math.floor(wFF * 0.17);
const textEndX = Math.floor(wFF * 0.85);

for (let y = 0; y < hFF; y++) {
  for (let x = 0; x < wFF; x++) {
    const offset = (y * wFF + x) * 4;
    const r = dataFF[offset];
    const g = dataFF[offset + 1];
    const b = dataFF[offset + 2];
    const a = dataFF[offset + 3];

    // Inside text region:
    if (x >= textStartX && x <= textEndX) {
      if (r > 210 && g > 210 && b > 210) {
        dataFF[offset + 3] = 0; // Pure transparent
      } else if (r > 185 && g > 185 && b > 185) {
        // Soft edge anti-aliasing
        const maxVal = Math.max(r, g, b);
        const factor = Math.max(0, (255 - maxVal) / 70);
        dataFF[offset + 3] = Math.floor(a * factor);
      }
    }
  }
}

// Write back processed PAM
const outPam = Buffer.concat([pamFF.slice(0, idxFF), dataFF]);
fs.writeFileSync('/tmp/processed_logo.pam', outPam);

execSync(`convert /tmp/processed_logo.pam public/logo_orca_facil_transparent.png`);
execSync(`cp public/logo_orca_facil_transparent.png public/logo_orca_facil.png`);
console.log('Transparent logo saved to public/logo_orca_facil.png');

// Create dark mode variant (where dark text 'Orça' is pure white)
const darkData = Buffer.from(dataFF);
const orcaEndX = Math.floor(wFF * 0.52);

for (let y = 0; y < hFF; y++) {
  for (let x = textStartX; x < orcaEndX; x++) {
    const offset = (y * wFF + x) * 4;
    const r = darkData[offset];
    const g = darkData[offset + 1];
    const b = darkData[offset + 2];
    const a = darkData[offset + 3];

    // If it is dark text (Orça), make it white with preserved alpha!
    if (a > 30 && r < 120 && g < 120 && b < 140) {
      darkData[offset] = 255;
      darkData[offset + 1] = 255;
      darkData[offset + 2] = 255;
    }
  }
}

const darkPam = Buffer.concat([pamFF.slice(0, idxFF), darkData]);
fs.writeFileSync('/tmp/processed_logo_dark.pam', darkPam);
execSync(`convert /tmp/processed_logo_dark.pam public/logo_orca_facil_white.png`);
console.log('White-text logo saved to public/logo_orca_facil_white.png');

console.log('All image processing completed successfully!');
