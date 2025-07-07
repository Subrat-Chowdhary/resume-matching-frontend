import { NextRequest, NextResponse } from "next/server";
import { Client as MinioClient } from "minio";

// MinIO configuration
const minioClient = new MinioClient({
  endPoint: '157.180.44.51',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export async function POST(req: NextRequest) {
  try {
    const { minio_path, filename } = await req.json();

    if (!minio_path || !filename) {
      return NextResponse.json({ error: "Missing minio_path or filename" }, { status: 400 });
    }

    console.log("Downloading file:", { minio_path, filename });

    // Parse the minio_path to extract bucket and object name
    // Expected format: "bucket-name/path/to/file.pdf"
    const pathParts = minio_path.split('/');
    if (pathParts.length < 2) {
      return NextResponse.json({ error: "Invalid minio_path format" }, { status: 400 });
    }

    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');

    console.log("MinIO details:", { bucketName, objectName });

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      console.error("Bucket does not exist:", bucketName);
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    // Get the object from MinIO
    const stream = await minioClient.getObject(bucketName, objectName);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    console.log("File downloaded successfully, size:", fileBuffer.length);

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      switch (ext) {
        case 'pdf':
          return 'application/pdf';
        case 'doc':
          return 'application/msword';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'txt':
          return 'text/plain';
        default:
          return 'application/octet-stream';
      }
    };

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(filename),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Download error:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: err.message 
    }, { status: 500 });
  }
}
