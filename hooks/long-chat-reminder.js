// UserPromptSubmit hook：對話太長時提醒開新對話
// 讀取 transcript 最後一筆回覆的 token 用量（= 目前上下文大小）。超過門檻後每一輪都告訴 Claude，
// 由 Claude 判斷這則訊息是不是要開始新功能／新話題，是就先跳出「開新對話」按鈕；
// 使用者看得到的提示只在剛超過門檻時出現一次，之後每多 STEP 再出現一次
// 環境變數：LONG_CHAT_TOKENS（門檻，預設 150000）、LONG_CHAT_STEP（提示間隔，預設 50000）、LONG_CHAT_LANG（zh-TW 或 en）
const fs = require("fs");
const os = require("os");
const path = require("path");
const LIMIT = Number(process.env.LONG_CHAT_TOKENS || 150000);
const STEP = Number(process.env.LONG_CHAT_STEP || 50000);
const LANG = (process.env.LONG_CHAT_LANG || "zh-TW").toLowerCase().startsWith("en") ? "en" : "zh-TW";

const MESSAGES = {
  "zh-TW": (k) => ({
    user: `💡 這段對話已經很長了（約 ${k}k tokens），每一輪都更耗 token。之後你要做新功能時，會直接跳出「開新對話」按鈕。`,
    claude: `對話上下文已約 ${k}k tokens（claude-saver）。判斷使用者這則訊息是不是要開始新功能或新話題（不是接續目前做到一半的事、不是修正或追問）：是的話，這一輪第一個動作就用 start_session（initiation "offer"、context "fresh"、名稱照 claude-saver:handoff skill 的編號加 1 規則）跳出開新對話按鈕，先不要開始做，brief 寫使用者這則新要求＋交接重點；使用者選開新對話，確認新對話啟動後，照 claude-saver:handoff skill 的步驟先把子對話移到最上層、放進專案群組，再用 archive_session 封存目前對話（"self"）；選在這裡做就照常做。是接續目前的事就照常做，不要提開新對話。不要在一輪結束時另外建議開新對話。`,
  }),
  en: (k) => ({
    user: `💡 This conversation is getting long (~${k}k tokens); every turn costs more. Next time you start a new task, a "New conversation" button will pop up.`,
    claude: `The conversation context is ~${k}k tokens (claude-saver). Decide whether the user's message starts a new feature or a new topic (not continuing work in progress, not a correction or follow-up question). If it does, make your first action this turn start_session (initiation "offer", context "fresh", title per the numbering rule in the claude-saver:handoff skill) so the user gets a new-conversation button, and don't start the work yet; the brief holds the user's new request plus the handoff points. If the user picks the new conversation, confirm it started, then follow the claude-saver:handoff skill: move child sessions to top level and file them under the project's group, then archive this one with archive_session ("self"); if they pick to do it here, just do it. If the message continues current work, carry on and don't mention a new conversation. Don't suggest a new conversation at the end of a turn.`,
  }),
};

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const { transcript_path, session_id } = JSON.parse(input || "{}");
    if (!transcript_path || !fs.existsSync(transcript_path)) return;
    const size = fs.statSync(transcript_path).size;
    const len = Math.min(size, 2_000_000);
    const fd = fs.openSync(transcript_path, "r");
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    fs.closeSync(fd);
    const lines = buf.toString("utf8").split("\n").reverse();
    for (const line of lines) {
      if (!line.includes('"usage"')) continue;
      let u;
      try { u = JSON.parse(line).message?.usage; } catch { continue; }
      if (!u) continue;
      const tokens = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      if (tokens < LIMIT) return;
      const level = Math.floor((tokens - LIMIT) / STEP);
      const stateFile = path.join(os.tmpdir(), `claude-long-chat-${session_id}.txt`);
      const last = fs.existsSync(stateFile) ? Number(fs.readFileSync(stateFile, "utf8")) : -1;
      const msg = MESSAGES[LANG](Math.round(tokens / 1000));
      const out = {
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: msg.claude,
        },
      };
      if (level > last) {
        fs.writeFileSync(stateFile, String(level));
        out.systemMessage = msg.user;
      }
      process.stdout.write(JSON.stringify(out));
      return;
    }
  } catch {}
});
