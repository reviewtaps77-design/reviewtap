"use client";

import { useState } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2 } from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseStorage() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getStorage(app);
}

async function uploadImage(file: File, path: string) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");
  const imageRef = ref(getFirebaseStorage(), `${path}/${crypto.randomUUID()}-${file.name}`);
  const snapshot = await uploadBytes(imageRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
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
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async (kind: "logo" | "cover", file?: File) => {
    if (!file) return;
    setError("");
    setUploading(kind);
    try {
      const url = await uploadImage(file, `businesses/${businessId}/${kind}`);
      if (kind === "logo") setLogo(url);
      else setCover(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
      <input type="hidden" name="logoUrl" value={logo} />
      <input type="hidden" name="coverUrl" value={cover} />
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">Business Image / Icon</p>
        <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 hover:border-primary">
          {logo ? <img src={logo} alt="Business image preview" className="h-20 w-20 rounded-lg object-cover" /> : <ImagePlus className="h-8 w-8 text-slate-400" />}
          <span className="text-xs text-slate-500">{uploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose image from device"}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleUpload("logo", event.target.files?.[0])} disabled={uploading !== null} />
        </label>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700">Customer Page Background</p>
        <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 hover:border-primary">
          {cover ? <img src={cover} alt="Customer page background preview" className="h-20 w-28 rounded-lg object-cover" /> : <ImagePlus className="h-8 w-8 text-slate-400" />}
          <span className="text-xs text-slate-500">{uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose image from device"}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleUpload("cover", event.target.files?.[0])} disabled={uploading !== null} />
        </label>
      </div>
      <p className="md:col-span-2 text-[11px] text-slate-400">Maximum file size: 5 MB. Save profile changes after both uploads finish.</p>
      {error && <p className="md:col-span-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
