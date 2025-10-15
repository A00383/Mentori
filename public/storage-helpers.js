import { supabase, IMGS_BUCKET } from "./supabase.js";

/**
 * Upload a Blob/File to Supabase storage, path is like `${docId}/main_imgs/img0.png`.
 * Returns public URL string.
 */
export async function uploadBlobToBucket(blobOrFile, path) {
    if (!blobOrFile) throw new Error("No file/blob provided to uploadBlobToBucket");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData?.user) throw new Error("You must be logged in to upload files.");

    const { data, error } = await supabase.storage
        .from(IMGS_BUCKET)
        .upload(path, blobOrFile, { upsert: true });

    if (error) {
        console.error("❌ uploadBlobToBucket upload error:", error.message);
        throw error;
    }

    const { data: publicData } = await supabase.storage
        .from(IMGS_BUCKET)
        .getPublicUrl(path);

    return publicData?.publicUrl || null;
}

/**
 * List all files inside a Supabase Storage folder.
 */
export async function listBucketFiles(path) {
    const { data, error } = await supabase.storage.from(IMGS_BUCKET).list(path, {
        limit: 100,
        offset: 0,
    });
    if (error) {
        console.warn("⚠️ listBucketFiles error:", error.message);
        return [];
    }
    return data || [];
}

/**
 * Get the public URL for a file in the bucket.
 */
export function getPublicUrlForPath(path) {
    const { data } = supabase.storage.from(IMGS_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
}

/**
 * Converts data URLs to Blob.
 */
export function dataURLToBlob(dataURL) {
    const parts = dataURL.split(",");
    const header = parts[0];
    const base64 = parts[1];
    const matches = header.match(/data:(.*?);base64/);
    const contentType = matches ? matches[1] : "application/octet-stream";
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: contentType });
}

/**
 * Get a Blob from an image src (either dataURL or URL).
 */
export async function getBlobFromSrc(src) {
    if (!src) throw new Error("No src provided to getBlobFromSrc");
    if (src.startsWith("data:")) return dataURLToBlob(src);
    const resp = await fetch(src);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    return await resp.blob();
}

/**
 * Get file extension from MIME type.
 */
export function extensionFromMime(mime) {
    if (!mime) return "png";
    const parts = mime.split("/");
    if (parts.length === 2) {
        const ext = parts[1].split("+")[0];
        if (ext === "jpeg") return "jpg";
        return ext;
    }
    return "png";
}
