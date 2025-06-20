// /api/upload.js (on Vercel)
const FormData = require('form-data');
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });

    let fileBuffer = Buffer.alloc(0);
    let fileName = "";

    bb.on('file', (name, file, info) => {
      fileName = info.filename;
      file.on('data', (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });
    });

    bb.on('close', async () => {
      const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
      const CHAT_ID = process.env.CHAT_ID;

      if (!TELEGRAM_TOKEN || !CHAT_ID) {
        return res.status(500).send("❌ Missing environment variables");
      }

      const form = new FormData();
      form.append('chat_id', CHAT_ID);
      form.append('document', fileBuffer, fileName);

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
          method: 'POST',
          body: form
        });

        const result = await tgRes.json();
        if (result.ok) {
          res.status(200).send("✅ File sent to Cloud Server");
        } else {
          res.status(500).send("❌ Telegram Error: " + result.description);
        }
      } catch (err) {
        res.status(500).send("❌ Upload Failed: " + err.message);
      }
    });

    req.pipe(bb);
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
