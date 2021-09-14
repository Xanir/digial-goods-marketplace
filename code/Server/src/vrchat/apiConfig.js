import https from 'https'

const defaultHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'NodeJS'
}

const getRequestConfig = (apiPath) => {
    let urlPath = `/api/1/${apiPath}`

    return {
        port: 443,
        host: 'api.vrchat.cloud',
        path: urlPath,
        headers: Object.assign({}, defaultHeaders)
    }
}

const apiCall = async (apiMethod, apiPath, headers, body) => {
    const apiConfig = getRequestConfig(apiPath)
    apiConfig.method = apiMethod
    apiConfig.headers = Object.assign(apiConfig.headers, headers)

    if (body) {
        body = JSON.stringify(body)
        const contentHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
        apiConfig.headers = Object.assign(apiConfig.headers, contentHeaders)
    }

    return new Promise(function(resolve, reject) {
        const request = https.request(apiConfig, (res) => {
            if (res.statusCode !== 200) {
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    reject({
                        data: rawData,
                        headers: res.headers,
                    })
                });
            } else {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        resolve({
                            data: parsedData,
                            headers: res.headers,
                        })
                    } catch (e) {
                        reject(e)
                    }
                });
            }
        })
        if (body) {
            request.write(body)
        }
        request.on('error', (e) => {
            reject(e)
        })
        request.end()
    });
}

export {
    apiCall,
}
