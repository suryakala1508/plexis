import AWS from 'aws-sdk';
import { ENV } from '../../config/env';

// Extract region from endpoint (e.g., blr1 from blr1.digitaloceanspaces.com)
const getRegionFromEndpoint = (endpoint: string) => {
    const match = endpoint.match(/^([^.]+)\./);
    return match ? match[1] : 'us-east-1';
};

// Configure DigitalOcean Spaces
// Sanitize endpoint: handle .env concatenation and remove any protocol/junk
const rawEndpoint = ENV.DO_SPACES_ENDPOINT! || 'blr1.digitaloceanspaces.com';
const sanitizedEndpoint = rawEndpoint
    .replace(/(digitaloceanspaces\.com).*/i, '$1')
    .replace(/^https?:\/\//, '')
    .trim();
console.log('🚀 [DigitalOcean] Raw Endpoint:', rawEndpoint);
console.log('🚀 [DigitalOcean] Sanitized Endpoint:', sanitizedEndpoint);
const spacesEndpoint = new AWS.Endpoint(sanitizedEndpoint);
const region = getRegionFromEndpoint(sanitizedEndpoint);

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: ENV.DO_SPACES_ACCESS_KEY,
    secretAccessKey: ENV.DO_SPACES_SECRET_KEY,
    region: region,
    s3BucketEndpoint: false,
    s3ForcePathStyle: false
});

export const uploadtoDO = async (file: any) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${sanitized}`;

    const params = {
        Bucket: ENV.DO_SPACES_BUCKET_NAME!,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype
    };

    return s3.upload(params).promise();
};

export const uploadToRefnoFolder = async (file: any): Promise<string> => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `refno/${timestamp}-${sanitized}`;

    const params = {
        Bucket: ENV.DO_SPACES_BUCKET_NAME!,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype
    };

    const result = await s3.upload(params).promise();
    return result.Location;
};

export const uploadPdfToDigitalOcean = async (buffer: Buffer, companyName: string, documentType: 'quotation' | 'contract'): Promise<string> => {
    const timestamp = Date.now();
    const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${documentType}/${sanitizedCompanyName}_${timestamp}.pdf`;

    const params = {
        Bucket: ENV.DO_SPACES_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'application/pdf',
        ContentDisposition: 'inline'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
};

export const deleteFromDO = async (fileUrl: string) => {
    if (!fileUrl) return;

    try {
        // Extract Key from URL
        // URL format: https://bucket.region.digitaloceanspaces.com/key
        // or https://region.digitaloceanspaces.com/bucket/key (if path style)
        
        let key = '';
        const bucketName = ENV.DO_SPACES_BUCKET_NAME!;
        
        if (fileUrl.includes(bucketName)) {
            // Assume logic like: .../bucketName/key or ...bucketName.endpoint/key
             const urlObj = new URL(fileUrl);
             key = urlObj.pathname.substring(1); // Remove leading slash
        } else {
             // Fallback if bucket not in URL (unlikely via standard S3 return)
             const urlObj = new URL(fileUrl);
             key = urlObj.pathname.substring(1);
        }

        const params = {
            Bucket: ENV.DO_SPACES_BUCKET_NAME!,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log(`✅ Deleted file from DO: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete file from DO: ${fileUrl}`, error);
        return false;
    }
};

// module.exports = { uploadtoDO, uploadPdfToDigitalOcean };
