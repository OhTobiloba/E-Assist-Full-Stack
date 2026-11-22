# Implemented endpoints (base: `/api`) · Auth = `Authorization: Bearer <accessToken>`
Errors are `{ "message": "..." }` with a proper HTTP status.

| Method & path | Auth | Body → Response |
|---|---|---|
| `POST /signup` | – | `{phone,name}` → `{ok}` (409 if already registered) |
| `POST /otp/send` | – | `{phone}` → `{ok, devOtp?}` (404 unknown number, 429 cooldown) |
| `POST /otp/verify` | – | `{phone,code}` → `{token, refreshToken, user}` |
| `POST /login` | – | `{phone,password}` → `{token, refreshToken, user}` |
| `POST /auth/refresh` | – | `{refreshToken}` → `{token, refreshToken}` (old one revoked) |
| `POST /auth/logout` | – | `{refreshToken}` → `{ok}` |
| `GET /me` | ✔ | → user |
| `PATCH /profile` | ✔ | multipart: `name,email,homeArea,password?,photo?` → user |
| `PATCH /profile/role` | ✔ | `{roles:[..]}` and/or `{activeRole}` → user |
| `POST /kyc/upload` | ✔ | multipart `idDoc`,`selfie` → `{status:'pending'}` |
| `GET /kyc/status` | ✔ | → `{status}` |
| `POST /tasks` | ✔ customer | multipart `title,description,category,budget,pickup,dropoff,deadline,lat?,lng?,photo?` → task (402 if escrow on & wallet too low) |
| `GET /tasks` | ✔ | query `category,minBudget,lat,lng,radiusKm` → open tasks |
| `GET /tasks/mine?role=` | ✔ | → my tasks |
| `GET /tasks/:id` | ✔ | → task |
| `POST /tasks/:id/accept` | ✔ approved assistant | → task (409 if taken) |
| `POST /tasks/:id/cancel` | ✔ | → task (rules in README) |
| `POST /tasks/:id/complete` | ✔ assistant | multipart `proof?` → task |
| `POST /tasks/:id/confirm` | ✔ customer | → task |
| `GET /tasks/:id/messages` | ✔ participant | → messages |
| `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | ✔ | |
| `GET /wallet` | ✔ | → `{balance, transactions[]}` |
| `GET /health` | – | status |

**Socket.io** (same host): connect with `auth:{token}` → emit `task:join {taskId}` (ack `{ok}`) → emit `message:send {taskId,text}` → receive `message:new {id,taskId,senderId,text,createdAt}`; personal `notification:new`.
