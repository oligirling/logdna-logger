/**
 * Name of the application
 * @type {string}
 */
const applicationName = 'NAME_OF_YOUR_APPLICATION'

/**
 * LogDNA logger using their API
 */
class Logger {

    /**
     * Logger constructor
     * @param {Request} request
     */
    constructor(request) {
        this.requestStartTime = Date.now()
        this.defaultLogData = this.buildDefaultLogData(request)
        this.metaDetails = {}
        this.logs = []
    }

    /**
     * Build up default log data
     * @param request
     * @returns {Object}
     */
    buildDefaultLogData(request) {
        return {
            'app': applicationName,
            'env': ENVIRONMENT || 'unknown',
            'meta': {
                'ua': request.headers.get('user-agent'),
                'referer': request.headers.get('Referer') || 'empty',
                'ip': request.headers.get('CF-Connecting-IP'),
                'countryCode': (request.cf || {}).country,
                'colo': (request.cf || {}).colo,
                'url': request.url,
                'method': request.method,
                'x_forwarded_for': request.headers.get('x_forwarded_for') || "0.0.0.0",
                'asn': (request.cf || {}).asn,
                'cfRay': request.headers.get('cf-ray'),
                'tlsCipher': (request.cf || {}).tlsCipher,
                'tlsVersion': (request.cf || {}).tlsVersion,
                'clientTrustScore': (request.cf || {}).clientTrustScore,
            }
        }
    }

    /**
     * Push the log into and array so it can be sent later
     * This method should not be used directly. Instead use the error/debug/info methods to log
     * @param {string} message
     * @param {string} level
     */
    addLog(message, level) {
        let lineLog = {
            'line': message,
            'timestamp': Date.now(),
            'level': level,
            ...this.defaultLogData
        }
        lineLog.meta = {
            ...lineLog.meta,
            ...this.metaDetails
        }
        this.logs.push(lineLog)
    }

    /**
     * Add an INFO level log
     * @param {string} message
     */
    info(message) {
        this.addLog(message, 'INFO')
    }

    /**
     * Add an DEBUG level log
     * @param {string} message
     */
    debug(message) {
        this.addLog(message, 'DEBUG')
    }

    /**
     * Add an ERROR level log
     * @param {string} message
     */
    error(message) {
        this.addLog(message, 'ERROR')
    }

    /**
     * Add a meta value to the logs
     * Done this way so each log that contains the meta data no matter when its added after
     * @param {string} metaName
     * @param {string|int} metaValue
     */
    setMeta(metaName, metaValue) {
        this.metaDetails[metaName] = metaValue
    }

    /**
     * Post the request to LogDNA
     * This should be used at the end of of the users request
     * When it fails, or when it succeeds
     * @returns {Promise<void>}
     */
    async postRequest() {
        const token = 'INSERT_INGESTION_KEY'
        const hostname = 'example.net'
        const tagName = 'TAG_NAME'
        const time = Date.now()
        let myHeaders = new Headers()
        myHeaders.append('Content-Type', 'application/json; charset=UTF-8')
        myHeaders.append('apikey', token)

        // add the executionTime to each of the logs for visibility
        this.logs.forEach(log => {
            log.meta.executionTime = time - this.requestStartTime
        })

        try {
            await fetch('https://logs.logdna.com/logs/ingest?'
                + 'tag='+ tagName
                + '&hostname=' + hostname
                + '&now=' + time,
                {
                    method: 'POST',
                    headers: myHeaders,
                    body: JSON.stringify({ 'lines': this.logs })
                })
        } catch (err) {
            console.error(err.stack || err)
        }
    }
}

module.exports = Logger
