
import readline from 'readline'
import VRChatApi from './api.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const username = process.argv[2]

let password = null
let twoFactorAuth = null

const run = async function() {
    const vrchatApi = new VRChatApi()
    rl.question("Password: ", async function(iPassword) {
        try {
            await vrchatApi.login(username, iPassword)
        } catch (e) {
            console.log(e)
        }
        if (vrchatApi.isTwoFactorAuthRequired) {
            rl.question("2FA? ", async function(authToken) {
                try {
                    await vrchatApi.login2FA(authToken)
                    console.log(vrchatApi.isAuthenticated)
                    console.log(vrchatApi.cookie)
                } catch (e) {
                    console.log(e)
                }
                rl.close();
            });
        }
    });
}

run()
