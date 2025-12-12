# NPHONE API 返回值參考

## 📘 重要提醒

許多 API 返回的是**物件結構**而非直接陣列，使用前需要解構。

---

## 🔍 API 返回值對照表

### MemberAPI

#### `getAll(limit, offset)`
```javascript
// ❌ 錯誤用法
const members = await MemberAPI.getAll(100, 0);
members.map(m => ...) // TypeError: members.map is not a function

// ✅ 正確用法
const result = await MemberAPI.getAll(100, 0);
const members = result.members || [];
const total = result.total;
```

**返回值結構：**
```javascript
{
  members: Array,  // 會員陣列
  total: Number    // 總數量
}
```

---

### BookingAPI

#### `getAllBookings(limit, offset, status)`
```javascript
// ❌ 錯誤用法
const bookings = await BookingAPI.getAllBookings(100, 0);
bookings.filter(b => ...) // TypeError: bookings.filter is not a function

// ✅ 正確用法
const result = await BookingAPI.getAllBookings(100, 0);
const bookings = result.bookings || [];
const total = result.total;
```

**返回值結構：**
```javascript
{
  bookings: Array,  // 預約陣列
  total: Number     // 總數量
}
```

#### `getMyBookings(lineUserId, limit)`
```javascript
// ✅ 直接返回陣列
const bookings = await BookingAPI.getMyBookings(lineUserId, 50);
```

**返回值：** `Array` （直接陣列）

---

### WalletPointsAPI

#### `getMemberWallet(lineUserId)`
```javascript
// ✅ 直接返回物件或 null
const wallet = await WalletPointsAPI.getMemberWallet(lineUserId);
if (wallet) {
  console.log(wallet.balance);
}
```

**返回值結構：**
```javascript
{
  id: UUID,
  member_id: UUID,
  balance: Decimal,
  total_recharged: Decimal,
  total_spent: Decimal,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### `getMemberPoints(lineUserId)`
```javascript
// ✅ 直接返回物件或 null
const points = await WalletPointsAPI.getMemberPoints(lineUserId);
if (points) {
  console.log(points.balance);
}
```

**返回值結構：**
```javascript
{
  id: UUID,
  member_id: UUID,
  balance: Integer,
  total_earned: Integer,
  total_spent: Integer,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### CheckoutAPI

#### `getAllTransactions(limit, offset)`
```javascript
// ✅ 直接返回陣列
const transactions = await CheckoutAPI.getAllTransactions(100, 0);
```

**返回值：** `Array` （直接陣列）

#### `getPaymentMethods()`
```javascript
// ✅ 直接返回陣列
const methods = await CheckoutAPI.getPaymentMethods();
```

**返回值：** `Array` （直接陣列）

---

## 💡 最佳實踐

### 1. 使用解構賦值
```javascript
// 推薦寫法
const { members, total } = await MemberAPI.getAll(100, 0);
const { bookings, total: bookingsTotal } = await BookingAPI.getAllBookings(100, 0);
```

### 2. 提供預設值
```javascript
// 避免 null/undefined 錯誤
const result = await MemberAPI.getAll(100, 0);
const members = result?.members || [];
const total = result?.total || 0;
```

### 3. 類型檢查
```javascript
// 確保是陣列
function displayMembers(data) {
  const members = Array.isArray(data) ? data : (data?.members || []);
  // ... 處理 members
}
```

---

## 🐛 常見錯誤

### 錯誤 1: `.map is not a function`
**原因：** 直接對物件使用陣列方法

**解決：**
```javascript
// ❌ 錯誤
const members = await MemberAPI.getAll(100, 0);
members.map(...)

// ✅ 正確
const { members } = await MemberAPI.getAll(100, 0);
members.map(...)
```

### 錯誤 2: `.filter is not a function`
**原因：** 同上

**解決：**
```javascript
// ❌ 錯誤
const bookings = await BookingAPI.getAllBookings(100, 0);
bookings.filter(...)

// ✅ 正確
const { bookings } = await BookingAPI.getAllBookings(100, 0);
bookings.filter(...)
```

### 錯誤 3: `Cannot read property 'length' of undefined`
**原因：** 沒有提供預設值

**解決：**
```javascript
// ❌ 可能出錯
const { members } = await MemberAPI.getAll(100, 0);
console.log(members.length); // 如果 API 錯誤，members 可能是 undefined

// ✅ 安全
const result = await MemberAPI.getAll(100, 0);
const members = result?.members || [];
console.log(members.length); // 總是有效
```

---

## 📋 快速參考

| API 方法 | 返回類型 | 解構方式 |
|---------|---------|---------|
| `MemberAPI.getAll()` | `{ members, total }` | `const { members } = await ...` |
| `MemberAPI.getByLineId()` | `Object` | `const member = await ...` |
| `BookingAPI.getAllBookings()` | `{ bookings, total }` | `const { bookings } = await ...` |
| `BookingAPI.getMyBookings()` | `Array` | `const bookings = await ...` |
| `WalletPointsAPI.getMemberWallet()` | `Object` / `null` | `const wallet = await ...` |
| `WalletPointsAPI.getMemberPoints()` | `Object` / `null` | `const points = await ...` |
| `CheckoutAPI.getAllTransactions()` | `Array` | `const transactions = await ...` |

---

## ✅ 已修正頁面

- ✅ `admin/dashboard.html` - 正確處理 members 和 bookings
- ✅ `admin/members.html` - 正確處理 members

如遇到類似錯誤，請參考本文件！

