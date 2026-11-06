// PostToolUse hook（只對 start_session）：開了子對話後，提醒 Claude 把它放進目前對話的側邊欄群組
// 環境變數：LONG_CHAT_LANG（zh-TW 或 en）
const LANG = (process.env.LONG_CHAT_LANG || "zh-TW").toLowerCase().startsWith("en") ? "en" : "zh-TW";

const MESSAGES = {
  "zh-TW": `claude-saver：如果這次真的開了新對話（使用者沒有選「在這裡做」，也不是只提出建議卡片），用 move_sessions 把它放進目前對話所在的群組（get_session "self" 的 group）。目前對話不在群組裡，就用 list_groups 找專案名的群組，沒有才用 create_group 建。群組工具不能用，或使用者拒絕，就跳過。如果新對話名稱是目前名稱編號加 1（接棒對話），不用再問：把它移到最上層，並照 claude-saver:handoff skill 封存目前對話；只是建議卡還沒被按下時，brief 要有接棒指示，新對話才能自己收尾。`,
  en: `claude-saver: if this actually started a new session (the user didn't pick "Do it here", and it isn't just a proposal card), file it with move_sessions under the current session's group (the group from get_session "self"). If the current session has no group, look for the project's group with list_groups and create_group only if there is none. If the group tools are unavailable or the user declines, skip this. If the new session's title is this one's number plus 1 (a successor), don't ask again: move it to top level and archive this session per the claude-saver:handoff skill; if it's only a proposal card so far, its brief must carry the successor instructions so the new session can finish this itself.`,
};

process.stdin.resume();
process.stdin.on("end", () => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: MESSAGES[LANG],
      },
    })
  );
});
