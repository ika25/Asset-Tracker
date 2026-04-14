export const buildMetadata = (req) => ({
  ip: req.ip,
  method: req.method,
  path: req.originalUrl,
});

export const actorNameFromRequest = (req) => req.header('x-actor-name') || 'system';

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

export const insertAuditLog = async (client, { entityType, entityId, action, actorName, changes, metadata }) => {
  await client.query(
    `INSERT INTO audit_logs (entity_type, entity_id, action, actor_name, changes, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entityType, entityId, action, actorName, changes, metadata]
  );
};