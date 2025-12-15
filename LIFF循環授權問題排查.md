# 🔧 LIFF 循環授權問題排查指南

## ❌ 問題現象

- 點擊「發送會員卡」按鈕
- 跳轉到 LINE 授權頁面
- 點擊「同意」
- 又跳回授權頁面
- **無限循環** 😫

---

## 🎯 可能原因

### 1. **Bot Link Feature 設定錯誤** ⭐ 最常見

**問題：** Bot link feature 設為 "On (Normal)" 或 "On (Aggressive)"

**解決：** 必須設為 **"Off"**

---

### 2. **Scope 沒有正確保存**

**問題：** 點擊 Update 後，Scope 沒有真正保存

**解決：** 重新檢查並確認

---

### 3. **在外部瀏覽器開啟**

**問題：** 不在 LINE 應用程式內開啟

**解決：** 必須在 LINE 內開啟

---

### 4. **LIFF App 設定問題**

**問題：** Endpoint URL 或其他設定錯誤

**解決：** 完整檢查所有設定

---

## ✅ 完整排查步驟

### 步驟 1：檢查 Bot Link Feature ⭐ 重要！

1. **登入 LINE Developers Console**
   - https://developers.line.biz/console/

2. **進入 LIFF 設定**
   - 選擇您的 Channel
   - 左側選單 → LIFF
   - 找到「發送會員卡」（ID: `2008674758-5mczIgOu`）
   - 點擊 **「Edit」**

3. **找到 Bot link feature**

**❌ 錯誤設定：**
```
Bot link feature:
● On (Normal)
● On (Aggressive)
```

**✅ 正確設定：**
```
Bot link feature:
● Off  ← 必須選這個！
```

4. **點擊「Update」儲存**

---

### 步驟 2：確認 Scope 設定

在同一個編輯頁面，確認：

```
Scope:
☑ profile           ← 必須勾選
☑ openid            ← 必須勾選
☑ chat_message.write ← 必須勾選
```

**全部勾選後，點擊「Update」**

---

### 步驟 3：檢查完整設定

| 設定項目 | 正確值 | 您的值 |
|---------|--------|--------|
| LIFF app name | 發送會員卡 | ✅ / ❌ |
| Size | Full | ✅ / ❌ |
| Endpoint URL | `https://nphone-member.vercel.app/member/send-member-card.html` | ✅ / ❌ |
| Scope | `profile, openid, chat_message.write` | ✅ / ❌ |
| **Bot link feature** | **Off** ⭐ | ✅ / ❌ |
| Scan QR | 不勾選 | ✅ / ❌ |
| Module mode | 不勾選 | ✅ / ❌ |

---

### 步驟 4：完全清除授權

**在 LINE App 中：**

1. **設定** ⚙️
2. **隱私設定** 🔒
3. **提供個人資料的服務** 📋
4. 找到所有相關的服務：
   - 「發送會員卡」
   - 「NPHONE」
   - 任何相關的項目
5. **全部刪除** ❌

---

### 步驟 5：清除瀏覽器快取

**在 LINE 內：**

可能無法直接清除，但可以：
1. 完全關閉 LINE App
2. 等待 10 秒
3. 重新開啟 LINE

**或在手機設定中：**
1. 應用程式管理
2. LINE
3. 清除快取（不要清除資料）

---

### 步驟 6：重新測試

1. **確認在 LINE 內開啟**
   - 不是用 Chrome/Safari
   - 是在 LINE 應用程式內

2. **點擊「發送會員卡」**

3. **看到授權頁面**
   - 確認顯示三個權限：
     - ✓ 查看個人資料
     - ✓ 使用 OpenID
     - ✓ 發送訊息

4. **點擊「同意」**

5. **應該成功！**

---

## 🔍 診斷工具

### 在瀏覽器 Console 中檢查：

```javascript
// 檢查 LIFF 環境
console.log('In LINE Client:', liff.isInClient());
console.log('Is Logged In:', liff.isLoggedIn());
console.log('LIFF Context:', liff.getContext());

// 檢查 Access Token
console.log('Access Token:', liff.getAccessToken());
```

**預期結果：**
```javascript
In LINE Client: true  // 必須是 true
Is Logged In: true
LIFF Context: { type: "...", viewType: "...", ... }
Access Token: "eyJ..."  // 應該有一串 token
```

---

## 🚨 特殊情況處理

### 情況 1：Bot Link Feature 是灰色的（無法修改）

**原因：** 可能是 Channel 類型問題

**解決：**
1. 確認是 Messaging API Channel
2. 如果不是，可能需要重新建立 LIFF App

---

### 情況 2：修改後仍然失敗

