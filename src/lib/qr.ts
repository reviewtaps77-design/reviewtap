import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(
  url: string,
  options?: {
    width?: number;
    color?: string;
    backgroundColor?: string;
  }
): Promise<string> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: options?.width || 512,
    margin: 2,
    color: {
      dark: options?.color || '#000000',
      light: options?.backgroundColor || '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
  return dataUrl;
}

export async function generateQRCodeSVG(
  url: string,
  options?: {
    color?: string;
    backgroundColor?: string;
  }
): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: options?.color || '#000000',
      light: options?.backgroundColor || '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
  return svg;
}

export function buildBusinessUrl(slug: string): string {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appBaseUrl}/biz/${slug}`;
}

export function buildEmployeeUrl(businessSlug: string, employeeSlug: string): string {
  const baseUrl = buildBusinessUrl(businessSlug);
  return `${baseUrl}/staff/${employeeSlug}`;
}
