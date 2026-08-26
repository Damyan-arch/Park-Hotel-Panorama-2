const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// DigitalOcean Spaces is S3-API-compatible — same client, pointed at Spaces' endpoint
// instead of AWS. Uploads land here instead of local disk because App Platform's
// filesystem is rebuilt on every deploy/restart, so anything written to disk at
// runtime (admin-uploaded photos) would otherwise be lost.
let client = null;

function getClient() {
  if (client) return client;

  const { SPACES_REGION, SPACES_KEY, SPACES_SECRET } = process.env;
  if (!SPACES_REGION || !SPACES_KEY || !SPACES_SECRET) {
    throw new Error("SPACES_REGION, SPACES_KEY and SPACES_SECRET must be set to upload images.");
  }

  client = new S3Client({
    endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
    region: SPACES_REGION,
    credentials: { accessKeyId: SPACES_KEY, secretAccessKey: SPACES_SECRET }
  });
  return client;
}

// Uploads a buffer under `uploads/<filename>` and returns its public URL.
// Prefers the CDN endpoint (SPACES_CDN_ENDPOINT) when configured, since DO's
// Spaces CDN caches images at the edge instead of serving every request from
// the origin bucket.
async function uploadImage(filename, buffer, contentType) {
  const bucket = process.env.SPACES_BUCKET;
  if (!bucket) throw new Error("SPACES_BUCKET must be set to upload images.");

  const key = `uploads/${filename}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  const base =
    process.env.SPACES_CDN_ENDPOINT || `https://${bucket}.${process.env.SPACES_REGION}.digitaloceanspaces.com`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

module.exports = { uploadImage };