**嘗試：** 刪除並重新建立 LIFF App

1. **刪除舊的 LIFF App**
   - LIFF 列表 → 找到「發送會員卡」
   - 點擊右側的「...」→ Delete

2. **重新建立**
   - 點擊「Add」
   - 填寫所有設定（參考上面的表格）
   - **特別注意 Bot link feature 選 Off**

3. **更新 config.js**
   ```javascript
   LIFF_SEND_CARD_ID: 'new_liff_id_here'
   ```

---

### 情況 3：在外部瀏覽器測試

**錯誤做法：**
- ❌ 在 Chrome 開啟
- ❌ 在 Safari 開啟
- ❌ 複製 URL 到瀏覽器

**正確做法：**
- ✅ 在 LINE 應用程式內開啟
- ✅ 從會員系統點擊按鈕

---

## 📋 完整檢查清單

### LIFF App 設定 ✅

- [ ] LIFF app name: 發送會員卡
- [ ] Size: Full
- [ ] Endpoint URL 正確
- [ ] Scope 包含：
  - [ ] profile
  - [ ] openid
  - [ ] chat_message.write
- [ ] **Bot link feature: Off** ⭐
- [ ] Scan QR: 不勾選
- [ ] Module mode: 不勾選
- [ ] 已點擊「Update」儲存

### 清除授權 ✅

- [ ] 刪除「發送會員卡」授權
- [ ] 刪除所有相關授權
- [ ] 清除 LINE 快取
- [ ] 重新開啟 LINE

### 測試環境 ✅

- [ ] 在 LINE 應用程式內
- [ ] 不是外部瀏覽器
- [ ] LINE 已完全載入
- [ ] 網路連線正常

### 測試結果 ✅

- [ ] 點擊「發送會員卡」
- [ ] 看到授權頁面
- [ ] 顯示三個權限
- [ ] 點擊「同意」
- [ ] **沒有循環** ✅
- [ ] 成功發送會員卡
- [ ] 在 LINE 看到卡片

---

## 💡 為什麼 Bot link feature 要設 Off？

### Bot link feature 的作用：

**On (Normal)：**
- 自動將 LIFF 與 Bot 連結
- 用戶使用 LIFF 後會加入 Bot 好友

**On (Aggressive)：**
- 強制要求加入 Bot 好友
- 不加入無法使用 LIFF

**Off：**
- 不強制連結 Bot
- 純粹使用 LIFF 功能
- **適合我們的場景** ✅

### 為什麼要設 Off？

1. **避免權限衝突**
   - On 模式可能影響權限授予
   - 導致循環授權問題

2. **不需要 Bot 連結**
   - 我們只是發送訊息到用戶自己的聊天室
   - 不需要 Bot 介入

3. **更簡單的授權流程**
   - 用戶不會被要求加 Bot 好友
   - 只需授予必要權限

---

## 🎯 最可能的解決方案

### 99% 的情況下，問題是：

```
Bot link feature: On (Normal)  ← 錯誤
```

**改為：**

```
Bot link feature: Off  ← 正確
```

**然後：**
1. 儲存設定
2. 清除授權
3. 重新測試

**應該就能解決！** ✅

---

## 📞 仍然失敗？

如果按照所有步驟仍然失敗：

### 檢查清單：

1. **LIFF ID 是否正確？**
   ```javascript
   // config.js
   LIFF_SEND_CARD_ID: '2008674758-5mczIgOu'
   ```

2. **Endpoint URL 是否可訪問？**
   ```
   https://nphone-member.vercel.app/member/send-member-card.html
   ```
   在瀏覽器開啟應該要能載入頁面

3. **是否在 LINE 內開啟？**
   - 不是 Chrome/Safari
   - 是 LINE 應用程式

4. **Console 錯誤訊息？**
   - 提供完整的錯誤訊息
   - 截圖 Console 輸出

---

## 🎉 成功的標誌

當設定正確後：

```
點擊「發送會員卡」
  ↓
開啟 LIFF 頁面（只一次）
  ↓
看到授權頁面（只一次）
  ↓
點擊「同意」
  ↓
載入會員資訊
  ↓
生成條碼
  ↓
發送 Flex Message
  ↓
✅ 成功！視窗關閉
  ↓
在 LINE 看到精美的會員卡
```

**不會循環！** 🎊

---

## 📚 相關文件

- LINE LIFF 官方文件：https://developers.line.biz/en/docs/liff/
- Bot link feature 說明：https://developers.line.biz/en/docs/liff/using-bot-link-feature/

---

祝您順利解決問題！如需協助請提供：
1. LIFF App 設定截圖
2. Console 錯誤訊息
3. 授權頁面截圖

我們會協助您診斷！😊

