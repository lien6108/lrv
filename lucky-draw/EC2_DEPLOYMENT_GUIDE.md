# AWS EC2 系統部署指南

這份文件將引導您在 AWS EC2 伺服器上，透過 Docker Compose 將抽獎系統迅速上線。本教學以 Amazon Linux 2023 或 Amazon Linux 2 (AWS 上最常見的 EC2 預設作業系統) 為例。

## 1. 建立並連線至 EC2
1. 在 AWS 主控台 (Console) 啟動一台 **EC2 (Amazon Linux 2023)** 執行個體。
2. 確保這台機器的**安全群組 (Security Group)** 中有開放允許傳入的 **HTTP (Port 80)**。
3. 透過 SSH 連線或 EC2 Instance Connect 登入到伺服器。

## 2. 安裝必要的環境 (Git & Docker)
登入 EC2 後，請依序一行一行輸入以下指令：

```bash
# 更新系統及安裝 Git
sudo yum update -y
sudo yum install git -y

# 安裝 Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker

# 將預設的 ec2-user 加入 docker 群組 (之後便可免用 sudo 執行 docker)
sudo usermod -aG docker ec2-user

# 安裝 Docker Compose 核心工具
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

**⚠️ 重要提醒：** 執行完以上指令後，請先 **登出 SSH 再重新登入**（或者輸入 `su - ec2-user`），這樣權限設定才會生效，接下來的指令才不會權限不足！

## 3. 下載專案與啟動
重新登入後，將您的專案從 GitHub 複製下來：

```bash
# 複製您的 Github 儲存庫
git clone https://github.com/lien6108/dkonthebeat.git
cd dkonthebeat/lucky-draw

# 使用 Docker Compose 讓系統在背景全自動啟動建置
docker compose up -d --build
```

*(註：第一次啟動時，系統會在本機編譯下載 React 靜態檔案及建置容器背景，通常需等待 1~3 分鐘。)*

## 4. 完成部署！大功告成 🎉
一切就緒後，打開您的瀏覽器，輸入該 EC2 實例的 **Public IPv4 Address** （免加 Port），您就能看見能穩定運作、且可以接受多人連線拜訪的「線上抽獎系統」了！

### 更新與維護方式
未來如果您在本機修改了任何程式碼並推上 (Push) Github，請在 EC2 裡面進入到專案的資料夾，執行以下指令即可無縫更新！且**原先已經抽過的結果與剩餘人數皆不會因為更新而遺失**（資料庫檔案有被自動備份掛載）：
```bash
git pull
docker compose up -d --build
```
