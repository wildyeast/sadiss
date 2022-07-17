export interface SpearPartial {
    startTime: number,
    endTime: number,
    breakpoints: [
        {
            time: number,
            freq: number,
            amp: number
        }
    ]
}
