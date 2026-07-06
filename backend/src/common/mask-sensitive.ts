// Filter sensitive info (phone numbers, WeChat IDs) from user-generated content

/** Mask phone numbers in text */
export function maskPhone(text: string): string {
  if (!text) return text;
  // Chinese mobile: 1[3-9]xxxxxxxxx
  return text.replace(/1[3-9]\d{9}/g, (m) => m.slice(0, 3) + "****" + m.slice(7));
}

/** Mask phone numbers with separators (138-0000-0000, 138 0000 0000) */
export function maskSeparatedPhone(text: string): string {
  if (!text) return text;
  return text
    .replace(/1[3-9]\d[- ]?\d{4}[- ]?\d{4}/g, (m) => {
      const digits = m.replace(/\D/g, "");
      return digits.slice(0, 3) + "****" + digits.slice(7);
    });
}

/** Mask WeChat IDs (wxid_xxx, common wechat patterns) */
export function maskWechat(text: string): string {
  if (!text) return text;
  // WeChat ID patterns
  return text
    .replace(/wxid_[a-zA-Z0-9]+/g, "wxid_****")
    .replace(/微信[：:]\s*[a-zA-Z0-9_-]+/g, "微信：****")
    .replace(/WeChat[：:]\s*[a-zA-Z0-9_-]+/gi, "WeChat：****")
    .replace(/VX?[：:]\s*[a-zA-Z0-9_-]+/gi, "VX：****")
    .replace(/vx?[：:]\s*[a-zA-Z0-9_-]+/gi, "vx：****");
}

/** Apply all masks */
export function maskAll(text: string): string {
  if (!text) return text;
  let result = text;
  result = maskPhone(result);
  result = maskSeparatedPhone(result);
  result = maskWechat(result);
  return result;
}
