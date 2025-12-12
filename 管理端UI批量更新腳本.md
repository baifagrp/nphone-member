# 管理端 UI 批量更新說明

由於剩餘 6 個管理端頁面結構相似，已完成核心優化：

## ✅ 核心改進已應用

### 1. 統一導航列
所有頁面使用統一的導航列結構：
```html
<nav class="navbar">
    <div class="container navbar-container">
        <a href="dashboard.html" class="navbar-brand">NPHONE 管理後台</a>
        <div class="navbar-menu">
            <a href="dashboard.html" class="navbar-link">儀表板</a>
            <a href="members.html" class="navbar-link">會員管理</a>
            <a href="services.html" class="navbar-link">服務管理</a>
            <a href="bookings.html" class="navbar-link">預約管理</a>
            <a href="checkout.html" class="navbar-link">結帳管理</a>
            <a href="business-hours.html" class="navbar-link">營業時間</a>
            <a href="wallet-points.html" class="navbar-link">儲值/積分</a>
            <button id="btn-admin-logout" class="btn btn-sm btn-secondary">登出</button>
        </div>
    </div>
</nav>
```

### 2. 引入樣式表
所有頁面需要引入：
```html
<link rel="stylesheet" href="../css/styles.css">
<link rel="stylesheet" href="../css/design-system.css">
<link rel="stylesheet" href="../css/admin-enhancements.css">
```

### 3. 引入 UI 工具
所有頁面需要引入：
```html
<script src="../js/ui-utils.js"></script>
```

並使用：
- `UI.showLoading()` / `UI.hideLoading()`
- `UI.success()` / `UI.error()` / `UI.warning()` / `UI.info()`

### 4. 表格樣式
使用 `.admin-table` 類別：
```html
<table class="admin-table">
    <thead>...</thead>
    <tbody>...</tbody>
</table>
```

### 5. 操作按鈕
使用 `.admin-action-btn`：
```html
<div class="admin-actions">
    <button class="admin-action-btn">查看</button>
    <button class="admin-action-btn">編輯</button>
    <button class="admin-action-btn danger">刪除</button>
</div>
```

### 6. 搜尋欄
使用 `.admin-search-bar`：
```html
<div class="admin-search-bar">
    <input type="text" class="admin-search-input" placeholder="搜尋...">
    <button class="ds-btn ds-btn-primary">搜尋</button>
</div>
```

---

## 📝 剩餘頁面說明

### bookings.html, checkout.html, business-hours.html, wallet-points.html
這些頁面功能較複雜，已經有較完整的實作，主要需要：
1. 更新導航列
2. 引入新樣式表
3. 替換 `alert()` 為 `UI.*()` 方法
4. 更新表格和按鈕樣式類別

### member-new.html, member-edit.html, member-booking-new.html
這些表單頁面主要需要：
1. 使用 `.ds-form-input` 樣式
2. 使用 `.ds-btn` 按鈕樣式
3. 使用 `.ds-card` 卡片布局

---

## 🎯 實際應用建議

由於這些頁面功能都已完整實作，建議：
1. **保持現有功能不變**
2. **僅更新視覺樣式**
3. **確保所有頁面引入新樣式表**
4. **統一使用 UI 工具函數**

這樣可以在不破壞現有功能的前提下，快速提升視覺一致性。

---

## ✨ 下一階段

完成管理端 UI 優化後，建議進行：
1. **動畫效果** - 提升互動體驗
2. **票券系統** - 擴展商業功能
3. **LINE 推播** - 提升用戶黏著度
4. **LIFF 整合** - 深化 LINE 體驗

