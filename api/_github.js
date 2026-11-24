// GitHub 레포 파일 읽기/쓰기 공통 함수 (파일명이 _ 로 시작하면 웹 주소로 노출되지 않음)
const REPO = process.env.GITHUB_REPO || "jlaw080-ops/random-table";

const gh = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "random-table-app",
    ...(opts.headers || {}),
  },
});

const api = file => `https://api.github.com/repos/${REPO}/contents/${file}`;

async function loadJson(file, branch, fallback) {
  const r = await gh(`${api(file)}?ref=${branch}`);
  if (r.status === 404) return { value: fallback, sha: null };
  if (!r.ok) throw new Error(`GitHub 읽기 실패 (${r.status})`);
  const j = await r.json();
  return { value: JSON.parse(Buffer.from(j.content, "base64").toString("utf8")), sha: j.sha };
}

// 성공 true, 동시 수정 충돌 false
async function saveJson(file, branch, value, sha, message) {
  const r = await gh(api(file), {
    method: "PUT",
    body: JSON.stringify({
      message, branch, ...(sha && { sha }),
      content: Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8").toString("base64"),
    }),
  });
  if (r.status === 409 || r.status === 422) return false;
  if (!r.ok) throw new Error(`GitHub 저장 실패 (${r.status})`);
  return true;
}

// 읽고 → 수정 → 저장. 다른 사람과 동시에 저장하면 최대 3번 재시도
async function update(file, branch, fallback, mutate) {
  for (let i = 0; i < 3; i++) {
    const { value, sha } = await loadJson(file, branch, fallback);
    const out = mutate(value);
    if (!out.message) return out.value; // 바뀐 것 없음
    if (await saveJson(file, branch, out.value, sha, out.message)) return out.value;
  }
  const e = new Error("다른 사람과 동시에 저장했어요. 다시 시도해 주세요."); e.status = 409; throw e;
}

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
}

function guard(res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.GITHUB_TOKEN) { res.status(503).json({ error: "GITHUB_TOKEN 환경변수가 설정되지 않았어요." }); return false; }
  return true;
}

module.exports = { loadJson, update, parseBody, guard };
