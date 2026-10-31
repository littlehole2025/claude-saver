# token-saver

Claude Code 外掛：**對話太長時自動提醒開新對話**，打「換」就幫你**開新對話、附上交接重點、封存目前對話**。

> English: A Claude Code plugin that warns you when a conversation gets long, and when you type "new" (or 「換」) it starts a fresh session with a handoff brief and archives the current one. Set `LONG_CHAT_LANG=en` for English messages.

## 為什麼要用

對話越長，每一輪都要重送整段上下文，越來越耗 token、也越慢。在適當的時候換新對話、只帶重點過去，比較省也比較準。

## 功能

- **自動提醒**：上下文超過 150k tokens 時跳一次提醒，之後每多 50k 再提醒一次。Claude 會在做完手上的事之後建議開新對話，並附上「開新對話」按鈕。
- **一鍵交接**：打「換」或「開新」（英文 `new`／`handoff`），Claude 會：
  1. 開新對話，名稱編號自動加 1（「對話-3」→「對話-4」）
  2. 附上交接重點：做完了什麼、還沒做完什麼、待辦、要注意的規則
  3. 確認新對話開好後，封存目前對話

## 安裝

在 Claude Code 裡執行：

```
/plugin marketplace add littlehole2025/token-saver
/plugin install token-saver@token-saver
```

裝好後重新開一個對話就會生效。

## 需求

- 電腦要裝 [Node.js](https://nodejs.org/)（hook 用 `node` 執行）
- **一鍵交接只能在 Claude 桌面版（Code 分頁）用**，因為開新對話和封存要用桌面版才有的工具。在終端機 CLI 一樣會跳提醒，但要自己開新對話。

## 設定

用環境變數調整（可以寫在 `~/.claude/settings.json` 的 `"env"` 裡）：

| 變數 | 預設 | 說明 |
| --- | --- | --- |
| `LONG_CHAT_TOKENS` | `150000` | 超過多少 tokens 開始提醒 |
| `LONG_CHAT_STEP` | `50000` | 之後每多多少 tokens 再提醒一次 |
| `LONG_CHAT_LANG` | `zh-TW` | 提醒語言：`zh-TW` 或 `en` |

例如：

```json
{
  "env": {
    "LONG_CHAT_TOKENS": "120000",
    "LONG_CHAT_LANG": "en"
  }
}
```

## 運作方式

`UserPromptSubmit` hook 在你每次送出訊息時，讀對話紀錄最後一筆回覆的 token 用量（等於目前上下文大小）。超過門檻就同時：

- 顯示一行提醒給你看
- 告訴 Claude 這一輪做完後建議開新對話

已經提醒過的級距記在系統暫存資料夾，同一個級距不會重複提醒。

## 授權

MIT
