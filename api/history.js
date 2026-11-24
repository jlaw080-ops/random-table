// 팀 공유 "최근 간 곳" 기록 API → GitHub data 브랜치 history.json
const { loadJson, update, parseBody, guard } = require("./_github");
const FILE = "history.json", BRANCH = "data", MAX = 30;

module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    if (req.method === "GET") {
      const { value } = await loadJson(FILE, BRANCH, []);
      return res.json(Array.isArray(value) ? value : []);
    }
    const body = parseBody(req);
    if (req.method === "POST") {
      const name = String(body.name || "").trim().slice(0, 60);
      if (!name) return res.status(400).json({ error: "식당 이름이 없어요." });
      return res.json(await update(FILE, BRANCH, [], list => ({
        value: [...list, { name, at: Date.now() }].slice(-MAX), message: `기록: ${name}` })));
    }
    if (req.method === "DELETE") {
      return res.json(await update(FILE, BRANCH, [], list => {
        if (body.all) return { value: [], message: "기록 전체 삭제" };
        const i = list.findIndex(h => h.at === body.at && h.name === body.name);
        if (i < 0) return { value: list };
        return { value: list.filter((_, j) => j !== i), message: `기록 삭제: ${body.name}` };
      }));
    }
    res.status(405).json({ error: "지원하지 않는 요청" });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
};
