---
name: handoff
description: 使用者只打「換」、「開新」、"new" 或 "handoff"，或按下「開新對話」按鈕時使用：開一個新對話並附上交接重點，把子對話移到最上層、放進專案群組，再封存目前對話。Use when the user types just "換", "開新", "new" or "handoff", or clicks the "New conversation" button.
---

# 開新對話並封存目前對話

使用者只打「換」／「開新」（或 "new"／"handoff"）時，直接照下面做，**不要再問一次**。

對話太長（claude-saver 的 hook 會告訴你大小）而使用者提新功能時，不用等使用者打「換」：第 3 步改用 `start_session` 的 `initiation: "offer"` 跳出「開新對話／在這裡做」按鈕，brief 再加上使用者這則新要求。使用者選開新對話才做第 4 步之後的步驟；選在這裡做就不開、不封存，直接照常做。

## 步驟

1. **查目前對話**：用 `get_session`（session 傳 `"self"`），記下名稱、id 和 `group`。
2. **決定新對話名稱**：把目前名稱**最後一個數字加 1**，其餘照抄，不要另取新名字。
   - 「對話-3」→「對話-4」
   - 「Yoto 網站 9」→「Yoto 網站 10」
   - 名稱裡沒有數字 → 在後面加「-2」（「SEO 調整」→「SEO 調整-2」）
3. **開新對話**：用 `start_session`，`context` 設 `"fresh"`，`title` 用上一步的名稱。brief 寫交接重點：
   - 這個對話**做完了什麼**（commit、PR、改了哪些檔）
   - **還沒做完什麼**、卡在哪
   - **待辦**與下一步
   - 要注意的規則或使用者偏好（例如回覆語言）
   - **brief 開頭寫接棒指示**，內容見下方「接棒對話」
   - brief 要能獨立看懂，不要寫「如上所述」這類要回頭看的字
4. **確認新對話已經啟動**：看工具結果確定它真的開了。
5. **把子對話移到最上層**：封存會連帶封存已閒置的子對話，所以封存前要先移開。用 `list_sessions`（`linked: true`）找出 `startedBy` 是目前對話的所有對話（包含剛開的新對話，以及之前開的側邊對話），逐一用 `detach_session` 移到最上層。記下失敗的（例如使用者自己拉出來的）。
6. **放進專案群組**：子對話沒辦法改掛到新對話底下，所以用側邊欄群組維持主次關係。用 `move_sessions` 把新對話和第 5 步移出來的子對話都放進目前對話所在的群組（第 1 步的 `group`）。
   - 目前對話不在群組裡：先看同資料夾其他對話（`list_sessions` 的 `cwd`、`group`）用哪個群組；都沒有才用 `list_groups` 找專案名的群組，再沒有才用 `create_group` 建。群組名用使用者稱呼這個專案的名字，不知道就用專案資料夾名稱。每個專案一個群組。
   - 排程任務的執行紀錄不能分組，略過。
   - 用 `get_session` 確認新對話的 `group` 不是 null。
   - 群組工具不能用，或使用者拒絕移動：跳過這一步，繼續封存，並用一句話告訴使用者新對話不在群組裡。
7. **交代 detach 失敗的子對話**：第 5 步有失敗的話，先用 `SendMessage` 把這些對話的 id 告訴新對話，請它用 `list_sessions`（`include_archived: true`）檢查，被一起封存的就用 `unarchive_session` 還原。因為封存自己之後這個對話就結束了，沒辦法自己檢查。
8. **封存目前對話**：用 `archive_session`（session 傳 `"self"`）。

如果第 3 步失敗或被拒絕，**不要移動子對話，也不要封存**，用一句話告訴使用者原因。

## 接棒對話

新對話是接續這條主線的（名稱＝目前名稱編號加 1）時，**不管怎麼開的**（打「換」、按「開新對話」、使用者叫你開、或你用 `initiation: "own_initiative"` 提出的建議卡被按下），都要獨立出來並封存前一個對話，不用再問。建議卡被按下時舊對話可能已經結束這一輪，沒機會做第 5–8 步，所以 brief 開頭一定要寫這段接棒指示：

> 你是接棒對話。依序做完才開始工作：
> 1. `get_session "self"` 取得 `parentSessionId`，再 `get_session` 查前一個對話的 `group`。
> 2. `detach_session "self"` 移到最上層。
> 3. `move_sessions`（`"self"`）放進前一個對話的群組。
> 4. `get_session "self"` 確認 `group` 不是 null，否則不要封存，用一句話告訴使用者。
> 5. `archive_session` 封存 `parentSessionId` 那個對話。
> 6. `list_sessions`（`include_archived: true`）檢查，有其他子對話被連帶封存就用 `unarchive_session` 還原。
> 已做好的步驟跳過。

封存被拒絕（前一個對話還在執行、釘選等）時不要硬來，用一句話告訴使用者。

移到最上層的對話不在任何群組，側邊欄會把它放到資料夾名稱的區塊，專案看起來分裂成兩個，所以沒確認 `group` 不是 null 不可以封存。前一個對話沒有群組時，先看同資料夾其他對話用哪個群組，都沒有才建，不要替同一個專案開第二個群組。

## 平常開子對話

名稱不是編號加 1 的一般子對話，用 `start_session` 真的開成之後，也把它移進目前對話所在的群組（做法同第 6 步）。不用移到最上層，也不封存目前對話。

## 需求

`start_session`、`get_session`、`list_sessions`、`detach_session`、`unarchive_session`、`archive_session` 和群組工具（`list_groups`、`create_group`、`move_sessions`）是 Claude 桌面版（Code 分頁）才有的工具。`start_session` 或 `archive_session` 不在工具清單裡的話（例如在終端機 CLI），請告訴使用者：這裡不能自動開新對話，可以自己開一個，然後把你整理好的交接重點貼過去。
