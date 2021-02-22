'use strict'

var fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const appRoot = require('app-root-path')
const puppeteer = require('puppeteer')
const fileStore = require('config').get('file-store')

exports.templateThumbnail = async (template, context) => {
    const log = context.logger.start('services/template-image:htmlToImage')

    const fileName = `template-${Date.now()}.png`
    const destination = path.join(appRoot.path, `${fileStore.dir}/${fileName}`)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(template)
    await page.screenshot({ path: destination })
    await browser.close()

    const thumbnail = await exports.thumbnail(destination)

    // await fs.unlinkSync(destination)
    log.end()
    return thumbnail
}

exports.thumbnail = (path) => {
    if (!path) {
        return Promise.resolve(null)
    }

    return new Promise((resolve, reject) => {
        return jimp.read(path).then(function (lenna) {
            if (!lenna) {
                return resolve(null)
            }
            var a = lenna
                // .resize(500, 500) // resize
                //     .quality(100) // set JPEG quality
                .getBase64(jimp.MIME_JPEG, function (result, base64, src) {
                    return resolve(base64)
                })
        }).catch(function (err) {
            reject(err)
        })
    })
}
