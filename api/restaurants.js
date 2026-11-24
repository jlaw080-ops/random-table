// 팀 공유 식당 목록 API → GitHub main 브랜치 restaurants.json
const { loadJson, update, parseBody, guard } = require("./_github");
const FILE = "restaurants.json", BRANCH = "main";
const EMPTY = { kakaoKey: "", restaurants: [] };
const CATS = ["한식", "중식", "일식", "양식", "분식", "기타"];

const clean = r => {
  const name = String(r?.name || "").trim().slice(0, 60);
  if (!name) return null;
  const out = { name, cat: CATS.includes(r.cat) ? r.cat : "기타" };
  if (typeof r.url === "string" && /^https?:\/\/place\.map\.kakao\.com\//.test(r.url)) out.url = r.url;
  if (Number.isFinite(Number(r.dist)) && r.dist !== "" && r.dist != null) out.dist = Number(r.dist);
  return out;
};
const norm = v => ({ kakaoKey: v?.kakaoKey || "", restaurants: Array.isArray(v?.restaurants) ? v.restaurants : [] });

module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    if (req.method === "GET") return res.json(norm((await loadJson(FILE, BRANCH, EMPTY)).value));
    const body = parseBody(req);
    if (req.method === "POST") { // { items: [{name, cat, url?, dist?}, ...] }
      const add = (Array.isArray(body.items) ? body.items : []).map(clean).filter(Boolean).slice(0, 100);
      if (!add.length) return res.status(400).json({ error: "추가할 식당이 없어요." });
      return res.json(await update(FILE, BRANCH, EMPTY, v => {
        v = norm(v);
        const have = new Set(v.restaurants.map(r => r.name));
        const fresh = add.filter(r => !have.has(r.name) && have.add(r.name));
        if (!fresh.length) return { value: v };
        return { value: { ...v, restaurants: [...v.restaurants, ...fresh] },
          message: `식당 추가: ${fresh.map(r => r.name).join(", ")}`.slice(0, 200) };
      }));
    }
    if (req.method === "DELETE") { // { name }
      return res.json(await update(FILE, BRANCH, EMPTY, v => {
        v = norm(v);
        const list = v.restaurants.filter(r => r.name !== body.name);
        if (list.length === v.restaurants.length) return { value: v };
        return { value: { ...v, restaurants: list }, message: `식당 삭제: ${body.name}` };
      }));
    }
    res.status(405).json({ error: "지원하지 않는 요청" });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
};
