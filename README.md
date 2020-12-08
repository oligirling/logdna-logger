# Node Logger for LogDNA

### What?
This is a logger class that allows you to log your request in [LogDNA](https://logdna.com/)

LogDNA api docs can be found [here](https://docs.logdna.com/reference)

The following parameters are logged from the request:
- user agent
- referer
- ip
- countryCode
- url
- colo
- request method
- x_forwarded_for
- asn
- CF-Ray
- tlsCipher
- tlsVersion
- clientTrustScore


### Why?
This was originally created to use and log requests coming into a CloudFlare Worker. However it can be used for other requests.

Cloudflare logs are only available on enterprise accounts. So thanks to [boynet](https://github.com/boynet)'s [cf-logdna-worker](https://github.com/boynet/cf-logdna-worker) concept, I decided to make something similar to fit my needs. Check theirs out as well as it maybe more suitable.   

I needed a logger to log each request as they came in and to add meta data (eg users apiKeys, details from CloudFlares KV, responseTime etc) along the way, so I created this.

### How?

Firstly you need to add your details to the logger. The following places need adjusting before using this class:

- applicationName (top of the file)
- token (inside `postRequest()`)
- hostname (inside `postRequest()`)
- tagName (inside `postRequest()`)

To use this logger just bring the class in:
```javascript
const logDnaLogger = require('./Logger')
```
And create the object - passing in a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
```javascript
const logger = new logDnaLogger(request)
```
You can add custom meta params using the method:
```javascript
Logger.setMeta('userApiKey', 'VALUE')
```
Adding meta like this will add meta value to any log that goes after this.

To start logging, use the log level methods:
```javascript
Logger.info('Request Finished')
``` 
Available level methods:
- `info()`
- `debug()`
- `error()`

More can be added if you require

Just before the response is returned, fire the logs up to LogDNA.

```javascript
await Logger.postRequest()
```
This will post all the logs up in one batch with the meta you have added. 

This has been tested using CloudFlare Workers and is working well.

### Screenshots in LogDna

Below is a screenshot of how a log entry from this logger shows up in LogDNA, with a bunch of custom meta added using `setMeta()` (eg output, endpoint etc)

<img width="973" alt="Screenshot 2020-12-08 at 09 31 36" src="https://user-images.githubusercontent.com/42932986/101472061-fb7e1880-393f-11eb-992d-4f49f9074741.png">


Using the custom meta sent from the logger, you can create graphs and other visual tools. See below:

<img width="1068" alt="Screenshot 2020-12-08 at 09 31 03" src="https://user-images.githubusercontent.com/42932986/101472538-a1318780-3940-11eb-8d9a-c6dea3e73ca5.png">  

### Examples

Cloudflare worker example:
```javascript
const logDnaLogger = require('./Logger')

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

/**
 * Handle the request
 *
 * @param request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {    
    const logger = new logDnaLogger(request)
    try {
        logger.setMeta('day', 'Monday')
        logger.info('Request received')
        throw new Error('Something went wrong')
    } catch (e) {
        logger.error(e.message)
    } finally {
      await logger.postRequest()
    }
}
```

This example would send 2 logs in a single call to LogDNA. First would be of `INFO` level and the second would be an `ERROR`. Both the logs would have the meta added, the `day` as well as all the default meta values mentioned above.
