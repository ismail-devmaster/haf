# Domolux Permission Model Specification

## 1. Subjects & Scopes

- **Subjects:** Floor (optional), Area, Device, Entity, Dashboard, View.
- **Access Levels:** `HIDDEN` (`none`) < `VIEW` (`read`) < `CONTROL` (`control`).
- **Default Policy:** Default-deny (`HIDDEN`).

## 2. Precedence Hierarchy

1. Explicit Entity rule (denies win over allows, narrower scope beats broader).
2. Explicit Device rule.
3. Explicit Area rule.
4. Default access level fallback (`none`).

## 3. Dynamic Membership

An area grant covers entities/devices added to that area later, respecting entity-area overrides.

## 4. Isolation

Child grants are strictly isolated per user; nothing is shared between Children.
