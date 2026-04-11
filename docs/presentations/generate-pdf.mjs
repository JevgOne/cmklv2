import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePDF(htmlFile, pdfOutput) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const filePath = path.resolve(__dirname, htmlFile);
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 30000 });

  await page.pdf({
    path: pdfOutput,
    width: '297mm',
    height: '210mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`Generated: ${pdfOutput}`);
  await browser.close();
}

async function generatePortraitPDF(htmlFile, pdfOutput) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const filePath = path.resolve(__dirname, htmlFile);
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 30000 });

  await page.pdf({
    path: pdfOutput,
    width: '210mm',
    height: '297mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`Generated: ${pdfOutput}`);
  await browser.close();
}

const desktop = path.join(process.env.HOME, 'Desktop');

// Existing presentations
await generatePDF('carmakler-pro-autobazary.html', path.join(desktop, 'CarMakler-pro-autobazary.pdf'));
await generatePDF('carmakler-pro-vrakoviste.html', path.join(desktop, 'CarMakler-pro-vrakoviste.pdf'));

// New landscape presentations
await generatePDF('cenik-sluzeb.html', path.join(desktop, 'CarMakler-cenik-sluzeb.pdf'));
await generatePDF('landing-page-sablona.html', path.join(desktop, 'CarMakler-landing-page-sablona.pdf'));
await generatePDF('obchodni-prezentace.html', path.join(desktop, 'CarMakler-obchodni-prezentace.pdf'));
await generatePDF('onboarding-makler.html', path.join(desktop, 'CarMakler-onboarding-makler.pdf'));
await generatePDF('marketplace-investori.html', path.join(desktop, 'CarMakler-marketplace-investori.pdf'));

// Portrait (invoice template)
await generatePortraitPDF('faktura-sablona.html', path.join(desktop, 'CarMakler-faktura-sablona.pdf'));

console.log('Done!');
