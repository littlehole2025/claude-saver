// UserPromptSubmit hook：對話太長時提醒開新對話
// 讀取 transcript 最後一筆回覆的 token 用量（= 目前上下文大小），超過門檻提醒一次，之後每多 STEP 再提醒一次
// 環境變數：LONG_CHAT_TOKENS（門檻，預設 150000）、LONG_CHAT_STEP（再提醒間隔，預設 50000）、LONG_CHAT_LANG（zh-TW 或 en）
const fs = require("fs");
const os = require("os");
const path = require("path");
const LIMIT = Number(process.env.LONG_CHAT_TOKENS || 150000);
const STEP = Number(process.env.LONG_CHAT_STEP || 50000);
const LANG = (process.env.LONG_CHAT_LANG || "zh-TW").toLowerCase().startsWith("en") ? "en" : "zh-TW";

const MESSAGES = {
  "zh-TW": (k) => ({
    user: `💡 這段對話已經很長了（約 ${k}k tokens），每一輪都更耗 token。建議做完手上這件事後開新對話（打「換」即可）。`,
    claude: `對話上下文已約 ${k}k tokens。完成這一輪後，用一句繁體中文建議使用者開新對話，wrap_up 附「開新對話」按鈕（使用者打「換」或「開新」＝依 token-saver:handoff skill 開新對話附交接並封存目前對話）。`,
  }),
  en: (k) => ({
    user: `💡 This conversation is getting long (~${k}k tokens); every turn costs more. Consider starting a new one after this task (just type "new").`,
    claude: `The conversation context is ~${k}k tokens. After finishing this turn, suggest in one sentence that the user start a new conversation, and add a "New conversation" button in wrap_up (the user typing "new" means: follow the token-saver:handoff skill to start a new session with a handoff brief and archive this one).`,
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
      if (level <= last) return;
      fs.writeFileSync(stateFile, String(level));
      const msg = MESSAGES[LANG](Math.round(tokens / 1000));
      process.stdout.write(JSON.stringify({
        systemMessage: msg.user,
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: msg.claude,
        },
      }));
      return;
    }
  } catch {}
});
