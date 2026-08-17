/**
 * Read-only Host half of DSH Token Monitor.
 *
 * All metrics arrive through the standard browser runtime's session-list
 * projection values. The Host deliberately exposes no route, file access,
 * command execution, credential access, or mutation API.
 */
export const name = 'dsh-token-monitor'
export const inject = []

export function apply(ctx) {
  ctx.logger?.info?.('dsh-token-monitor ready (read-only projection consumer)')
}
