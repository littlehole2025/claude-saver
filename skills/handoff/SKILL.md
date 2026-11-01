---
name: handoff
description: 使用者只打「換」、「開新」、"new" 或 "handoff"，或按下「開新對話」按鈕時使用：開一個新對話並附上交接重點，再封存目前對話。Use when the user types just "換", "開新", "new" or "handoff", or clicks the "New conversation" button.
---

# 開新對話並封存目前對話

使用者只打「換」／「開新」（或 "new"／"handoff"）時，直接照下面做，**不要再問一次**。

對話太長（claude-saver 的 hook 會告訴你大小）而使用者提新功能時，不用等使用者打「換」：第 3 步改用 `start_session` 的 `initiation: "offer"` 跳出「開新對話／在這裡做」按鈕，brief 再加上使用者這則新要求。使用者選開新對話才做第 4、5 步；選在這裡做就不開、不封存，直接照常做。

## 步驟

1. **查目前對話名稱**：用 `get_session`（session 傳 `"self"`）。
2. **決定新對話名稱**：把目前名稱**最後一個數字加 1**，其餘照抄，不要另取新名字。
   - 「對話-3」→「對話-4」
   - 「Yoto 網站 9」→「Yoto 網站 10」
   - 名稱裡沒有數字 → 在後面加「-2」（「SEO 調整」→「SEO 調整-2」）
3. **開新對話**：用 `start_session`，`context` 設 `"fresh"`，`title` 用上一步的名稱。brief 寫交接重點：
   - 這個對話**做完了什麼**（commit、PR、改了哪些檔）
   - **還沒做完什麼**、卡在哪
   - **待辦**與下一步
   - 要注意的規則或使用者偏好（例如回覆語言）
   - brief 要能獨立看懂，不要寫「如上所述」這類要回頭看的字
4. **確認新對話已經啟動**：看工具結果確定它真的開了。
5. **封存目前對話**：用 `archive_session`（session 傳 `"self"`）。

如果第 3 步失敗或被拒絕，**不要封存**，用一句話告訴使用者原因。

## 需求

`start_session`、`get_session`、`archive_session` 是 Claude 桌面版（Code 分頁）才有的工具。工具清單裡沒有的話（例如在終端機 CLI），請告訴使用者：這裡不能自動開新對話，可以自己開一個，然後把你整理好的交接重點貼過去。
