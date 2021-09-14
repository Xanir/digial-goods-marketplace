import { apiCall } from './apiConfig.js'
import cookier from 'simple-cookie'

let activeApiKey = ''

const apiConfig = new Promise(async function(resolve, reject) {
    try {
        const res = await apiCall('GET', 'config')

        const sdkUnityVersion = res.data.sdkUnityVersion
        const apiKey = res.data.apiKey
        const clientApiKey = res.data.clientApiKey

        activeApiKey = clientApiKey

        resolve({
            sdkUnityVersion,
            clientApiKey,
            apiKey,
        })
    } catch (e) {
        reject(e)
    }
});
apiConfig.catch(() => {'failed to get API key'})

const getPath = (apiPath) => {
    let urlPath = apiPath
    if (activeApiKey) {
        urlPath += `?apiKey=${activeApiKey}`
    }
    return urlPath
}

class VRChatApi {
    #sessionToken = ''
    #cookies = {}

    get cookie() {
        return this.#cookies
    }

    #_isTwoFactorAuthRequired = false
    get isTwoFactorAuthRequired() {
        return this.#_isTwoFactorAuthRequired
    }

    #_isAuthenticated = false
    get isAuthenticated() {
        return this.#_isAuthenticated
    }

    #updateCookies(cookies) {
        if (!Array.isArray(cookies)) return
        for (const cookieData of cookies) {
            const cookie = cookier.parse(cookieData)
            this.#cookies[cookie.name] = cookie
            if (cookie.name === 'auth') {
                this.#sessionToken = cookie.name
                break
            }
        }
        if (this.#sessionToken) {
            #cookies = {}
        }
    }

    #getCookies() {
        return cookier.tokenize(Object.values(this.#cookies));
    }

    async login(username, password) {
        let authLogin = Buffer.from(`${username}:${password}`)
        authLogin = authLogin.toString('base64')
        const headers = {
            'Authorization': `Basic ${authLogin}`,
        }
        try {
            const apiPath = getPath('auth/user')
            const res = await apiCall('GET', apiPath, headers)

            this.#updateCookies(res.headers['set-cookie'])
            if (res?.data?.requiresTwoFactorAuth) {
                this.#_isTwoFactorAuthRequired = true
            } else {
                this.#_isAuthenticated = true
            }
        } catch (e) {
            throw Error('Bad creds')
        }
    }

    async login2FA(twoFactorToken) {
        const headers = {
            'Cookie': this.#getCookies(),
        }
        try {
            const apiPath = getPath('auth/twofactorauth/totp/verify')
            const res = await apiCall('POST', apiPath, headers, {
              "code": ""+twoFactorToken
            })

            this.#updateCookies(res.headers['set-cookie'])
            this.#_isAuthenticated = true
        } catch (e) {
            console.log(e)
            throw Error('Bad 2fa code')
        }
    }
}

export default VRChatApi
