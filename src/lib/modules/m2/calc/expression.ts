// Bộ tính công thức an toàn cho công thức tính kết quả theo phương pháp (M2.4).
// Không dùng eval: phân tích cú pháp đệ quy, chỉ cho phép số, biến, + − × ÷ ^, ngoặc và vài hàm toán học.
// Quy ước như Excel tiếng Việt: dấu phẩy là dấu thập phân (0,25), dấu chấm phẩy ngăn cách đối số: max(a; b).

export type Vars = Record<string, number>;

const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log10: Math.log10,
  exp: Math.exp,
  min: Math.min,
  max: Math.max,
};

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.,]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.,eE]/.test(src[j])) {
        // cho phép số mũ 1e-3, nhưng "e" phải theo sau là số hoặc dấu
        if (/[eE]/.test(src[j]) && !/[0-9+-]/.test(src[j + 1] ?? "")) break;
        if (/[eE]/.test(src[j]) && /[+-]/.test(src[j + 1] ?? "")) j++;
        j++;
      }
      const raw = src.slice(i, j).replace(",", ".");
      const v = Number(raw);
      if (!Number.isFinite(v)) throw new Error(`Số không hợp lệ: "${src.slice(i, j)}"`);
      out.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[A-Za-z_À-ỹ]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_À-ỹ]/.test(src[j])) j++;
      out.push({ t: "id", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^();×÷".includes(c)) {
      out.push({ t: "op", v: c === "×" ? "*" : c === "÷" ? "/" : c });
      i++;
      continue;
    }
    throw new Error(`Ký tự không được phép: "${c}"`);
  }
  return out;
}

type Node =
  | { k: "num"; v: number }
  | { k: "var"; name: string }
  | { k: "neg"; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "call"; fn: string; args: Node[] };

/** Phân tích công thức thành cây; ném lỗi tiếng Việt khi sai cú pháp. */
export function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v && !(t.t === "op" && t.v === v))) throw new Error(v ? `Thiếu "${v}"` : "Công thức kết thúc đột ngột");
    p++;
    return t;
  };
  const expr = (): Node => {
    let n = term();
    while (peek()?.t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = (eat() as { v: string }).v;
      n = { k: "bin", op, a: n, b: term() };
    }
    return n;
  };
  const term = (): Node => {
    let n = factor();
    while (peek()?.t === "op" && (peek().v === "*" || peek().v === "/")) {
      const op = (eat() as { v: string }).v;
      n = { k: "bin", op, a: n, b: factor() };
    }
    return n;
  };
  const factor = (): Node => {
    const base = unary();
    if (peek()?.t === "op" && peek().v === "^") {
      eat("^");
      return { k: "bin", op: "^", a: base, b: factor() }; // lũy thừa kết hợp phải
    }
    return base;
  };
  const unary = (): Node => {
    if (peek()?.t === "op" && peek().v === "-") { eat("-"); return { k: "neg", a: unary() }; }
    if (peek()?.t === "op" && peek().v === "+") { eat("+"); return unary(); }
    return primary();
  };
  const primary = (): Node => {
    const t = peek();
    if (!t) throw new Error("Công thức kết thúc đột ngột");
    if (t.t === "num") { p++; return { k: "num", v: t.v }; }
    if (t.t === "id") {
      p++;
      if (peek()?.t === "op" && peek().v === "(") {
        if (!FUNCS[t.v]) throw new Error(`Hàm không được hỗ trợ: ${t.v}`);
        eat("(");
        const args: Node[] = [expr()];
        while (peek()?.t === "op" && peek().v === ";") { eat(";"); args.push(expr()); }
        eat(")");
        return { k: "call", fn: t.v, args };
      }
      return { k: "var", name: t.v };
    }
    if (t.v === "(") { eat("("); const n = expr(); eat(")"); return n; }
    throw new Error(`Không mong đợi "${t.v}"`);
  };
  const tree = expr();
  if (p < toks.length) throw new Error(`Thừa ký tự sau vị trí ${p}: "${(toks[p] as { v: unknown }).v}"`);
  return tree;
}

/** Danh sách biến xuất hiện trong công thức. */
export function variablesOf(src: string): string[] {
  const seen = new Set<string>();
  const walk = (n: Node) => {
    if (n.k === "var") seen.add(n.name);
    else if (n.k === "neg") walk(n.a);
    else if (n.k === "bin") { walk(n.a); walk(n.b); }
    else if (n.k === "call") n.args.forEach(walk);
  };
  walk(parse(src));
  return [...seen];
}

export function evaluate(src: string, vars: Vars): number {
  const run = (n: Node): number => {
    switch (n.k) {
      case "num": return n.v;
      case "var": {
        if (!(n.name in vars) || !Number.isFinite(vars[n.name])) throw new Error(`Thiếu giá trị biến "${n.name}"`);
        return vars[n.name];
      }
      case "neg": return -run(n.a);
      case "call": return FUNCS[n.fn](...n.args.map(run));
      case "bin": {
        const a = run(n.a);
        const b = run(n.b);
        if (n.op === "+") return a + b;
        if (n.op === "-") return a - b;
        if (n.op === "*") return a * b;
        if (n.op === "/") { if (b === 0) throw new Error("Chia cho 0"); return a / b; }
        return a ** b;
      }
    }
  };
  const v = run(parse(src));
  if (!Number.isFinite(v)) throw new Error("Kết quả không xác định (NaN/∞)");
  return v;
}
