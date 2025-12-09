# Windows 安裝指南

## Python 3.13 安裝問題解決方案

如果您在 Windows 上使用 Python 3.13 遇到 scikit-learn 編譯錯誤，請使用以下解決方案：

### 方案 1：使用預編譯的 Wheel 包（推薦）

```powershell
# 只安裝預編譯的包，不從源碼編譯
pip install --only-binary :all: scikit-learn

# 然後安裝其他依賴
pip install -r requirements.txt
```

### 方案 2：升級到最新版本

```powershell
# 先升級 pip
python -m pip install --upgrade pip

# 安裝最新版本的 scikit-learn（支援 Python 3.13）
pip install scikit-learn --upgrade

# 然後安裝其他依賴
pip install -r requirements.txt
```

### 方案 3：使用 Python 3.11 或 3.12（最穩定）

如果上述方案都不行，建議使用 Python 3.11 或 3.12：

1. 下載 Python 3.11 或 3.12：https://www.python.org/downloads/
2. 創建新的虛擬環境：
   ```powershell
   python3.11 -m venv venv
   # 或
   python3.12 -m venv venv
   ```
3. 激活虛擬環境並安裝依賴：
   ```powershell
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

### 方案 4：使用 Docker（最簡單）

如果本地安裝有問題，直接使用 Docker：

```powershell
# 構建並運行 Docker 容器
docker-compose --profile ai up -d ai-service
```

## 常見錯誤

### 錯誤：`'int_t' is not a type identifier`

這是 Cython 編譯錯誤，通常發生在：
- Python 3.13 與舊版 scikit-learn 不兼容
- 缺少 C/C++ 編譯器

**解決方案：**
```powershell
# 安裝預編譯版本
pip install --only-binary :all: scikit-learn

# 或升級到最新版本
pip install scikit-learn --upgrade
```

### 錯誤：缺少 C/C++ 編譯器

如果看到編譯器相關錯誤，可以：

1. 安裝 Microsoft C++ Build Tools：https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. 或使用預編譯的包（推薦）：
   ```powershell
   pip install --only-binary :all: scikit-learn
   ```

## 驗證安裝

安裝完成後，驗證 scikit-learn：

```powershell
python -c "import sklearn; print(sklearn.__version__)"
```

應該顯示版本號，例如：`1.5.0` 或更高。


