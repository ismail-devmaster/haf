# Home Assistant Hook Points & Survey

| Channel           | Function / API                                          | File:Line                                         | Interceptable?              | How                                                  | Risk          |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------- | --------------------------- | ---------------------------------------------------- | ------------- |
| Service Call      | `ServiceRegistry.async_call`                            | `homeassistant/core.py`                           | Yes                         | Instance wrapper / guard                             | CRITICAL (D1) |
| State Read        | `States.async_all`, `async_subscribe_users`             | `homeassistant/core.py`                           | Partial                     | Native user.permissions + WS filters                 | HIGH (D2)     |
| WebSocket API     | `websocket_api` commands (`call_service`, `get_states`) | `homeassistant/components/websocket_api/`         | Yes                         | Custom command handlers & wrappers                   | HIGH (D1/D2)  |
| Script/Automation | `script.async_turn_on`, automation engine               | `homeassistant/components/script/`, `automation/` | Yes via context propagation | Service guard checking originating context `user_id` | CRITICAL (D1) |
| History / Logbook | `/api/history`, logbook collector                       | `homeassistant/components/history/`               | Partial                     | REST / WS filtering wrapper                          | HIGH (D2)     |
