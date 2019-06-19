/**
 * WAR MACHINE MODULE
 *
 * This package is used for composing micro-fronteds.
 * It gets your apps javascript and styles
 * attaches it to the dom element you provided and your app gets
 * initialized in that dom element
 */

const DEFAULT_VERSION = 'master'
const SCRIPT_STATE = {
    loaded: 'loaded',
    complete: 'complete'
}
const ERROR_MESSAGES = {
    elementNeeded: 'must include \'el\' property to scout options',
    appPropertyNeeded: 'must include \'app\' property to scout options'
}
/**
 * Strips `.` or `#` characters
 */
function sanitized (input) {
    if (!input.length) { return '' }

    return input.toLowerCase()
        .replace(/^[#.]*/, '')
}

/**
 * Converts an html5 tag format (e.g. my-component) to camelCase (e.g. myComponent)
 */
function camelCase (input) {
    return sanitized(input)
        .replace(/-(.)/g, (match, group) => {
            return group.toUpperCase()
        }).replace(/^[\S]/, (match) => {
            return match.toLowerCase()
        })
}

/**
 * Get app version
 */
function getVersion (packageName) {
    const version = window.__env &&
        window.__env.pluginVersions &&
        window.__env.pluginVersions[packageName]

    return version || DEFAULT_VERSION
}

function loadScript(url, callback){
    const script = document.createElement('script')
    script.type = 'text/javascript'

    /**
     * First part needed for IE support 'else' is for other browsers
     */
    if (script.readyState){
        script.onreadystatechange = () => {
            if (script.readyState === SCRIPT_STATE.loaded ||
                script.readyState === SCRIPT_STATE.complete){
                script.onreadystatechange = null
                callback()
            }
        }
    } else {
        script.onload = () => {
            callback()
        }
    }

    script.src = url
    document.getElementsByTagName('head')[0].appendChild(script)
}

function loadStyle(url){
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = url

    document.getElementsByTagName('head')[0].appendChild(link)
}

/**
 * Callback will be fired after each javascript script is loaded
 */
module.exports = function (options, callback) {
    if (!options.el) throw new Error(ERROR_MESSAGES.elementNeeded)
    /**
     * If no base url is provided, require app and cdnUrl
     */
    if (!options.baseUrl) {
        if (!options.app) throw new Error(ERROR_MESSAGES.appPropertyNeeded)
        if (!options.version) options.version = getVersion(options.app) // no version set on this ENV default to 'master' build
    }
    if (typeof callback !== 'function') {
        callback = () => {
            const init = camelCase(options.el)
            typeof global[init] === 'function'
                ? global[init](options.el)
                : global[init].default(options.el)
        }
    }

    /**
     * When using the 'master' version, never cache so browsers automatically pick up new versions
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

    /**
     * If binding element is found on page inject assets
     */
    if (typeof (el) !== undefined && el.length) {
        const baseUrl = options.baseUrl || options.cdnUrl + '/' + options.app + '/' + options.version
        options.files.forEach((filename) => {
            const fileUrl = baseUrl + '/' + filename + preventCache
            if (/.js$/.test(filename)) {
                loadScript(fileUrl, callback)
            } else if (/.css$/.test(filename)) {
                loadStyle(fileUrl)
            }
        })
    }
}
