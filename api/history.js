// 팀 공유 "최근 간 곳" 기록 API
// 기록은 GitHub 레포의 data 브랜치 history.json 에 저장됩니다.
// 필요한 Vercel 환경변수: GITHUB_TOKEN (random-table 레포 Contents 읽기/쓰기 권한)
const REPO = process.env.GITHUB_REPO || "jlaw080-ops/random-table";
const BRANCH = "data";
const FILE = "history.json";
const MAX = 30;
const API = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const gh = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "random-table-app",
    ...(opts.headers || {}),
  },
});

async function load() {
  const r = await gh(`${API}?ref=${BRANCH}`);
  if (r.status === 404) return { list: [], sha: null };
  if (!r.ok) throw new Error(`GitHub 읽기 실패 (${r.status})`);
  const j = await r.json();
  const list = JSON.parse(Buffer.from(j.content, "base64").toString("utf8") || "[]");
  return { list: Array.isArray(list) ? list : [], sha: j.sha };
}

async function store(list, sha, message) {
  const r = await gh(API, {
    method: "PUT",
    body: JSON.stringify({
      message, branch: BRANCH, ...(sha && { sha }),
      content: Buffer.from(JSON.stringify(list, null, 2) + "\n", "utf8").toString("base64"),
    }),
  });
  if (r.status === 409 || r.status === 422) return false; // 동시에 다른 사람이 저장함 → 재시도
  if (!r.ok) throw new Error(`GitHub 저장 실패 (${r.status})`);
  return true;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.GITHUB_TOKEN) return res.status(503).json({ error: "GITHUB_TOKEN 환경변수가 설정되지 않았어요." });
  try {
    if (req.method === "GET") return res.json((await load()).list);

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    for (let attempt = 0; attempt < 3; attempt++) {
      const { list, sha } = await load();
      let msg;
      if (req.method === "POST") {
        const name = String(body.name || "").trim().slice(0, 60);
        if (!name) return res.status(400).json({ error: "식당 이름이 없어요." });
        list.push({ name, at: Date.now() });
        msg = `기록: ${name}`;
      } else if (req.method === "DELETE") {
        if (body.all) { list.length = 0; msg = "기록 전체 삭제"; }
        else {
          const i = list.findIndex(h => h.at === body.at && h.name === body.name);
          if (i < 0) return res.json(list);
          list.splice(i, 1); msg = `기록 삭제: ${body.name}`;
        }
      } else return res.status(405).json({ error: "지원하지 않는 요청" });
      const trimmed = list.slice(-MAX);
      if (await store(trimmed, sha, msg)) return res.json(trimmed);
    }
    res.status(409).json({ error: "다른 사람과 동시에 저장했어요. 다시 시도해 주세요." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
