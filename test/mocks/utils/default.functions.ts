/**
 * Class with some functions that are used in more than one mock class.
 */
export class DefaultFunctions {
    /**
     * Randomly generates a valid 24-byte hex ID.
     *
     * @return {string}
     */
    public static generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }

    /**
     * Generates a date in the format YYYY-MM-DDTHH:mm:ss.SSS[Z].
     *
     * @return {string}
     */
    public static generateDate(): string {
        return new Date().toISOString()
    }
}
