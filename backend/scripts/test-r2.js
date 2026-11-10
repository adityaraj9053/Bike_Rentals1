import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import {
  buildUserDocumentKey,
  buildBikeDocumentKey,
  validateDocumentFile,
  uploadDocumentToR2,
  getSignedDocumentUrl,
  deleteDocumentFromR2,
  documentExistsInR2,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../src/services/r2Service.js';
import { isR2Configured, R2_BUCKET_NAME } from '../src/config/r2.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('       Cloudflare R2 Integration Test Suite         ');
  console.log('====================================================\n');

  // 1. Config Check
  console.log('Test 1: Environment & Client Configuration');
  assert(isR2Configured(), `R2 is configured (Bucket: ${R2_BUCKET_NAME})`);

  // 2. Folder Prefix Verification
  console.log('\nTest 2: Key & Folder Prefix Hierarchy');
  const userId = 'usr_test_987';
  const bikeId = 'bk_test_123';

  const aadhaarKey = buildUserDocumentKey(userId, 'aadhaar', 'aadhaar_card.pdf');
  assert(
    aadhaarKey.startsWith(`documents/users/${userId}/aadhaar/`) && aadhaarKey.endsWith('.pdf'),
    `User Aadhaar prefix: ${aadhaarKey}`
  );

  const dlKey = buildUserDocumentKey(userId, 'driving-licence', 'dl_scan.jpg');
  assert(
    dlKey.startsWith(`documents/users/${userId}/driving-licence/`) && dlKey.endsWith('.jpg'),
    `User Driving Licence prefix: ${dlKey}`
  );

  // Alias support
  const dlAliasKey = buildUserDocumentKey(userId, 'driving-license', 'license.png');
  assert(
    dlAliasKey.startsWith(`documents/users/${userId}/driving-licence/`) && dlAliasKey.endsWith('.png'),
    `User Driving Licence (alias) normalized prefix: ${dlAliasKey}`
  );

  const rcKey = buildBikeDocumentKey(bikeId, 'rc', 'rc_smartcard.pdf');
  assert(
    rcKey.startsWith(`documents/bikes/${bikeId}/rc/`) && rcKey.endsWith('.pdf'),
    `Bike RC prefix: ${rcKey}`
  );

  const insuranceKey = buildBikeDocumentKey(bikeId, 'insurance', 'policy.png');
  assert(
    insuranceKey.startsWith(`documents/bikes/${bikeId}/insurance/`) && insuranceKey.endsWith('.png'),
    `Bike Insurance prefix: ${insuranceKey}`
  );

  const pucKey = buildBikeDocumentKey(bikeId, 'puc', 'puc_certificate.jpeg');
  assert(
    pucKey.startsWith(`documents/bikes/${bikeId}/puc/`) && pucKey.endsWith('.jpeg'),
    `Bike PUC prefix: ${pucKey}`
  );

  // 3. File Validation Logic
  console.log('\nTest 3: Strict File Validation (PDF, JPEG, PNG, max 10MB)');
  
  // Valid PDF
  assert(
    validateDocumentFile({
      originalname: 'id_doc.pdf',
      mimetype: 'application/pdf',
      size: 500000,
      buffer: Buffer.from('%PDF-1.4 sample'),
    }),
    'Valid PDF accepted'
  );

  // Valid JPEG
  assert(
    validateDocumentFile({
      originalname: 'front.jpg',
      mimetype: 'image/jpeg',
      size: 200000,
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
    }),
    'Valid JPEG accepted'
  );

  // Valid PNG
  assert(
    validateDocumentFile({
      originalname: 'card.png',
      mimetype: 'image/png',
      size: 300000,
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    }),
    'Valid PNG accepted'
  );

  // Invalid extension / mimetype
  let caughtInvalidType = false;
  try {
    validateDocumentFile({
      originalname: 'script.exe',
      mimetype: 'application/x-msdownload',
      size: 100,
    });
  } catch (err) {
    caughtInvalidType = true;
  }
  assert(caughtInvalidType, 'Disallowed file type (.exe) correctly rejected');

  // Disallowed image type (e.g. svg or webp for confidential docs)
  let caughtDisallowedMime = false;
  try {
    validateDocumentFile({
      originalname: 'image.webp',
      mimetype: 'image/webp',
      size: 100,
    });
  } catch (err) {
    caughtDisallowedMime = true;
  }
  assert(caughtDisallowedMime, 'WebP correctly rejected (strict PDF, JPEG, PNG only)');

  // Oversized file (> 10MB)
  let caughtOversize = false;
  try {
    validateDocumentFile({
      originalname: 'huge.pdf',
      mimetype: 'application/pdf',
      size: MAX_DOCUMENT_SIZE_BYTES + 1024,
    });
  } catch (err) {
    caughtOversize = true;
  }
  assert(caughtOversize, 'Oversized file (>10MB) correctly rejected');

  // 4. Live R2 Upload, Signed URL, and Deletion
  console.log('\nTest 4: Live Cloudflare R2 Operations (Upload, Presign, Head, Delete)');
  try {
    const testBuffer = Buffer.from('%PDF-1.4 Cloudflare R2 Integration Test Document');
    const testKey = buildUserDocumentKey('test_user_suite', 'aadhaar', 'test_identity.pdf');

    // Upload
    const uploadRes = await uploadDocumentToR2({
      fileBuffer: testBuffer,
      key: testKey,
      mimeType: 'application/pdf',
      metadata: { testSuite: 'true' },
    });
    assert(uploadRes && uploadRes.key === testKey, `Successfully uploaded test document to: ${testKey}`);

    // Verify existence
    const exists = await documentExistsInR2(testKey);
    assert(exists === true, 'HeadObject confirms document exists in private R2 bucket');

    // Generate signed URL (valid for 15 minutes)
    const signedUrl = await getSignedDocumentUrl(testKey, 900);
    assert(
      typeof signedUrl === 'string' &&
        signedUrl.includes(R2_BUCKET_NAME) &&
        signedUrl.includes('X-Amz-Signature') &&
        signedUrl.includes('X-Amz-Expires=900'),
      'Presigned expiring URL generated with 900s (15 min) duration'
    );

    // Delete
    const deleteRes = await deleteDocumentFromR2(testKey);
    assert(deleteRes.success === true, 'Test document successfully deleted from R2');

    // Confirm deletion
    const existsAfterDelete = await documentExistsInR2(testKey);
    assert(existsAfterDelete === false, 'Document no longer exists in bucket after deletion');
  } catch (error) {
    console.error('  [FAIL] Live R2 test failed:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

