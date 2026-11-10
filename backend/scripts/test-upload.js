import express from 'express';
import { extractPublicId } from '../src/services/cloudinaryService.js';
import uploadRoutes from '../src/routes/uploadRoutes.js';

async function runTests() {
  console.log('--- Starting Cloudinary Upload & Delete Integration Tests ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
    }
  }

  // Test 1: extractPublicId helper
  console.log('\n[Suite 1]: extractPublicId helper');
  assert(
    extractPublicId('https://res.cloudinary.com/dmflrvkpv/image/upload/v1794300390/bike_images/kxwh8sdvqgzyamibjsnv.png') === 'bike_images/kxwh8sdvqgzyamibjsnv',
    'Extracts public_id from versioned Cloudinary URL'
  );
  assert(
    extractPublicId('https://res.cloudinary.com/dmflrvkpv/image/upload/bike_images/kxwh8sdvqgzyamibjsnv.jpg') === 'bike_images/kxwh8sdvqgzyamibjsnv',
    'Extracts public_id from unversioned Cloudinary URL'
  );
  assert(
    extractPublicId('bike_images/kxwh8sdvqgzyamibjsnv') === 'bike_images/kxwh8sdvqgzyamibjsnv',
    'Preserves raw public_id input'
  );
  assert(
    extractPublicId(null) === null,
    'Returns null for null input'
  );

  // Test 2: Express App integration with upload routes
  console.log('\n[Suite 2]: Route registration and HTTP handling');
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/upload', uploadRoutes);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/upload`;

  try {
    // Test 2.1: POST with no file
    const emptyPostRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'POST',
    });
    const emptyPostJson = await emptyPostRes.json();
    assert(
      emptyPostRes.status === 400 && emptyPostJson.success === false,
      `Rejects empty upload with 400 Bad Request (got: ${emptyPostRes.status}, message: "${emptyPostJson.message}")`
    );

    // Test 2.2: POST with invalid file type (e.g. text/plain)
    const formDataInvalid = new FormData();
    const badFile = new Blob(['not an image content'], { type: 'text/plain' });
    formDataInvalid.append('image', badFile, 'sample.txt');

    const badFileRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'POST',
      body: formDataInvalid,
    });
    const badFileJson = await badFileRes.json();
    assert(
      badFileRes.status === 400 && badFileJson.success === false && badFileJson.message.includes('Only JPG, PNG, and WebP'),
      `Rejects invalid file type (.txt) with 400 and clear error message (got: ${badFileRes.status}, message: "${badFileJson.message}")`
    );

    // Test 2.3: POST with invalid file type (.pdf)
    const formDataPdf = new FormData();
    const pdfFile = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });
    formDataPdf.append('images', pdfFile, 'document.pdf');

    const pdfRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'POST',
      body: formDataPdf,
    });
    const pdfJson = await pdfRes.json();
    assert(
      pdfRes.status === 400 && pdfJson.success === false,
      `Rejects .pdf upload with 400 (got: ${pdfRes.status}, message: "${pdfJson.message}")`
    );

    // Test 2.4: DELETE with missing public_id
    const emptyDeleteRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const emptyDeleteJson = await emptyDeleteRes.json();
    assert(
      emptyDeleteRes.status === 400 && emptyDeleteJson.success === false,
      `DELETE rejects missing public_id with 400 (got: ${emptyDeleteRes.status}, message: "${emptyDeleteJson.message}")`
    );

    // Test 2.5: End-to-end live upload of a single valid image (PNG)
    console.log('\n[Suite 3]: End-to-end Cloudinary live upload and deletion');
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const pngBuffer = Buffer.from(tinyPngBase64, 'base64');
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const singleUploadForm = new FormData();
    singleUploadForm.append('image', pngBlob, 'bike_front.png');

    const singleUploadRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'POST',
      body: singleUploadForm,
    });
    const singleUploadJson = await singleUploadRes.json();

    assert(
      singleUploadRes.status === 200 &&
      singleUploadJson.success === true &&
      Boolean(singleUploadJson.secure_url) &&
      Boolean(singleUploadJson.public_id) &&
      singleUploadJson.public_id.startsWith('bike_images/'),
      `Single upload returns 200 with secure_url and public_id in bike_images/ (public_id: ${singleUploadJson.public_id})`
    );

    const uploadedPublicId = singleUploadJson.public_id;

    // Test 2.6: End-to-end live upload of multiple images (2 images)
    const multiUploadForm = new FormData();
    multiUploadForm.append('images', new Blob([pngBuffer], { type: 'image/png' }), 'bike_rear.png');
    multiUploadForm.append('images', new Blob([pngBuffer], { type: 'image/png' }), 'bike_side.png');

    const multiUploadRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'POST',
      body: multiUploadForm,
    });
    const multiUploadJson = await multiUploadRes.json();

    assert(
      multiUploadRes.status === 200 &&
      multiUploadJson.success === true &&
      Array.isArray(multiUploadJson.data) &&
      multiUploadJson.data.length === 2 &&
      multiUploadJson.data.every((item) => item.secure_url && item.public_id.startsWith('bike_images/')),
      `Multiple uploads return 200 with array of uploaded items (count: ${multiUploadJson.count})`
    );

    const multiPublicIds = multiUploadJson.data.map((d) => d.public_id);

    // Test 2.7: Delete image via DELETE /api/upload/bike-images with JSON body
    const deleteRes = await fetch(`${baseUrl}/bike-images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: uploadedPublicId }),
    });
    const deleteJson = await deleteRes.json();

    assert(
      deleteRes.status === 200 &&
      deleteJson.success === true &&
      deleteJson.data.result === 'ok',
      `DELETE single image succeeds on Cloudinary (result: "${deleteJson.data?.result}")`
    );

    // Test 2.8: Batch delete remaining images via POST /api/upload/bike-images/batch-delete
    const batchDelRes = await fetch(`${baseUrl}/bike-images/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_ids: multiPublicIds }),
    });
    const batchDelJson = await batchDelRes.json();

    assert(
      batchDelRes.status === 200 &&
      batchDelJson.success === true &&
      batchDelJson.data.length === 2 &&
      batchDelJson.data.every((d) => d.result === 'ok'),
      `Batch delete removes all multiple images from Cloudinary (count: ${batchDelJson.count})`
    );

    console.log(`\n=================================================`);
    console.log(`ALL TESTS PASSED: ${passed}/${total} assertions passed!`);
    console.log(`=================================================`);
  } finally {
    server.close();
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
