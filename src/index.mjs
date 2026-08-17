/**
 * Read-only Host half of DSH Token Monitor.
 *
 * Registers one pure session projection that associates provider-reported
 * usage with the request's actual provider/model and Asia/Shanghai day.
 * The Host exposes no route, file access, command execution, credential
 * access, network access, or mutation API.
 */
import { modelUsageProjectionDefinition } from './model-usage-projection.mjs'

export const name = 'dsh-token-monitor'
export const inject = ['sessionProjections']

export function apply(ctx) {
  ctx.sessionProjections.register(modelUsageProjectionDefinition)
  ctx.logger?.info?.('dsh-token-monitor ready (read-only model usage projection)')
}
