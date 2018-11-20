/**
 * strips `.` or `#` characters
 */
function sanitized (input) {
    if (input.length === 0) { return '' }
    return input.toLowerCase()
        .replace(/^[#.]*/, '')
}

/**
 * converts an html5 tag format (e.g. my-component) to camelCase (e.g. myComponent)
 */
function camelCase (input) {
    return sanitized(input)
        .replace(/-(.)/g, function (match, group1) {
            return group1.toUpperCase()
        }).replace(/^[\S]/, function (match, group) {
            return match.toLowerCase()
        })
}

function loadScript(url, callback){
    const script = document.createElement('script')
    script.type = 'text/javascript'

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == 'loaded' ||
                script.readyState == 'complete'){
                script.onreadystatechange = null
                callback()
            }
        }
    } else {  //Others
        script.onload = function(){
            callback()
        }
    }

    script.src = url
    document.getElementsByTagName('head')[0].appendChild(script)
}

function loadStyle(url, callback){
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = url

    document.getElementsByTagName('head')[0].appendChild(link)
}

const DEFAULT_VERSION = 'master'

function getVersion (packageName) {
    var version = window.__env &&
        window.__env.pluginVersions &&
        window.__env.pluginVersions[packageName]
    if (version) {
        return version
    }
    return DEFAULT_VERSION
}

/**
 * callback will be fired after each javascript script is loaded
 */
module.exports = function (options, cb) {
    if (!options.el) throw new Error('must include \'el\' property to scout options')
    if (!options.baseUrl) { // if no base url provided, require app and cdnUrl
        if (!options.app) throw new Error('must include \'app\' property to scout options')
        if (!options.version) options.version = getVersion(options.app) // no version set on this ENV default to 'master' build
    }
    if (typeof cb !== 'function') {
        cb = function () {
            const init = camelCase(options.el)
            typeof global[init] === 'function'
                ? global[init](options.el)
                : global[init].default(options.el)
        }
    }

    /**
     * when using the 'master' version, never cache so browsers automatically pick up new versions
     * this default case is exclusively for dev/staging environments
     */
    let preventCache = ''
    if (options.version === DEFAULT_VERSION) {
        preventCache = '?_=' + Date.now()
    }

    options.files = options.files || ['main.js', 'main.css']

    let el = options.el
    if (typeof el === 'string') {
        el = document.querySelectorAll(el)
    }
    if (typeof (el) !== undefined && el.length) { // element found on page inject assets
        const baseUrl = options.baseUrl || options.cdnUrl + '/' + options.app + '/' + options.version
        options.files.forEach(function (filename) {
            const fileUrl = baseUrl + '/' + filename + preventCache
            if (/.js$/.test(filename)) {
                loadScript(fileUrl, cb)
            } else if (/.css$/.test(filename)) {
                loadStyle(fileUrl)
            }
        })
    }
}