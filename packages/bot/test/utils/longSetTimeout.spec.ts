import { longSetTimeout } from '../../src/utils/longSetTimeout'

describe.only('longSetTimeout', () => {
    it('should call the callback after the specified time', async () => {
        let witness = jest.fn() 

        longSetTimeout(() => {
            witness()
        }, 1000, 100)

        await sleep(1100)

        expect(witness).toHaveBeenCalled()
    })


    it('should NOT call the callback before the specified time', async () => {
        let witness = jest.fn()

        longSetTimeout(() => {
            witness()
        }, 1000, 200)

        await sleep(800)

        expect(witness).not.toHaveBeenCalled()
    })
})

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => { resolve(true) }, ms)
    })
}