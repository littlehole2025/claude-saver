// 開新對話、移到最上層、封存前，提醒 Claude 維持側邊欄群組（PostToolUse：start_session、detach_session；PreToolUse：archive_session）
// 移到最上層的對話不在任何群組，側邊欄會把它放到專案資料夾名稱的區塊，看起來像專案分裂成兩個，所以每一步都提醒
// 環境變數：LONG_CHAT_LANG（zh-TW 或 en）
const LANG = (process.env.LONG_CHAT_LANG || "zh-TW").toLowerCase().startsWith("en") ? "en" : "zh-TW";

const MESSAGES = {
  "zh-TW": {
    start: `claude-saver：如果這次真的開了新對話（使用者沒有選「在這裡做」，也不是只提出建議卡片），用 move_sessions 把它放進目前對話所在的群組（get_session "self" 的 group）。目前對話不在群組裡，先看同一個資料夾的其他對話（list_sessions 的 cwd、group）用哪個群組，都沒有才用 list_groups 找、create_group 建，不要替同一個專案開第二個群組。如果新對話名稱是目前名稱編號加 1（接棒對話），不用再問：把它移到最上層、放進群組，並照 claude-saver:handoff skill 封存目前對話；只是建議卡還沒被按下時，brief 要有接棒指示，新對話才能自己收尾。`,
    detach: `claude-saver：這個對話剛移到最上層，現在不在任何群組，側邊欄會把它放到資料夾名稱的區塊，看起來像專案分裂。下一個動作必須用 move_sessions 放回專案群組（用前一個對話的 group：get_session parentSessionId），用 get_session 確認 group 不是 null，才可以封存前一個對話。`,
    archive: `claude-saver：如果這是接棒時封存前一個對話，先確認新對話已經在專案群組裡（get_session 的 group 不是 null）；還沒有就先用 move_sessions 放進去，再封存。封存被拒絕（包括被 auto 模式擋下）就不要重試：把要封存的對話也放進同一個群組，再請使用者手動封存，講明是哪一個對話。`,
  },
  en: {
    start: `claude-saver: if this actually started a new session (the user didn't pick "Do it here", and it isn't just a proposal card), file it with move_sessions under the current session's group (the group from get_session "self"). If the current session has no group, first see which group other sessions in the same folder use (cwd and group in list_sessions); only if none, look with list_groups and create_group. Never open a second group for the same project. If the new session's title is this one's number plus 1 (a successor), don't ask again: move it to top level, file it under the group and archive this session per the claude-saver:handoff skill; if it's only a proposal card so far, its brief must carry the successor instructions so the new session can finish this itself.`,
    detach: `claude-saver: this session just moved to top level and is now in no group, so the sidebar shows it under the folder's name, as if the project had split in two. Your next action must be move_sessions back into the project's group (the previous session's group: get_session parentSessionId). Confirm with get_session that group isn't null before archiving the previous session.`,
    archive: `claude-saver: if this archives the previous session during a handoff, first confirm the new session is in the project's group (group from get_session isn't null). If it isn't, file it with move_sessions, then archive. If archiving is refused (including by auto mode), don't retry: file the session you meant to archive under the same group too, then ask the user to archive it by hand, naming that session.`,
  },
};

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let data = {};
  try { data = JSON.parse(input || "{}"); } catch {}
  const name = data.tool_name || "";
  const key = name.endsWith("detach_session") ? "detach" : name.endsWith("archive_session") ? "archive" : "start";
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: data.hook_event_name || "PostToolUse",
        additionalContext: MESSAGES[LANG][key],
      },
    })
  );
});
