# claude-saver

**中文** | [English](README.en.md)

Claude Code 外掛：**對話太長時，你一提新功能就跳出「開新對話」按鈕**，按下去就幫你**開新對話、附上交接重點、封存目前對話**。也可以直接打「換」。

> English: A Claude Code plugin: once a conversation gets long, starting a new task pops up a "New conversation" button that opens a fresh session with a handoff brief and archives the current one. You can also just type "new" (or 「換」). Set `LONG_CHAT_LANG=en` for English messages.

## 為什麼要用

對話越長，每一輪都要重送整段上下文，越來越耗 token、也越慢。在適當的時候換新對話、只帶重點過去，比較省也比較準。

## 功能

- **改新功能就跳按鈕**：上下文超過 150k tokens 後，你提新功能或新話題時，Claude 會先跳出「開新對話／在這裡做」按鈕，不用自己打字。接續做到一半的事、修正、追問都照常做，不會跳。
- **提示只出現幾次**：剛超過 150k 時顯示一行提示，之後每多 50k 再顯示一次。
- **一鍵交接**：按下「開新對話」，或打「換」或「開新」（英文 `new`／`handoff`），Claude 會：
  1. 開新對話，名稱編號自動加 1（「對話-3」→「對話-4」）
  2. 附上交接重點：做完了什麼、還沒做完什麼、待辦、要注意的規則
  3. 確認新對話開好後，把子對話移到最上層，再封存目前對話。封存會連帶封存已閒置的子對話，先移開才不會被一起封存
- **接棒對話自動獨立**：名稱編號加 1 的新對話不管怎麼開的（包括 Claude 提出的建議卡被按下），都會移到最上層，並自動封存前一個對話。舊對話已經結束這一輪時，由新對話自己收尾。
- **用群組維持專案的主次關係**：新對話和子對話都放進同一個側邊欄群組（每個專案一個），平常開的子對話也一樣。在預設權限模式下，桌面版移動對話前會先問你，側邊欄也可能切換成顯示群組的檢視。

## 安裝

介紹頁：https://littlehole2025.github.io/claude-saver/

這個外掛不在官方商店，桌面版的「瀏覽外掛」找不到它，請用終端機安裝（Windows 用 PowerShell，Mac 用「終端機」）。

**Claude Code v2.1.292 以上**，一行就好：

```bash
claude plugin install claude-saver --marketplace littlehole2025/claude-saver
```

**比較舊的版本**，分兩行：

```bash
claude plugin marketplace add littlehole2025/claude-saver
claude plugin install claude-saver@claude-saver
```

不知道版本可以跑 `claude --version` 看。也可以在 Claude Code 對話裡輸入 `/plugin install claude-saver --marketplace littlehole2025/claude-saver`（v2.1.275 以上）。

- 終端機和桌面版的本機對話共用設定，**在終端機裝好後，桌面版也能用**。裝好後重新開一個對話就會生效。
- 第三方外掛預設不會自動更新，要更新時跑：

```bash
claude plugin update claude-saver@claude-saver
```

## 需求

- 電腦要裝 [Node.js](https://nodejs.org/)（hook 用 `node` 執行）
- **一鍵交接只能在 Claude 桌面版（Code 分頁）用**，因為開新對話和封存要用桌面版才有的工具。在終端機 CLI 沒有按鈕，Claude 會改用一句話建議你自己開新對話。

## 設定

用環境變數調整（可以寫在 `~/.claude/settings.json` 的 `"env"` 裡）：

| 變數 | 預設 | 說明 |
| --- | --- | --- |
| `LONG_CHAT_TOKENS` | `150000` | 超過多少 tokens 開始跳按鈕 |
| `LONG_CHAT_STEP` | `50000` | 之後每多多少 tokens 再顯示一次提示 |
| `LONG_CHAT_LANG` | `zh-TW` | 提示語言：`zh-TW` 或 `en` |

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

`UserPromptSubmit` hook 在你每次送出訊息時，讀對話紀錄最後一筆回覆的 token 用量（等於目前上下文大小）。超過門檻後：

- 每一輪都告訴 Claude 目前大小，由 Claude 判斷你這則訊息是不是新功能，是就先跳出開新對話按鈕
- 你看得到的提示只在剛超過門檻、之後每多 50k 時顯示一次（顯示過的級距記在系統暫存資料夾）

另外有 `PostToolUse`、`PreToolUse` hook，只在 Claude 開新對話、把對話移到最上層、封存對話時執行，提醒它把新對話放進專案群組。

## 隱私

這個外掛不連網路、不傳送任何資料。hook 只在你的電腦上讀對話紀錄檔算 token 用量，並在系統暫存資料夾記一個小檔案（已顯示過的提示級距）。開新對話、封存、移動群組都是 Claude 桌面版本身的功能。

## 授權

MIT
