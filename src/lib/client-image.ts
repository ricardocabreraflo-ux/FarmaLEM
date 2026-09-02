/** Reduce una foto a máx. 1800 px por lado y la devuelve en base64 JPEG (solo navegador). */
export async function compressToBase64(file: File, maxSide = 1800, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen."))), "image/jpeg", quality)
  );
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const file2 = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  return { base64: dataUrl.split(",")[1], file: file2, previewUrl: URL.createObjectURL(blob) };
}
