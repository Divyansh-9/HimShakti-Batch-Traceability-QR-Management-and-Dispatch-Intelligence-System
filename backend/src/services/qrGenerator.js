const QRCode = require('qrcode');

async function generateBatchQR(batchCode) {
  const absoluteUrl = `${process.env.PUBLIC_BASE_URL}/trace/${batchCode}`;

  const dataUrl = await QRCode.toDataURL(absoluteUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a4731',
      light: '#ffffff'
    }
  });

  return { dataUrl, absoluteUrl };
}

module.exports = { generateBatchQR };
