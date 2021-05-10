import { ReactionMonitorInfos } from '../types'

export function loadReactionMonitors (): ReactionMonitorInfos {
  const getMonitorLink = (index: number) =>
    process.env[`MONITOR_LINK_${index}`] || ''
  const getMonitorName = (index: number) =>
    process.env[`MONITOR_NAME_${index}`] || ''

  let counter = 0
  let reactionMonitors: Array<{ name: string; link: string }> = []
  let nextMonitorName: string = getMonitorName(counter)
  let nextMonitorLink: string = getMonitorLink(counter)

  if (!nextMonitorLink) {
    console.log(
      'You must provide at least MONITOR_NAME_0 as environment variable'
    )
  }

  if (!nextMonitorName) {
    console.log(
      'You must provide at least MONITOR_LINK_0 as environment variable'
    )
  }

  while (nextMonitorLink && nextMonitorName) {
    reactionMonitors.push({
      name: nextMonitorName.toString(),
      link: nextMonitorLink.toString()
    })

    counter += 1

    nextMonitorName = getMonitorName(counter)
    nextMonitorLink = getMonitorLink(counter)
  }

  return reactionMonitors
}
