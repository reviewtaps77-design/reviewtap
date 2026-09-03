"use client";

import { useRef, useState } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { ImagePlus } from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseStorage() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
    throw new Error("Firebase Storage is not configured for this deployment.");
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getStorage(app);
}

async function compressImage(file: File, maxWidth: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("Unable to process this image.");
  return blob;
}

async function uploadImage(file: File, path: string, maxWidth: number, onProgress: (progress: number) => void) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");
  const blob = await compressImage(file, maxWidth);
  const imageId = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imageRef = ref(getFirebaseStorage(), `${path}/${imageId}.webp`);
  const upload = uploadBytesResumable(imageRef, blob, { contentType: "image/webp" });

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = upload.on(
      "state_changed",
      (snapshot) => onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      (uploadError) => {
        clearTimeout(timeoutId);
        unsubscribe();
        reject(new Error(uploadError.code === "storage/unauthorized"
          ? "Firebase Storage rejected the upload. Check your Storage rules."
          : uploadError.message));
      },
      async () => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(await getDownloadURL(upload.snapshot.ref));
      },
    );
    const timeoutId = window.setTimeout(() => {
      upload.cancel();
      reject(new Error("Upload timed out. Check your internet connection and Firebase Storage setup."));
    }, 45_000);
  });
}

export function BusinessImageUpload({
  businessId,
  logoUrl,
  coverUrl,
}: {
  businessId: string;
  logoUrl: string;
  coverUrl: string;
}) {
  const [logo, setLogo] = useState(logoUrl);
  const [cover, setCover] = useState(coverUrl);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [processing, setProcessing] = useState<"logo" | "cover" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleUpload = async (kind: "logo" | "cover", file?: File) => {
    if (!file) return;
    setError("");
    setUploading(kind);
    setProcessing(kind);
    setProgress(0);
    try {
      const url = await uploadImage(file, `businesses/${businessId}/${kind}`, kind === "logo" ? 512 : 1600, setProgress);
      if (kind === "logo") {
        setLogo(url);
        if (logoInput.current) logoInput.current.value = url;
      } else {
        setCover(url);
        if (coverInput.current) coverInput.current.value = url;
      }
      document.querySelector<HTMLFormElement>("form[data-business-profile]")?.requestSubmit();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(null);
      setProcessing(null);
      setProgress(0);
    }
  };

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
      <input ref={logoInput} type="hidden" name="logoUrl" defaultValue={logo} />
      <input ref={coverInput} type="hidden" name="coverUrl" defaultValue={cover} />
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">Business Image / Icon</p>
        <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 hover:border-primary">
          {logo ? <img src={logo} alt="Business image preview" className="h-20 w-20 rounded-lg object-cover" /> : <ImagePlus className="h-8 w-8 text-slate-400" />}
          <span className="text-xs text-slate-500">{processing === "logo" && progress === 0 ? "Processing image..." : uploading === "logo" ? `Uploading ${progress}%` : "Choose image from device"}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleUpload("logo", event.target.files?.[0])} disabled={uploading !== null} />
        </label>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">Customer Page Background</p>
        <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 hover:border-primary">
          {cover ? <img src={cover} alt="Customer page background preview" className="h-20 w-28 rounded-lg object-cover" /> : <ImagePlus className="h-8 w-8 text-slate-400" />}
          <span className="text-xs text-slate-500">{processing === "cover" && progress === 0 ? "Processing image..." : uploading === "cover" ? `Uploading ${progress}%` : "Choose image from device"}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleUpload("cover", event.target.files?.[0])} disabled={uploading !== null} />
        </label>
      </div>
      <p className="md:col-span-2 text-[11px] text-slate-400">Maximum file size: 5 MB. Save profile changes after both uploads finish.</p>
      {error && <p className="md:col-span-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
