import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { DEBUG_API } from "@/lib/utils/debugApi";

// Increase timeout for Next.js API route
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Validate Cloudinary configuration
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      if (DEBUG_API) {
        console.error("Cloudinary config missing:", {
          hasCloudName: !!cloudName,
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
        });
      }
      return NextResponse.json(
        {
          error: "Cloudinary chưa được cấu hình. Vui lòng kiểm tra file .env.local và restart server.",
        },
        { status: 500 }
      );
    }

    // Configure Cloudinary (reconfigure on each request to ensure fresh config)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "pickleball-shop/products";

    if (!file) {
      return NextResponse.json(
        { error: "Không có file được tải lên" },
        { status: 400 }
      );
    }

    if (DEBUG_API) {
      console.log(`[Upload] Starting upload for file: ${file.name}, size: ${file.size} bytes, folder: ${folder}`);
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using upload_stream (faster than base64)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          timeout: 60000, // 60 seconds
        },
        (error, result) => {
          if (error) {
            console.error("[Upload] Cloudinary error:", error);
            reject(error);
          } else {
            console.log("[Upload] Success:", result?.secure_url);
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    });
  } catch (error: any) {
    if (DEBUG_API) {
      console.error("[Upload] Error:", error);
    }
    const errorMessage = error.message || "Lỗi khi upload ảnh";
    
    // Provide more specific error messages
    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "Upload timeout - ảnh quá lớn hoặc kết nối chậm. Vui lòng thử lại với ảnh nhỏ hơn (< 2MB)." },
        { status: 408 }
      );
    }
    
    if (errorMessage.includes("Invalid API")) {
      return NextResponse.json(
        { error: "Cloudinary API key không hợp lệ. Vui lòng kiểm tra lại cấu hình." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

