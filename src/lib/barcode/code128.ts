// Mã vạch Code 128 (bộ ký tự B – ASCII 32…127) xuất SVG, dùng cho nhãn mẫu (M2.1).
// Mỗi mẫu là độ rộng 6 phần tử vạch/khoảng trắng (tổng 11 mô-đun); STOP có 7 phần tử (13 mô-đun).

export const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232",
] as const;
export const STOP = "2331112";
export const START_B = 104;

/** Giá trị mã (đã gồm START B, dữ liệu, checksum) cho chuỗi ASCII 32–127. */
export function encodeB(text: string): number[] {
  const codes = [...text].map((ch) => {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 127) throw new Error(`Ký tự "${ch}" không mã hóa được bằng Code 128-B`);
    return c - 32;
  });
  const checksum = (START_B + codes.reduce((s, v, i) => s + v * (i + 1), 0)) % 103;
  return [START_B, ...codes, checksum];
}

/** Độ rộng từng phần tử (vạch, trắng, vạch…) kể cả STOP. */
export function moduleWidths(text: string): number[] {
  return (encodeB(text).map((v) => PATTERNS[v]).join("") + STOP).split("").map(Number);
}

/** SVG mã vạch, có vùng trắng 10 mô-đun hai bên theo chuẩn. */
export function code128Svg(text: string, opts: { height?: number; module?: number } = {}) {
  const m = opts.module ?? 1;
  const h = opts.height ?? 40;
  const widths = moduleWidths(text);
  const quiet = 10 * m;
  let x = quiet;
  const bars: string[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w * m}" height="${h}"/>`);
    x += w * m;
  });
  const total = x + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${h}" width="${total}" height="${h}" shape-rendering="crispEdges" role="img" aria-label="${text.replace(/"/g, "")}"><rect width="${total}" height="${h}" fill="#fff"/><g fill="#000">${bars.join("")}</g></svg>`;
}
