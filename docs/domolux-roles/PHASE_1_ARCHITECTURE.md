# Domolux Roles — Phase 1 Architecture

## Overview

This document consolidates the architecture decisions from the approved ADRs and defines the system boundaries for the Domolux Roles implementation.

### Component Diagram (Mermaid)

```mermaid
graph TD
    subgraph HA Core
        HA_Users[HA Users]
        HA_Storage[HA Storage]
        WS_Router[WS Router]
        REST_Handler[REST Handler]
        Core_Policy[Core Permission Policy]
        Auth_API[HA Auth API]
    end

    subgraph Domolux Integration
        Auth_Adapter[ha_auth_adapter.py]
        Role_Store[DomoluxRoleStore]
        Permission_Evaluator[DomoluxPermissionEvaluator]
        View_Manager[DomoluxViewManager]
        WS_Commands[WebSocket Commands]
    end

    subgraph Control Paths
        Native_Control[Native callService / execute_script]
        Mediated_Control[Domolux service/call]
        Service_Auth_API[service_auth_api.py]
    end

    %% Data Flow
    HA_Users -- Auth WS/REST --> WS_Router
    WS_Router -- Identity Check --> Auth_Adapter
    Auth_Adapter -- Principal Resolution --> Permission_Evaluator
    Permission_Evaluator -- Decision --> Role_Store
    Permission_Evaluator -- Decision --> View_Manager

    %% Decision Points
    style Permission_Evaluator fill:#f9f,stroke:#333,stroke-width:2px
    style Auth_Adapter fill:#bbf,stroke:#333,stroke-width:1px
    style Role_Store fill:#cfc,stroke:#333,stroke-width:1px

    %% Enforcement
    Native_Control -- Core Policy Check --> Core_Policy
    Mediated_Control -- Permission Evaluation --> Permission_Evaluator --> Service_Auth_API
```

### Core Responsibility Matrix

| Component                    | Primary Responsibility                                                                                     | Boundary                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `DomoluxRoleStore`           | Authoritative persistent storage of all permission state, roles, and family assignments                    | `.storage/domolux_auth`                                |
| `DomoluxPermissionEvaluator` | Single source of truth for all permission decisions; evaluates effective levels for entities/devices/views | In-memory function of live profile + registry snapshot |
| `service_auth_api.py`        | Mediated service execution authorization; authorizes then executes with validated context                  | WebSocket command → evaluation → Core execution        |
| `ha_auth_adapter.py`         | HA user ↔ Domolux principal mapping; identity derivation from authenticated connection                     | User resolution only                                   |
| View/WS Commands             | UI and management command handlers; delegate to evaluator and store for decisions                          | Never make raw authorization decisions                 |
