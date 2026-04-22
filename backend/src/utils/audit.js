// Keep request-level context that helps explain who changed what and from where.
export const buildMetadata = (req) => ({
  ip: req.ip,
  method: req.method,
  path: req.originalUrl,
});

// Uses a lightweight header override for now; defaults to system for automated updates.
export const actorNameFromRequest = (req) => req.header('x-actor-name') || 'system';

// Create a field-by-field before/after map for audit logs.
export const diffFields = (before, after) => {
  const changes = {};

  Object.keys(after).forEach((key) => {
    const beforeValue = before?.[key] ?? null;
    const afterValue = after[key] ?? null;

    if (String(beforeValue) !== String(afterValue)) {
      changes[key] = {
        before: beforeValue,
        after: afterValue,
      };
    }
  });

  return changes;
};

// Centralized insert keeps audit write shape consistent across controllers.
export const insertAuditLog = async (client, { entityType, entityId, action, actorName, changes, metadata }) => {
  await client.query(
    `INSERT INTO audit_logs (entity_type, entity_id, action, actor_name, changes, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entityType, entityId, action, actorName, changes, metadata]
  );
};