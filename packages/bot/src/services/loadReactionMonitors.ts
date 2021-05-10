import { ReactionMonitorInfos } from '../types'

export function loadReactionMonitors (): ReactionMonitorInfos {
  const getMonitorLink = (index: number) =>
    process.env[`MONITOR_LINK_${index}`] || ''
  const getMonitorName = (index: number) =>
    process.env[`MONITOR_NAME_${index}`] || ''
  const getMonitorRetrieveUrl = (index: number) =>
    process.env[`MONITOR_RETRIEVE_URL_${index}`] || ''

  let counter = 0
  let reactionMonitors: ReactionMonitorInfos = []
  let nextMonitorName: string = getMonitorName(counter)
  let nextMonitorLink: string = getMonitorLink(counter)
  let nextMonitorRetrieveUrl: string = getMonitorRetrieveUrl(counter)

  if (!nextMonitorLink) {
    console.error(
      'You must provide at least MONITOR_LINK_0 as environment variable'
    )
  }

  if (!nextMonitorName) {
    console.error(
      'You must provide at least MONITOR_NAME_0 as environment variable'
    )
  }

  if (!nextMonitorRetrieveUrl) {
    console.error(
      'You must provide at least MONITOR_RETRIEVE_URL_0 as environment variable'
    )
  }

  while (nextMonitorLink && nextMonitorName && nextMonitorRetrieveUrl) {
    reactionMonitors.push({
      name: nextMonitorName.toString(),
      link: nextMonitorLink.toString(),
      retrieveUrl: nextMonitorRetrieveUrl.toString()
    })

    counter += 1

    nextMonitorName = getMonitorName(counter)
    nextMonitorLink = getMonitorLink(counter)
    nextMonitorRetrieveUrl = getMonitorRetrieveUrl(counter)
  }

  return reactionMonitors
}
