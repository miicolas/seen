export interface FormUploadResult {
  ok: boolean;
  status: number;
  payload: unknown;
}

// Posts multipart FormData through React Native's XMLHttpRequest (RCTNetworking),
// which supports RN's `{ uri, name, type }` file parts. The global `fetch` is
// Expo's (`expo/fetch`), whose `convertFormData` rejects uri file parts with
// "Unsupported FormDataPart implementation" — so file uploads must use XHR.
export function uploadFormData(
  url: string,
  headers: Record<string, string>,
  form: FormData,
): Promise<FormUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, payload });
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.send(form);
  });
}
