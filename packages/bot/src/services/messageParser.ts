// TODO: extract messageId, channelId and ending date for the proposal from a proposal message
export function parseProposalMessage(_message: string): { messageId: string, channelId: string, proposalDeadline: Date } {
    const messageId = ''
    const channelId = ''
    const proposalDeadline = new Date() 

    return { messageId, channelId, proposalDeadline }
}