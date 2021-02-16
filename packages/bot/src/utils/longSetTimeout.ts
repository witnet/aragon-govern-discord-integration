export function longSetTimeout(callback: Function, ms: number, pollingEvery: number = 3600) {
    let remaining = ms
    if (pollingEvery > Math.pow(2, 31) - 1) {
        console.warn('Polling shouldn\'t exceed 2**31 ms')
    } 
    
    if (ms > pollingEvery) {
        const interval = setInterval(() => {
            remaining = remaining - pollingEvery 

            if (remaining < pollingEvery) {
                clearInterval(interval)
                return setTimeout(callback, remaining)
            }
            return null
        }, pollingEvery)
        return interval
    } else {
        return setTimeout(callback, ms)
    }
}
