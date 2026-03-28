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

const desktop = path.join(process.env.HOME, 'Desktop');

await generatePDF('carmakler-pro-autobazary.html', path.join(desktop, 'CarMakler-pro-autobazary.pdf'));
await generatePDF('carmakler-pro-vrakoviste.html', path.join(desktop, 'CarMakler-pro-vrakoviste.pdf'));

console.log('Done!');
